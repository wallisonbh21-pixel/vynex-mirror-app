CREATE TABLE public.nexusbuild_web_researches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  conversation_id uuid NOT NULL REFERENCES public.nexusbuild_conversations(id) ON DELETE CASCADE,
  project_id uuid REFERENCES public.projects(id) ON DELETE SET NULL,
  query text NOT NULL,
  objective text NOT NULL,
  sources jsonb NOT NULL DEFAULT '[]'::jsonb,
  result_summary text,
  status text NOT NULL DEFAULT 'OK' CHECK (status IN ('OK','ERRO')),
  duration_ms integer NOT NULL DEFAULT 0 CHECK (duration_ms >= 0),
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.nexusbuild_web_researches TO authenticated;
GRANT ALL ON public.nexusbuild_web_researches TO service_role;

ALTER TABLE public.nexusbuild_web_researches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuario autorizado le suas pesquisas web"
  ON public.nexusbuild_web_researches FOR SELECT TO authenticated
  USING (user_id = auth.uid() AND public.can_use_nexusbuild(auth.uid()));

CREATE POLICY "Usuario autorizado registra suas pesquisas web"
  ON public.nexusbuild_web_researches FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND public.can_use_nexusbuild(auth.uid())
    AND EXISTS (
      SELECT 1 FROM public.nexusbuild_conversations c
      WHERE c.id = conversation_id AND c.user_id = auth.uid()
    )
    AND (project_id IS NULL OR EXISTS (
      SELECT 1 FROM public.projects p WHERE p.id = project_id
    ))
  );

CREATE INDEX idx_nexusbuild_web_researches_conversation
  ON public.nexusbuild_web_researches (conversation_id, created_at DESC);
CREATE INDEX idx_nexusbuild_web_researches_user
  ON public.nexusbuild_web_researches (user_id, created_at DESC);