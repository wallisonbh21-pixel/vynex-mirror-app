-- 1. Relaxar restrições NOT NULL na tabela lead_attribution
ALTER TABLE public.lead_attribution ALTER COLUMN originator_id DROP NOT NULL;
ALTER TABLE public.lead_attribution ALTER COLUMN current_responsible_id DROP NOT NULL;

-- 2. Garantir permissões de inserção para usuários anônimos
GRANT INSERT ON public.leads TO anon;
GRANT INSERT ON public.lead_attribution TO anon;
GRANT INSERT ON public.lead_activities TO anon;

-- 3. Criar políticas de RLS para permitir inserção anônima
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public leads insert') THEN
        CREATE POLICY "Public leads insert" ON public.leads FOR INSERT TO anon WITH CHECK (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public attribution insert') THEN
        CREATE POLICY "Public attribution insert" ON public.lead_attribution FOR INSERT TO anon WITH CHECK (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public activities insert') THEN
        CREATE POLICY "Public activities insert" ON public.lead_activities FOR INSERT TO anon WITH CHECK (true);
    END IF;
END $$;
