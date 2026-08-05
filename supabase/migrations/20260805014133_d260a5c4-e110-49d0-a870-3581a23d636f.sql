ALTER TABLE public.prospecting_opportunities 
ADD COLUMN IF NOT EXISTS lat DOUBLE PRECISION DEFAULT NULL,
ADD COLUMN IF NOT EXISTS lon DOUBLE PRECISION DEFAULT NULL;

-- Ensure roles have permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.prospecting_opportunities TO authenticated;
GRANT ALL ON public.prospecting_opportunities TO service_role;
