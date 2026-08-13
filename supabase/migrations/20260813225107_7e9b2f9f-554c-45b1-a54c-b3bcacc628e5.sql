-- 1. Constraint de segurança: seller_id único para tokens não institucionais
-- Usamos um índice parcial para permitir múltiplos nulos em seller_id (para o institucional)
-- mas garantir que cada vendedor só tenha um token.
CREATE UNIQUE INDEX IF NOT EXISTS unique_seller_active_token 
ON public.referral_tokens (seller_id) 
WHERE (is_institutional = false AND is_active = true);

-- 2. Função para criar token automaticamente
CREATE OR REPLACE FUNCTION public.handle_new_seller_token()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    new_token TEXT;
BEGIN
    -- Só age se a role for 'vendedor'
    IF NEW.role = 'vendedor' THEN
        -- Verifica se já existe um token ativo para este vendedor
        IF NOT EXISTS (
            SELECT 1 FROM public.referral_tokens 
            WHERE seller_id = NEW.user_id 
            AND is_active = true 
            AND is_institutional = false
        ) THEN
            -- Gera um token aleatório de 12 caracteres (hex)
            -- Usamos md5(random()::text) para simplicidade e segurança básica de URL
            new_token := substring(md5(random()::text), 1, 12);
            
            INSERT INTO public.referral_tokens (
                seller_id,
                token,
                is_institutional,
                is_active,
                created_by
            ) VALUES (
                NEW.user_id,
                new_token,
                false,
                true,
                NEW.user_id -- Usamos o próprio user_id como criador se não houver contexto
            );
        END IF;
    END IF;
    RETURN NEW;
END;
$$;

-- 3. Trigger na tabela user_roles
DROP TRIGGER IF EXISTS on_vendedor_created ON public.user_roles;
CREATE TRIGGER on_vendedor_created
    AFTER INSERT OR UPDATE ON public.user_roles
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_seller_token();

-- 4. Backfill: Gerar tokens para vendedores existentes que não possuem
-- O trigger acima não dispara para registros existentes, então fazemos manual
-- mas a lógica INSERT no loop do handle_new_seller_token pode ser inspirada aqui:
INSERT INTO public.referral_tokens (seller_id, token, is_institutional, is_active)
SELECT 
    ur.user_id, 
    substring(md5(random()::text), 1, 12),
    false,
    true
FROM public.user_roles ur
WHERE ur.role = 'vendedor'
AND NOT EXISTS (
    SELECT 1 FROM public.referral_tokens rt 
    WHERE rt.seller_id = ur.user_id 
    AND rt.is_active = true
);