
-- Hardening final dos privilégios SECURITY DEFINER da ScaleNexus

BEGIN;

-- 1. check_prospecting_assignment (Trigger function)
REVOKE ALL ON FUNCTION public.check_prospecting_assignment() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.check_prospecting_assignment() FROM anon;
REVOKE ALL ON FUNCTION public.check_prospecting_assignment() FROM authenticated;
GRANT EXECUTE ON FUNCTION public.check_prospecting_assignment() TO service_role;

-- 2. Funções do Portal (Acesso anon com token)
-- get_project_public_data_by_token
REVOKE ALL ON FUNCTION public.get_project_public_data_by_token(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_project_public_data_by_token(text) TO anon, authenticated, service_role;

-- get_project_studio_data_public
REVOKE ALL ON FUNCTION public.get_project_studio_data_public(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_project_studio_data_public(uuid, text) TO anon, authenticated, service_role;

-- get_project_assets_public
REVOKE ALL ON FUNCTION public.get_project_assets_public(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_project_assets_public(uuid, text) TO anon, authenticated, service_role;

-- 3. get_project_public_data (Legado/Interno - auditar e restringir)
REVOKE ALL ON FUNCTION public.get_project_public_data(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_project_public_data(uuid, text) TO authenticated, service_role;

-- 4. has_role (RLS Helper)
REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, service_role;

-- 5. admin_exists (Auth/Admin Helper)
REVOKE ALL ON FUNCTION public.admin_exists() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.admin_exists() FROM anon;
GRANT EXECUTE ON FUNCTION public.admin_exists() TO authenticated, service_role;

-- 6. claim_project (Criador Action)
REVOKE ALL ON FUNCTION public.claim_project(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.claim_project(uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.claim_project(uuid) TO authenticated, service_role;

-- 7. handle_new_user (Trigger function)
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM anon;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM authenticated;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role;

-- 8. set_client_token (Depreciada)
REVOKE ALL ON FUNCTION public.set_client_token(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.set_client_token(text) FROM anon;
REVOKE ALL ON FUNCTION public.set_client_token(text) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.set_client_token(text) TO service_role;

-- 9. leads_close_to_pipeline (Trigger function)
REVOKE ALL ON FUNCTION public.leads_close_to_pipeline() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.leads_close_to_pipeline() FROM anon;
REVOKE ALL ON FUNCTION public.leads_close_to_pipeline() FROM authenticated;
GRANT EXECUTE ON FUNCTION public.leads_close_to_pipeline() TO service_role;

-- 10. Garantir search_path em todas as funções (Auditoria confirmou, mas reforçando via migration se necessário)
-- As funções já possuem search_path=public configurado conforme a leitura.

COMMIT;
