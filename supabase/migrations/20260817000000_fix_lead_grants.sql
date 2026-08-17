-- Garantir privilégios para as tabelas de leads e atribuição
GRANT INSERT, SELECT, UPDATE, DELETE ON public.leads TO authenticated;
GRANT ALL ON public.leads TO service_role;
GRANT INSERT ON public.leads TO anon;

GRANT INSERT, SELECT, UPDATE, DELETE ON public.lead_attribution TO authenticated;
GRANT ALL ON public.lead_attribution TO service_role;
GRANT INSERT ON public.lead_attribution TO anon;

GRANT INSERT, SELECT, UPDATE, DELETE ON public.lead_activities TO authenticated;
GRANT ALL ON public.lead_activities TO service_role;
GRANT INSERT ON public.lead_activities TO anon;
