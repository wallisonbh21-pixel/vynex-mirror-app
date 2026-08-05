-- Migration: Deep Security Hardening for Meetings and Functions
-- Date: 2026-08-05 23:45:00

-- 1. MEETING IDENTITY SPOOFING PROTECTION
-- Hardening RLS policies for meetings and existing participants

-- Fix meetings: Force created_by = auth.uid()
DROP POLICY IF EXISTS "Organizers can create meetings" ON public.meetings;
CREATE POLICY "Organizers can create meetings"
ON public.meetings
FOR INSERT
TO authenticated
WITH CHECK (
    (created_by = auth.uid()) OR 
    public.has_role(auth.uid(), 'admin')
);

-- Fix meeting_participants: Restrict joining/inviting to own user or admins
DROP POLICY IF EXISTS "participants_admin_all" ON public.meeting_participants;
CREATE POLICY "participants_admin_all"
ON public.meeting_participants
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 2. SECURITY DEFINER HARDENING
-- Applying least privilege to functions identified in audit

-- Revoke EXECUTE from PUBLIC for all SECURITY DEFINER functions
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.admin_exists() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_project_assets_public(uuid, text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.claim_project(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.set_client_token(text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.check_prospecting_assignment() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_project_public_data_by_token(text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.generate_meeting_link() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_project_studio_data_public(uuid, text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_project_public_data(uuid, text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.leads_close_to_pipeline() FROM PUBLIC;

-- A) Restrict triggers strictly to service_role
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role;
GRANT EXECUTE ON FUNCTION public.check_prospecting_assignment() TO service_role;

-- B) Restrict RLS helpers and internal logic to authenticated
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.admin_exists() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.claim_project(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.leads_close_to_pipeline() TO authenticated, service_role;

-- C) Portal functions: keep for anon/authenticated (Portal uses anon access with token)
GRANT EXECUTE ON FUNCTION public.get_project_assets_public(uuid, text) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_project_public_data_by_token(text) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.generate_meeting_link() TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_project_studio_data_public(uuid, text) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_project_public_data(uuid, text) TO anon, authenticated, service_role;

-- D) Sensitive session management strictly to service_role
GRANT EXECUTE ON FUNCTION public.set_client_token(text) TO service_role;

-- Ensure search_path is secure for all functions
ALTER FUNCTION public.has_role(uuid, public.app_role) SET search_path = public;
ALTER FUNCTION public.admin_exists() SET search_path = public;
ALTER FUNCTION public.handle_new_user() SET search_path = public;
ALTER FUNCTION public.get_project_assets_public(uuid, text) SET search_path = public;
ALTER FUNCTION public.claim_project(uuid) SET search_path = public;
ALTER FUNCTION public.set_client_token(text) SET search_path = public;
ALTER FUNCTION public.check_prospecting_assignment() SET search_path = public;
ALTER FUNCTION public.get_project_public_data_by_token(text) SET search_path = public;
ALTER FUNCTION public.generate_meeting_link() SET search_path = public;
ALTER FUNCTION public.get_project_studio_data_public(uuid, text) SET search_path = public;
ALTER FUNCTION public.get_project_public_data(uuid, text) SET search_path = public;
ALTER FUNCTION public.leads_close_to_pipeline() SET search_path = public;
