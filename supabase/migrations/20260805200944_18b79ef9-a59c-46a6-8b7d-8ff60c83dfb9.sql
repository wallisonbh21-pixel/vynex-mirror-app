-- set_client_token needs to be executable by anon for the approval portal
-- but admin_exists, claim_project, has_role should be restricted to authenticated users only.
-- claim_project specifically is for criadores/admins.
-- has_role is used in RLS policies, so it MUST be executable by the roles that use those policies.

-- Restricted execute for admin_exists (only admins/authenticated should check this)
REVOKE EXECUTE ON FUNCTION public.admin_exists() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.admin_exists() FROM anon;
GRANT EXECUTE ON FUNCTION public.admin_exists() TO authenticated;

-- claim_project: already restricted by logic, but let's restrict at the function level too
REVOKE EXECUTE ON FUNCTION public.claim_project(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.claim_project(uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.claim_project(uuid) TO authenticated;

-- has_role: needed for RLS, so must be executable by authenticated users
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;

-- set_client_token: needed by anon for public approval portal
-- (Already handled, but explicit for clarity)
GRANT EXECUTE ON FUNCTION public.set_client_token(text) TO anon;
GRANT EXECUTE ON FUNCTION public.set_client_token(text) TO authenticated;

-- Ensure trigger functions are strictly internal
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon;

REVOKE EXECUTE ON FUNCTION public.leads_close_to_pipeline() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.leads_close_to_pipeline() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.leads_close_to_pipeline() FROM anon;

REVOKE EXECUTE ON FUNCTION public.prospecting_set_level() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.prospecting_set_level() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.prospecting_set_level() FROM anon;

REVOKE EXECUTE ON FUNCTION public.handle_site_plan_updated() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.handle_site_plan_updated() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_site_plan_updated() FROM anon;
