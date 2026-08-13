
-- 1. REFERRAL TOKENS
CREATE TABLE IF NOT EXISTS public.referral_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    token TEXT UNIQUE NOT NULL,
    seller_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    is_institutional BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    created_by UUID REFERENCES auth.users(id)
);

-- 2. LEAD ATTRIBUTION
CREATE TABLE IF NOT EXISTS public.lead_attribution (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID REFERENCES public.leads(id) ON DELETE CASCADE NOT NULL,
    originator_id UUID REFERENCES auth.users(id) NOT NULL,
    current_responsible_id UUID REFERENCES auth.users(id) NOT NULL,
    referral_token_id UUID REFERENCES public.referral_tokens(id) ON DELETE SET NULL,
    attributed_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    UNIQUE(lead_id)
);

-- 3. SERVICES CATALOG
CREATE TABLE IF NOT EXISTS public.services_catalog (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    setup_price NUMERIC(10,2) DEFAULT 0,
    creation_price NUMERIC(10,2) DEFAULT 0,
    monthly_price NUMERIC(10,2) DEFAULT 0,
    seller_commission_rate NUMERIC(5,2) DEFAULT 0,
    creator_remuneration NUMERIC(10,2) DEFAULT 0,
    traffic_manager_remuneration NUMERIC(10,2) DEFAULT 0,
    billing_cycle TEXT DEFAULT 'monthly',
    briefing_questions JSONB DEFAULT '[]'::jsonb,
    additional_config JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 4. GRANTS
GRANT SELECT ON public.referral_tokens TO authenticated;
GRANT ALL ON public.referral_tokens TO service_role;

GRANT SELECT ON public.lead_attribution TO authenticated;
GRANT ALL ON public.lead_attribution TO service_role;

GRANT SELECT ON public.services_catalog TO authenticated;
GRANT ALL ON public.services_catalog TO service_role;

-- 5. RLS
ALTER TABLE public.referral_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_attribution ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services_catalog ENABLE ROW LEVEL SECURITY;

-- Referral Tokens Policies
CREATE POLICY "Referral tokens are viewable by authenticated users"
ON public.referral_tokens FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Only admins can manage referral tokens"
ON public.referral_tokens FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Lead Attribution Policies
CREATE POLICY "Lead attribution viewable by responsible or originator"
ON public.lead_attribution FOR SELECT
TO authenticated
USING (
    current_responsible_id = auth.uid() OR 
    originator_id = auth.uid() OR 
    public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Only admins can update lead attribution"
ON public.lead_attribution FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Services Catalog Policies
CREATE POLICY "Services catalog viewable by all authenticated"
ON public.services_catalog FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Only admins can manage services catalog"
ON public.services_catalog FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 6. INITIAL DATA SEED (Services Catalog)
INSERT INTO public.services_catalog (name, category, description, briefing_questions)
VALUES 
('Landing Page', 'web', 'Página única de conversão de alta performance.', '[]'::jsonb),
('Site Institucional', 'web', 'Site completo para apresentação de empresa.', '[]'::jsonb),
('Loja Virtual', 'ecommerce', 'E-commerce completo com gestão de estoque.', '[]'::jsonb),
('Gestão de Tráfego Pago', 'ads', 'Gestão profissional de anúncios (Meta/Google).', '[]'::jsonb);

-- 7. GENERATE REFERRAL TOKENS FOR EXISTING SELLERS
DO $$
DECLARE
    seller_record RECORD;
    new_token TEXT;
BEGIN
    FOR seller_record IN 
        SELECT DISTINCT user_id 
        FROM public.user_roles 
        WHERE role = 'vendedor'
    LOOP
        IF NOT EXISTS (SELECT 1 FROM public.referral_tokens WHERE seller_id = seller_record.user_id) THEN
            new_token := lower(substring(replace(gen_random_uuid()::text, '-', ''), 1, 12));
            
            INSERT INTO public.referral_tokens (token, seller_id, is_institutional)
            VALUES (new_token, seller_record.user_id, FALSE);
        END IF;
    END LOOP;
END $$;
