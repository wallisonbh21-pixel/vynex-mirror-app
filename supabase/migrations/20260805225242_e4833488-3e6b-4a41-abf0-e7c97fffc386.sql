-- 1. REVOKE PUBLIC EXECUTE from all SECURITY DEFINER functions in public schema
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.admin_exists() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_project_assets_public(uuid, text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_project_studio_data_public(uuid, text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_project_public_data(uuid, text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.leads_close_to_pipeline() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.claim_project(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.set_client_token(text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.check_prospecting_assignment() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_project_public_data_by_token(text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.generate_meeting_link() FROM PUBLIC;

-- 2. Apply Least Privilege Grants
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_exists() TO authenticated;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role;
GRANT EXECUTE ON FUNCTION public.check_prospecting_assignment() TO service_role;
GRANT EXECUTE ON FUNCTION public.get_project_assets_public(uuid, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_project_studio_data_public(uuid, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_project_public_data_by_token(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_project_public_data(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.claim_project(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.generate_meeting_link() TO authenticated;

-- 3. Lock down sensitive functions
REVOKE ALL ON FUNCTION public.set_client_token(text) FROM anon, authenticated, PUBLIC;
GRANT EXECUTE ON FUNCTION public.set_client_token(text) TO service_role;

-- 4. Ensure search_path is secure
ALTER FUNCTION public.has_role(uuid, app_role) SET search_path = public;
ALTER FUNCTION public.admin_exists() SET search_path = public;
ALTER FUNCTION public.handle_new_user() SET search_path = public;
ALTER FUNCTION public.get_project_assets_public(uuid, text) SET search_path = public;
ALTER FUNCTION public.get_project_studio_data_public(uuid, text) SET search_path = public;
ALTER FUNCTION public.get_project_public_data(uuid, text) SET search_path = public;
ALTER FUNCTION public.leads_close_to_pipeline() SET search_path = public;
ALTER FUNCTION public.claim_project(uuid) SET search_path = public;
ALTER FUNCTION public.set_client_token(text) SET search_path = public;
ALTER FUNCTION public.check_prospecting_assignment() SET search_path = public;
ALTER FUNCTION public.get_project_public_data_by_token(text) SET search_path = public;
ALTER FUNCTION public.generate_meeting_link() SET search_path = public;
