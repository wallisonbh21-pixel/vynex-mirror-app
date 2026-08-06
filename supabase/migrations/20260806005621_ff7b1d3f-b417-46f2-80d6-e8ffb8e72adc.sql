-- SCALE NEXUS SECURITY HARDENING MIGRATION 2026-08-06 (V3 - CORRECT COLUMNS)
-- FASE 1: FINANCEIRO

-- 1.1 Remove existing policies to ensure clean state
DROP POLICY IF EXISTS transactions_admin_all ON public.transactions;
DROP POLICY IF EXISTS transactions_read_own ON public.transactions;
DROP POLICY IF EXISTS withdrawals_admin_manage ON public.withdrawals;
DROP POLICY IF EXISTS withdrawals_admin_update ON public.withdrawals;
DROP POLICY IF EXISTS withdrawals_admin_all ON public.withdrawals;
DROP POLICY IF EXISTS withdrawals_insert_request ON public.withdrawals;
DROP POLICY IF EXISTS withdrawals_select_own ON public.withdrawals;

-- 1.2 Strict RLS for Transactions
CREATE POLICY transactions_read_own ON public.transactions
    FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY transactions_admin_all ON public.transactions
    FOR ALL TO service_role USING (true) WITH CHECK (true);

-- 1.3 Strict RLS for Withdrawals
CREATE POLICY withdrawals_select_own ON public.withdrawals
    FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY withdrawals_insert_request ON public.withdrawals
    FOR INSERT TO authenticated
    WITH CHECK (
        user_id = auth.uid() AND 
        status = 'pending' AND 
        paid_at IS NULL
    );

CREATE POLICY withdrawals_admin_all ON public.withdrawals
    FOR ALL TO service_role USING (true) WITH CHECK (true);

-- 1.4 Financial Integrity Triggers
CREATE OR REPLACE FUNCTION public.protect_financial_integrity()
RETURNS TRIGGER AS $$
BEGIN
    -- Only service_role or internal signed functions can mutate transactions
    IF current_user <> 'service_role' THEN
        RAISE EXCEPTION 'Operação financeira não autorizada via API direta.';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS tr_protect_transactions ON public.transactions;
CREATE TRIGGER tr_protect_transactions
    BEFORE INSERT OR UPDATE OR DELETE ON public.transactions
    FOR EACH ROW EXECUTE FUNCTION public.protect_financial_integrity();

-- 1.5 Withdrawal Balance Validation Trigger
CREATE OR REPLACE FUNCTION public.validate_withdrawal_request()
RETURNS TRIGGER AS $$
DECLARE
    real_balance DECIMAL;
BEGIN
    -- Calculate real balance from transactions
    SELECT COALESCE(SUM(amount), 0) INTO real_balance
    FROM public.transactions
    WHERE user_id = auth.uid();

    IF NEW.amount > real_balance THEN
        RAISE EXCEPTION 'Saldo insuficiente para saque. Disponível: %', real_balance;
    END IF;

    -- Ensure identity and strip admin fields (only using existing columns)
    NEW.user_id := auth.uid();
    NEW.status := 'pending';
    NEW.paid_at := NULL;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS tr_validate_withdrawal ON public.withdrawals;
CREATE TRIGGER tr_validate_withdrawal
    BEFORE INSERT ON public.withdrawals
    FOR EACH ROW EXECUTE FUNCTION public.validate_withdrawal_request();

-- FASE 2: IDENTIDADE E RLS (MEETINGS & PROSPECTING)

-- 2.1 Meetings Hardening
DROP POLICY IF EXISTS meetings_insert_identity ON public.meetings;
DROP POLICY IF EXISTS meetings_update_security ON public.meetings;
DROP POLICY IF EXISTS meetings_admin_all ON public.meetings;

CREATE POLICY meetings_insert_identity ON public.meetings
    FOR INSERT TO authenticated WITH CHECK (created_by = auth.uid());

CREATE POLICY meetings_update_security ON public.meetings
    FOR UPDATE TO authenticated
    USING (created_by = auth.uid())
    WITH CHECK (created_by = auth.uid());

CREATE POLICY meetings_admin_all ON public.meetings
    FOR ALL TO service_role USING (true) WITH CHECK (true);

-- 2.2 Meeting Messages Hardening
DROP POLICY IF EXISTS messages_insert_identity ON public.meeting_messages;
DROP POLICY IF EXISTS messages_select_participant ON public.meeting_messages;

CREATE POLICY messages_insert_identity ON public.meeting_messages
    FOR INSERT TO authenticated
    WITH CHECK (
        sender_id = auth.uid() AND
        EXISTS (
            SELECT 1 FROM public.meeting_participants
            WHERE meeting_id = meeting_messages.meeting_id AND user_id = auth.uid()
        )
    );

CREATE POLICY messages_select_participant ON public.meeting_messages
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.meeting_participants
            WHERE meeting_id = meeting_messages.meeting_id AND user_id = auth.uid()
        ) OR has_role(auth.uid(), 'admin'::app_role)
    );

-- 2.3 Meeting Notes Hardening
DROP POLICY IF EXISTS notes_insert_identity ON public.meeting_notes;
DROP POLICY IF EXISTS notes_update_identity ON public.meeting_notes;
DROP POLICY IF EXISTS notes_select_security ON public.meeting_notes;

CREATE POLICY notes_insert_identity ON public.meeting_notes
    FOR INSERT TO authenticated
    WITH CHECK (
        author_id = auth.uid() AND
        EXISTS (
            SELECT 1 FROM public.meeting_participants
            WHERE meeting_id = meeting_notes.meeting_id AND user_id = auth.uid()
        )
    );

CREATE POLICY notes_update_identity ON public.meeting_notes
    FOR UPDATE TO authenticated
    USING (author_id = auth.uid())
    WITH CHECK (author_id = auth.uid());

CREATE POLICY notes_select_security ON public.meeting_notes
    FOR SELECT TO authenticated
    USING (
        author_id = auth.uid() OR 
        has_role(auth.uid(), 'admin'::app_role) OR 
        (is_public = true AND EXISTS (
            SELECT 1 FROM public.meeting_participants
            WHERE meeting_id = meeting_notes.meeting_id AND user_id = auth.uid()
        ))
    );

-- 2.4 Prospecting Hardening
DROP POLICY IF EXISTS prospecting_insert_identity ON public.prospecting_opportunities;
DROP POLICY IF EXISTS prospecting_manage_own ON public.prospecting_opportunities;

CREATE POLICY prospecting_insert_identity ON public.prospecting_opportunities
    FOR INSERT TO authenticated WITH CHECK (created_by = auth.uid());

CREATE POLICY prospecting_manage_own ON public.prospecting_opportunities
    FOR ALL TO authenticated
    USING (created_by = auth.uid() OR assigned_to = auth.uid() OR has_role(auth.uid(), 'admin'))
    WITH CHECK (created_by = auth.uid() OR assigned_to = auth.uid() OR has_role(auth.uid(), 'admin'));

-- FASE 4: SECURITY DEFINER HARDENING

DO $$
DECLARE
    func_record record;
BEGIN
    FOR func_record IN 
        SELECT p.proname, pg_get_function_arguments(p.oid) as args
        FROM pg_proc p 
        JOIN pg_namespace n ON p.pronamespace = n.oid 
        WHERE n.nspname = 'public' AND p.prosecdef = true
    LOOP
        EXECUTE 'REVOKE ALL ON FUNCTION public.' || quote_ident(func_record.proname) || '(' || func_record.args || ') FROM PUBLIC';
        EXECUTE 'REVOKE ALL ON FUNCTION public.' || quote_ident(func_record.proname) || '(' || func_record.args || ') FROM anon';
    END LOOP;
END $$;

-- Selective regrants
GRANT EXECUTE ON FUNCTION public.has_role TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.admin_exists TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.handle_new_user TO service_role;
GRANT EXECUTE ON FUNCTION public.set_client_token TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_project_public_data_by_token TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_project_assets_public TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_project_studio_data_public TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.claim_project TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.leads_close_to_pipeline TO authenticated, service_role;

-- Grants for financial tables
GRANT SELECT ON public.transactions TO authenticated;
GRANT ALL ON public.transactions TO service_role;

GRANT SELECT, INSERT ON public.withdrawals TO authenticated;
GRANT ALL ON public.withdrawals TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.meetings TO authenticated;
GRANT ALL ON public.meetings TO service_role;

GRANT SELECT, INSERT, DELETE ON public.meeting_messages TO authenticated;
GRANT ALL ON public.meeting_messages TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.meeting_notes TO authenticated;
GRANT ALL ON public.meeting_notes TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.prospecting_opportunities TO authenticated;
GRANT ALL ON public.prospecting_opportunities TO service_role;
