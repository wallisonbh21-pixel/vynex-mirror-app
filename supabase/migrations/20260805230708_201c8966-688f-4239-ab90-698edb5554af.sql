-- MIGRATION: HARDENING SEGURANÇA FASE 4 (DEEP SCAN FIXES)
-- 1. SECURITY DEFINER HARDENING
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.admin_exists() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_project_assets_public(uuid, text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_project_public_data(uuid, text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.claim_project(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.set_client_token(text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_project_public_data_by_token(text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.check_prospecting_assignment() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.generate_meeting_link() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_project_studio_data_public(uuid, text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.leads_close_to_pipeline() FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role;
GRANT EXECUTE ON FUNCTION public.check_prospecting_assignment() TO service_role;
GRANT EXECUTE ON FUNCTION public.generate_meeting_link() TO service_role;

GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_exists() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_project_public_data(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.claim_project(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.leads_close_to_pipeline() TO authenticated;

GRANT EXECUTE ON FUNCTION public.get_project_assets_public(uuid, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_project_public_data_by_token(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_project_studio_data_public(uuid, text) TO anon, authenticated;

GRANT EXECUTE ON FUNCTION public.set_client_token(text) TO service_role;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO service_role;

-- 2. MEETING IDENTITY PROTECTION
DROP POLICY IF EXISTS "Organizers can create meetings" ON public.meetings;
CREATE POLICY "Organizers can create meetings"
ON public.meetings
FOR INSERT
TO authenticated
WITH CHECK (
    (created_by = auth.uid()) 
    OR public.has_role(auth.uid(), 'admin')
);

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'meeting_messages') THEN
        DROP POLICY IF EXISTS "Participants can send meeting messages" ON public.meeting_messages;
        CREATE POLICY "Participants can send meeting messages"
        ON public.meeting_messages
        FOR INSERT
        TO authenticated
        WITH CHECK (
            (sender_id = auth.uid()) 
            AND EXISTS (
                SELECT 1 FROM public.meeting_participants
                WHERE meeting_id = meeting_messages.meeting_id
                AND user_id = auth.uid()
            )
        );
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'meeting_notes') THEN
        DROP POLICY IF EXISTS "Participants can create notes" ON public.meeting_notes;
        CREATE POLICY "Participants can create notes"
        ON public.meeting_notes
        FOR INSERT
        TO authenticated
        WITH CHECK (
            (author_id = auth.uid()) 
            AND EXISTS (
                SELECT 1 FROM public.meeting_participants
                WHERE meeting_id = meeting_notes.meeting_id
                AND user_id = auth.uid()
            )
        );
    END IF;
END $$;
