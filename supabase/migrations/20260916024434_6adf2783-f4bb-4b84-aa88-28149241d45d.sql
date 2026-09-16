CREATE TABLE public.nexusbuild_memories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id uuid REFERENCES public.projects(id) ON DELETE SET NULL,
  kind text NOT NULL DEFAULT 'FATO' CHECK (kind IN ('PREFERENCIA','FATO','DECISAO','PROJETO','CONTEXTO')),
  content text NOT NULL,
  source text NOT NULL DEFAULT 'conversa',
  relevance smallint NOT NULL DEFAULT 3 CHECK (relevance BETWEEN 1 AND 5),
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_nexusbuild_memories_user ON public.nexusbuild_memories (user_id, active, relevance DESC, created_at DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.nexusbuild_memories TO authenticated;
GRANT ALL ON public.nexusbuild_memories TO service_role;
ALTER TABLE public.nexusbuild_memories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuario autorizado gerencia suas memorias"
  ON public.nexusbuild_memories FOR ALL TO authenticated
  USING (user_id = auth.uid() AND public.can_use_nexusbuild(auth.uid()))
  WITH CHECK (user_id = auth.uid() AND public.can_use_nexusbuild(auth.uid()));

CREATE TABLE public.nexusbuild_tool_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  conversation_id uuid REFERENCES public.nexusbuild_conversations(id) ON DELETE CASCADE,
  tool_name text NOT NULL,
  status text NOT NULL DEFAULT 'OK' CHECK (status IN ('OK','ERRO','NEGADO','INDISPONIVEL')),
  duration_ms integer,
  summary text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_nexusbuild_tool_runs_user ON public.nexusbuild_tool_runs (user_id, created_at DESC);

GRANT SELECT ON public.nexusbuild_tool_runs TO authenticated;
GRANT ALL ON public.nexusbuild_tool_runs TO service_role;
ALTER TABLE public.nexusbuild_tool_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuario autorizado le seus registros de ferramenta"
  ON public.nexusbuild_tool_runs FOR SELECT TO authenticated
  USING (user_id = auth.uid() AND public.can_use_nexusbuild(auth.uid()));