ALTER TABLE public.leads 
ADD COLUMN IF NOT EXISTS lat double precision,
ADD COLUMN IF NOT EXISTS lon double precision,
ADD COLUMN IF NOT EXISTS google_maps_url text;

-- Garantir que as permissões estejam corretas (embora o dono seja postgres, o service_role e authenticated devem ter acesso)
GRANT SELECT, INSERT, UPDATE, DELETE ON public.leads TO authenticated;
GRANT ALL ON public.leads TO service_role;
