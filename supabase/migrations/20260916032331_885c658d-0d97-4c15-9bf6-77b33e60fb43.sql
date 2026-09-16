CREATE TABLE public.nexusbuild_build_operations (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  conversation_id uuid,
  project_id uuid,
  operation_type text NOT NULL,
  params jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'OK',
  detail text,
  duration_ms integer,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.nexusbuild_build_operations TO authenticated;
GRANT ALL ON public.nexusbuild_build_operations TO service_role;

ALTER TABLE public.nexusbuild_build_operations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuario autorizado le suas operacoes de build"
ON public.nexusbuild_build_operations
FOR SELECT TO authenticated
USING (user_id = auth.uid() AND (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'criador'::app_role)));

CREATE POLICY "Usuario autorizado registra suas operacoes de build"
ON public.nexusbuild_build_operations
FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid() AND (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'criador'::app_role)));

CREATE INDEX idx_nexusbuild_build_ops_user ON public.nexusbuild_build_operations(user_id, created_at DESC);