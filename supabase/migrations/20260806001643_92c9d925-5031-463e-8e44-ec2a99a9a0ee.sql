-- FINAL HARDENING OF SECURITY DEFINER FUNCTIONS
-- Revoking global PUBLIC execute and restricting to authorized roles only.

-- 1. Revoke PUBLIC from all sensitive functions
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.admin_exists() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.claim_project(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.set_client_token(text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_project_assets_public(uuid, text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_project_studio_data_public(uuid, text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_project_public_data_by_token(text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_project_public_data(uuid, text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.validate_withdrawal_request() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.protect_financial_integrity() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.check_prospecting_assignment() FROM PUBLIC;

-- 2. Restore granular access
-- RLS Helpers: Authenticated only
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.admin_exists() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.claim_project(uuid) TO authenticated, service_role;

-- Approval Portal Functions: Anon AND Authenticated
GRANT EXECUTE ON FUNCTION public.set_client_token(text) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_project_assets_public(uuid, text) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_project_studio_data_public(uuid, text) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_project_public_data_by_token(text) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_project_public_data(uuid, text) TO anon, authenticated, service_role;

-- Trigger Functions: Service Role only (triggers bypass RLS and direct execution is dangerous)
GRANT EXECUTE ON FUNCTION public.validate_withdrawal_request() TO service_role;
GRANT EXECUTE ON FUNCTION public.protect_financial_integrity() TO service_role;
GRANT EXECUTE ON FUNCTION public.check_prospecting_assignment() TO service_role;

-- 3. Ensure search_path is secure for all SD functions
ALTER FUNCTION public.has_role(uuid, app_role) SET search_path = public;
ALTER FUNCTION public.admin_exists() SET search_path = public;
ALTER FUNCTION public.claim_project(uuid) SET search_path = public;
ALTER FUNCTION public.set_client_token(text) SET search_path = public;
ALTER FUNCTION public.get_project_assets_public(uuid, text) SET search_path = public;
ALTER FUNCTION public.get_project_studio_data_public(uuid, text) SET search_path = public;
ALTER FUNCTION public.get_project_public_data_by_token(text) SET search_path = public;
ALTER FUNCTION public.get_project_public_data(uuid, text) SET search_path = public;
ALTER FUNCTION public.validate_withdrawal_request() SET search_path = public;
ALTER FUNCTION public.protect_financial_integrity() SET search_path = public;
ALTER FUNCTION public.check_prospecting_assignment() SET search_path = public;
ALTER FUNCTION public.handle_new_user() SET search_path = public;
ALTER FUNCTION public.generate_meeting_link() SET search_path = public;
ALTER FUNCTION public.leads_close_to_pipeline() SET search_path = public;
