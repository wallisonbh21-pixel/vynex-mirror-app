
-- RLS Hardening for Financials and Meetings

-- 1. TRANSACTIONS
DROP POLICY IF EXISTS "transactions own or admin" ON public.transactions;
DROP POLICY IF EXISTS "transactions_select_own_or_admin" ON public.transactions;
DROP POLICY IF EXISTS "transactions_admin_all" ON public.transactions;

CREATE POLICY "transactions_select_own_or_admin" 
ON public.transactions FOR SELECT 
TO authenticated 
USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "transactions_admin_all" 
ON public.transactions FOR ALL 
TO authenticated 
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 2. WITHDRAWALS
DROP POLICY IF EXISTS "withdrawals own or admin" ON public.withdrawals;
DROP POLICY IF EXISTS "withdrawals_select_own_or_admin" ON public.withdrawals;
DROP POLICY IF EXISTS "withdrawals_insert_own" ON public.withdrawals;
DROP POLICY IF EXISTS "withdrawals_admin_update" ON public.withdrawals;
DROP POLICY IF EXISTS "withdrawals_admin_delete" ON public.withdrawals;

CREATE POLICY "withdrawals_select_own_or_admin" 
ON public.withdrawals FOR SELECT 
TO authenticated 
USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "withdrawals_insert_own" 
ON public.withdrawals FOR INSERT 
TO authenticated 
WITH CHECK (
    user_id = auth.uid() AND 
    status = 'pending' AND 
    paid_at IS NULL
);

CREATE POLICY "withdrawals_admin_update" 
ON public.withdrawals FOR UPDATE 
TO authenticated 
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 5. MEETINGS SPOOFING PREVENTION
DROP POLICY IF EXISTS "meetings_insert_secure" ON public.meetings;
CREATE POLICY "meetings_insert_secure" 
ON public.meetings FOR INSERT 
TO authenticated 
WITH CHECK (created_by = auth.uid());

-- Safely handle meeting_messages and meeting_notes
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'meeting_messages') THEN
        DROP POLICY IF EXISTS "meeting_messages_insert_secure" ON public.meeting_messages;
        EXECUTE 'CREATE POLICY "meeting_messages_insert_secure" ON public.meeting_messages FOR INSERT TO authenticated WITH CHECK (sender_id = auth.uid() AND EXISTS (SELECT 1 FROM public.meeting_participants WHERE meeting_id = meeting_messages.meeting_id AND user_id = auth.uid()))';
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'meeting_notes') THEN
        DROP POLICY IF EXISTS "meeting_notes_insert_secure" ON public.meeting_notes;
        EXECUTE 'CREATE POLICY "meeting_notes_insert_secure" ON public.meeting_notes FOR INSERT TO authenticated WITH CHECK (author_id = auth.uid() AND EXISTS (SELECT 1 FROM public.meeting_participants WHERE meeting_id = meeting_notes.meeting_id AND user_id = auth.uid()))';
    END IF;
END $$;

-- 6/7. SECURITY DEFINER HARDENING
DO $$
DECLARE
    f record;
BEGIN
    FOR f IN 
        SELECT p.proname, p.oid, pg_get_function_arguments(p.oid) as args
        FROM pg_proc p
        JOIN pg_namespace n ON n.oid = p.pronamespace
        WHERE n.nspname = 'public' AND p.prosecdef = true
    LOOP
        EXECUTE format('REVOKE ALL ON FUNCTION public.%I(%s) FROM PUBLIC, anon, authenticated', f.proname, f.args);
    END LOOP;
END $$;

-- Selective Grants
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.admin_exists() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role;
GRANT EXECUTE ON FUNCTION public.check_prospecting_assignment() TO service_role;
GRANT EXECUTE ON FUNCTION public.generate_meeting_link() TO service_role;
GRANT EXECUTE ON FUNCTION public.leads_close_to_pipeline() TO service_role;
GRANT EXECUTE ON FUNCTION public.set_client_token(text) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_project_assets_public(uuid, text) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_project_studio_data_public(uuid, text) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_project_public_data(uuid, text) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_project_public_data_by_token(text) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.claim_project(uuid) TO authenticated, service_role;
