-- 1. Metadados
ALTER TABLE public.project_documents
  ADD COLUMN IF NOT EXISTS original_name text,
  ADD COLUMN IF NOT EXISTS safe_name text,
  ADD COLUMN IF NOT EXISTS mime_type text,
  ADD COLUMN IF NOT EXISTS extension text,
  ADD COLUMN IF NOT EXISTS checksum text,
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'pronto',
  ADD COLUMN IF NOT EXISTS error_message text,
  ADD COLUMN IF NOT EXISTS processed_at timestamptz,
  ADD COLUMN IF NOT EXISTS version integer NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS extraction_status text NOT NULL DEFAULT 'pendente',
  ADD COLUMN IF NOT EXISTS extracted_text text,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

UPDATE public.project_documents SET original_name = COALESCE(original_name, name), safe_name = COALESCE(safe_name, name);

ALTER TABLE public.project_documents DROP CONSTRAINT IF EXISTS project_documents_status_check;
ALTER TABLE public.project_documents ADD CONSTRAINT project_documents_status_check
  CHECK (status IN ('enviando','processando','pronto','erro'));
ALTER TABLE public.project_documents DROP CONSTRAINT IF EXISTS project_documents_extraction_status_check;
ALTER TABLE public.project_documents ADD CONSTRAINT project_documents_extraction_status_check
  CHECK (extraction_status IN ('pendente','nao_suportado','concluido','erro'));

CREATE UNIQUE INDEX IF NOT EXISTS project_documents_project_checksum_key
  ON public.project_documents(project_id, checksum) WHERE checksum IS NOT NULL;
CREATE INDEX IF NOT EXISTS project_documents_project_created_idx
  ON public.project_documents(project_id, created_at DESC);
CREATE INDEX IF NOT EXISTS project_documents_status_idx ON public.project_documents(status);

-- 2. Cliente pode enviar documentos para os próprios projetos
DROP POLICY IF EXISTS "Clients upload documents to own projects" ON public.project_documents;
CREATE POLICY "Clients upload documents to own projects"
ON public.project_documents FOR INSERT TO authenticated
WITH CHECK (
  uploaded_by = auth.uid()
  AND project_id IN (
    SELECT p.id FROM public.projects p
    JOIN public.clients c ON c.id = p.client_id
    WHERE c.user_id = auth.uid()
  )
);

-- 3. Storage: cliente pode gravar/ler na pasta dos próprios projetos
DROP POLICY IF EXISTS "Clients upload into own project folder" ON storage.objects;
CREATE POLICY "Clients upload into own project folder"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'project-documents'
  AND (storage.foldername(name))[1] ~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$'
  AND ((storage.foldername(name))[1])::uuid IN (
    SELECT p.id FROM public.projects p
    JOIN public.clients c ON c.id = p.client_id
    WHERE c.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Clients read own project folder" ON storage.objects;
CREATE POLICY "Clients read own project folder"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'project-documents'
  AND (storage.foldername(name))[1] ~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$'
  AND ((storage.foldername(name))[1])::uuid IN (
    SELECT p.id FROM public.projects p
    JOIN public.clients c ON c.id = p.client_id
    WHERE c.user_id = auth.uid()
  )
);

-- 4. Auditoria de eventos
CREATE TABLE IF NOT EXISTS public.project_document_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid REFERENCES public.project_documents(id) ON DELETE SET NULL,
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  actor_id uuid,
  event text NOT NULL CHECK (event IN ('upload','processamento','download','exclusao','erro')),
  detail jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.project_document_events TO authenticated;
GRANT ALL ON public.project_document_events TO service_role;
ALTER TABLE public.project_document_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Team reads document events" ON public.project_document_events;
CREATE POLICY "Team reads document events" ON public.project_document_events
FOR SELECT TO authenticated USING (
  public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'vendedor') OR public.has_role(auth.uid(),'criador')
);
DROP POLICY IF EXISTS "Clients read own document events" ON public.project_document_events;
CREATE POLICY "Clients read own document events" ON public.project_document_events
FOR SELECT TO authenticated USING (
  project_id IN (SELECT p.id FROM public.projects p JOIN public.clients c ON c.id = p.client_id WHERE c.user_id = auth.uid())
);
DROP POLICY IF EXISTS "Authorized users write document events" ON public.project_document_events;
CREATE POLICY "Authorized users write document events" ON public.project_document_events
FOR INSERT TO authenticated WITH CHECK (
  actor_id = auth.uid() AND (
    public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'vendedor') OR public.has_role(auth.uid(),'criador')
    OR project_id IN (SELECT p.id FROM public.projects p JOIN public.clients c ON c.id = p.client_id WHERE c.user_id = auth.uid())
  )
);
CREATE INDEX IF NOT EXISTS project_document_events_project_idx ON public.project_document_events(project_id, created_at DESC);

-- 5. Trechos (preparacao para IA)
CREATE TABLE IF NOT EXISTS public.project_document_chunks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid NOT NULL REFERENCES public.project_documents(id) ON DELETE CASCADE,
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  chunk_index integer NOT NULL,
  content text NOT NULL,
  token_count integer,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (document_id, chunk_index)
);
GRANT SELECT ON public.project_document_chunks TO authenticated;
GRANT ALL ON public.project_document_chunks TO service_role;
ALTER TABLE public.project_document_chunks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Team reads document chunks" ON public.project_document_chunks;
CREATE POLICY "Team reads document chunks" ON public.project_document_chunks
FOR SELECT TO authenticated USING (
  public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'vendedor') OR public.has_role(auth.uid(),'criador')
);
DROP POLICY IF EXISTS "Clients read own document chunks" ON public.project_document_chunks;
CREATE POLICY "Clients read own document chunks" ON public.project_document_chunks
FOR SELECT TO authenticated USING (
  project_id IN (SELECT p.id FROM public.projects p JOIN public.clients c ON c.id = p.client_id WHERE c.user_id = auth.uid())
);
CREATE INDEX IF NOT EXISTS project_document_chunks_doc_idx ON public.project_document_chunks(document_id, chunk_index);

-- 6. Uso por projeto (preparacao para cotas)
CREATE OR REPLACE VIEW public.project_document_usage
WITH (security_invoker = on) AS
SELECT project_id, count(*)::bigint AS file_count, COALESCE(sum(size_bytes),0)::bigint AS total_bytes
FROM public.project_documents GROUP BY project_id;
GRANT SELECT ON public.project_document_usage TO authenticated;