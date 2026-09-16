
ALTER TABLE public.project_document_events DROP CONSTRAINT IF EXISTS project_document_events_event_check;
ALTER TABLE public.project_document_events ADD CONSTRAINT project_document_events_event_check
  CHECK (event IN ('upload','processamento','download','exclusao','erro','geracao','visualizacao','aprovacao','nova_versao','alteracao'));

CREATE TABLE public.project_visual_generations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  conversation_id uuid,
  task_id uuid,
  specialist_id uuid,
  delegated_by uuid,
  prompt text NOT NULL,
  purpose text NOT NULL DEFAULT 'imagem_site',
  aspect_ratio text NOT NULL DEFAULT '1:1',
  model text NOT NULL,
  provider text NOT NULL DEFAULT 'lovable-ai-gateway',
  requested_count integer NOT NULL DEFAULT 1,
  generated_count integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'requested' CHECK (status IN ('requested','generating','ready','failed','rejected')),
  error_message text,
  estimated_cost numeric,
  external_id text,
  reference_asset_id uuid,
  parent_asset_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.project_visual_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  document_id uuid REFERENCES public.project_documents(id) ON DELETE CASCADE,
  generation_id uuid REFERENCES public.project_visual_generations(id) ON DELETE SET NULL,
  parent_asset_id uuid REFERENCES public.project_visual_assets(id) ON DELETE SET NULL,
  conversation_id uuid,
  task_id uuid,
  specialist_id uuid,
  delegated_by uuid,
  created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  kind text NOT NULL DEFAULT 'gerada' CHECK (kind IN ('gerada','referencia')),
  purpose text NOT NULL DEFAULT 'imagem_site',
  title text NOT NULL,
  prompt text,
  origin text NOT NULL DEFAULT 'nexusbuild',
  version integer NOT NULL DEFAULT 1,
  status text NOT NULL DEFAULT 'gerada' CHECK (status IN ('gerada','em_analise','aprovada','rejeitada')),
  approved_by uuid,
  approved_at timestamptz,
  use_in_builder boolean NOT NULL DEFAULT false,
  file_path text NOT NULL,
  mime_type text NOT NULL DEFAULT 'image/png',
  size_bytes integer,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.project_visual_generations
  ADD CONSTRAINT project_visual_generations_reference_fk
  FOREIGN KEY (reference_asset_id) REFERENCES public.project_visual_assets(id) ON DELETE SET NULL;
ALTER TABLE public.project_visual_generations
  ADD CONSTRAINT project_visual_generations_parent_fk
  FOREIGN KEY (parent_asset_id) REFERENCES public.project_visual_assets(id) ON DELETE SET NULL;

CREATE INDEX idx_visual_generations_project ON public.project_visual_generations(project_id, created_at DESC);
CREATE INDEX idx_visual_generations_user ON public.project_visual_generations(user_id, created_at DESC);
CREATE INDEX idx_visual_assets_project ON public.project_visual_assets(project_id, created_at DESC);
CREATE INDEX idx_visual_assets_parent ON public.project_visual_assets(parent_asset_id);
CREATE INDEX idx_visual_assets_conversation ON public.project_visual_assets(conversation_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.project_visual_generations TO authenticated;
GRANT ALL ON public.project_visual_generations TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.project_visual_assets TO authenticated;
GRANT ALL ON public.project_visual_assets TO service_role;

ALTER TABLE public.project_visual_generations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_visual_assets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Team manages visual generations" ON public.project_visual_generations
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'vendedor') OR public.has_role(auth.uid(),'criador'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'vendedor') OR public.has_role(auth.uid(),'criador'));

CREATE POLICY "Clients read own visual generations" ON public.project_visual_generations
  FOR SELECT TO authenticated
  USING (project_id IN (SELECT p.id FROM public.projects p JOIN public.clients c ON c.id = p.client_id WHERE c.user_id = auth.uid()));

CREATE POLICY "Team manages visual assets" ON public.project_visual_assets
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'vendedor') OR public.has_role(auth.uid(),'criador'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'vendedor') OR public.has_role(auth.uid(),'criador'));

CREATE POLICY "Clients read own visual assets" ON public.project_visual_assets
  FOR SELECT TO authenticated
  USING (project_id IN (SELECT p.id FROM public.projects p JOIN public.clients c ON c.id = p.client_id WHERE c.user_id = auth.uid()));

CREATE POLICY "Clients upload visual references" ON public.project_visual_assets
  FOR INSERT TO authenticated
  WITH CHECK (
    created_by = auth.uid() AND kind = 'referencia'
    AND project_id IN (SELECT p.id FROM public.projects p JOIN public.clients c ON c.id = p.client_id WHERE c.user_id = auth.uid())
  );
