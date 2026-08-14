-- Adicionar campos necessários à tabela leads (se não existirem)
ALTER TABLE public.leads 
ADD COLUMN IF NOT EXISTS company TEXT,
ADD COLUMN IF NOT EXISTS email TEXT,
ADD COLUMN IF NOT EXISTS whatsapp TEXT,
ADD COLUMN IF NOT EXISTS city TEXT,
ADD COLUMN IF NOT EXISTS state TEXT,
ADD COLUMN IF NOT EXISTS niche TEXT;

-- Garantir que a tabela lead_attribution tenha RLS e GRANTs corretos
GRANT SELECT ON public.lead_attribution TO authenticated;
GRANT SELECT ON public.profiles TO authenticated;

-- Criar função para buscar nome do vendedor de forma segura
CREATE OR REPLACE FUNCTION public.get_profile_display_name(profile_id UUID)
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(full_name, nickname, 'Usuário')
  FROM public.profiles
  WHERE id = profile_id
$$;

GRANT EXECUTE ON FUNCTION public.get_profile_display_name(UUID) TO authenticated;
