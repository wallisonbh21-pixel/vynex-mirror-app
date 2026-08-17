-- 1. Garantir privilégios básicos de leitura para o catálogo
GRANT SELECT ON public.services_catalog TO anon, authenticated;
GRANT SELECT ON public.referral_tokens TO anon, authenticated;
GRANT SELECT ON public.profiles TO anon, authenticated;

-- 2. Garantir privilégios de escrita para operações de captura
GRANT INSERT, SELECT ON public.leads TO anon, authenticated;
GRANT INSERT, SELECT ON public.lead_attribution TO anon, authenticated;
GRANT INSERT, SELECT ON public.lead_activities TO anon, authenticated;

-- 3. Garantir privilégios totais para o service_role
GRANT ALL ON public.leads TO service_role;
GRANT ALL ON public.lead_attribution TO service_role;
GRANT ALL ON public.lead_activities TO service_role;
GRANT ALL ON public.services_catalog TO service_role;
GRANT ALL ON public.referral_tokens TO service_role;
GRANT ALL ON public.profiles TO service_role;
GRANT ALL ON public.user_roles TO service_role;
