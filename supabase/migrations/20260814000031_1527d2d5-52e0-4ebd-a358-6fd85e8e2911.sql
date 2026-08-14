
-- Permissões para o catálogo de serviços ser acessível publicamente no funil
GRANT SELECT ON public.services_catalog TO anon;
GRANT SELECT ON public.services_catalog TO authenticated;
GRANT ALL ON public.services_catalog TO service_role;

-- Ajuste da política de RLS para permitir leitura pública de serviços ativos
DROP POLICY IF EXISTS "Services catalog viewable by all authenticated" ON public.services_catalog;
CREATE POLICY "Services catalog viewable by everyone" 
ON public.services_catalog 
FOR SELECT 
TO public 
USING (is_active = true);
