
-- Remover NOT NULL de todas as colunas problemáticas da tabela leads
ALTER TABLE public.leads ALTER COLUMN owner_id DROP NOT NULL;
ALTER TABLE public.leads ALTER COLUMN name DROP NOT NULL;
ALTER TABLE public.leads ALTER COLUMN status DROP NOT NULL;
ALTER TABLE public.leads ALTER COLUMN estimated_value DROP NOT NULL;
ALTER TABLE public.leads ALTER COLUMN closed_value DROP NOT NULL;
ALTER TABLE public.leads ALTER COLUMN created_at DROP NOT NULL;
ALTER TABLE public.leads ALTER COLUMN updated_at DROP NOT NULL;

-- Garantir GRANTs para anon
GRANT INSERT ON public.leads TO authenticated, anon, service_role;
GRANT INSERT ON public.lead_attribution TO authenticated, anon, service_role;
GRANT INSERT ON public.lead_activities TO authenticated, anon, service_role;

-- Recriar políticas RLS para anon se necessário
DROP POLICY IF EXISTS "Allow public lead insertion" ON public.leads;
CREATE POLICY "Allow public lead insertion" ON public.leads FOR INSERT TO anon WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public attribution insertion" ON public.lead_attribution;
CREATE POLICY "Allow public attribution insertion" ON public.lead_attribution FOR INSERT TO anon WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public activity insertion" ON public.lead_activities;
CREATE POLICY "Allow public activity insertion" ON public.lead_activities FOR INSERT TO anon WITH CHECK (true);
