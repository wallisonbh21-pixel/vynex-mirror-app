ALTER TABLE public.prospecting_opportunities 
ADD COLUMN IF NOT EXISTS removed_at TIMESTAMPTZ NULL;

GRANT UPDATE (removed_at) ON public.prospecting_opportunities TO authenticated;

COMMENT ON COLUMN public.prospecting_opportunities.removed_at IS 'Timestamp when the user removed/archived this opportunity from their active list.';
