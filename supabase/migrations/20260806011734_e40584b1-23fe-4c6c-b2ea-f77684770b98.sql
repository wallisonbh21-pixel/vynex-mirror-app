
-- 1. HARDENING TRANSACTIONS
DROP POLICY IF EXISTS "transactions_read_own" ON public.transactions;
DROP POLICY IF EXISTS "transactions_select_own" ON public.transactions;

CREATE POLICY "transactions_select_own" ON public.transactions
    FOR SELECT TO authenticated
    USING (user_id = auth.uid());

-- Garantir que mutações sejam apenas service_role
ALTER TABLE public.transactions FORCE ROW LEVEL SECURITY;

-- 2. HARDENING WITHDRAWALS
DROP POLICY IF EXISTS "withdrawals_insert_request" ON public.withdrawals;
DROP POLICY IF EXISTS "withdrawals_select_own" ON public.withdrawals;

CREATE POLICY "withdrawals_select_own" ON public.withdrawals
    FOR SELECT TO authenticated
    USING (user_id = auth.uid());

CREATE POLICY "withdrawals_insert_request" ON public.withdrawals
    FOR INSERT TO authenticated
    WITH CHECK (
        (user_id = auth.uid()) AND 
        (status = 'pending') AND 
        (paid_at IS NULL)
    );

-- 3. HARDENING PROSPECTING OPPORTUNITIES (IMMUTABILITY)
DROP POLICY IF EXISTS "prospecting_insert_identity" ON public.prospecting_opportunities;
DROP POLICY IF EXISTS "prospecting_manage_own" ON public.prospecting_opportunities;

CREATE POLICY "prospecting_select_scoped" ON public.prospecting_opportunities
    FOR SELECT TO authenticated
    USING (created_by = auth.uid() OR assigned_to = auth.uid() OR has_role(auth.uid(), 'admin'));

CREATE POLICY "prospecting_insert_identity" ON public.prospecting_opportunities
    FOR INSERT TO authenticated
    WITH CHECK (created_by = auth.uid());

CREATE POLICY "prospecting_update_integrity" ON public.prospecting_opportunities
    FOR UPDATE TO authenticated
    USING (created_by = auth.uid() OR assigned_to = auth.uid() OR has_role(auth.uid(), 'admin'))
    WITH CHECK (created_by = auth.uid()); -- Impede trocar o dono

-- 4. HARDENING MEETINGS (IMMUTABILITY)
DROP POLICY IF EXISTS "meetings_update_security" ON public.meetings;
CREATE POLICY "meetings_update_security" ON public.meetings
    FOR UPDATE TO authenticated
    USING (created_by = auth.uid())
    WITH CHECK (created_by = auth.uid()); -- Impede trocar o dono

DROP POLICY IF EXISTS "notes_update_identity" ON public.meeting_notes;
CREATE POLICY "notes_update_identity" ON public.meeting_notes
    FOR UPDATE TO authenticated
    USING (author_id = auth.uid())
    WITH CHECK (author_id = auth.uid());

-- 5. SECURITY DEFINER HARDENING
DO $$ 
DECLARE 
    func_record record;
BEGIN
    FOR func_record IN 
        SELECT p.proname, n.nspname
        FROM pg_proc p 
        JOIN pg_namespace n ON p.pronamespace = n.oid 
        WHERE n.nspname = 'public' AND p.prosecdef = true
    LOOP
        EXECUTE 'REVOKE ALL ON FUNCTION ' || quote_ident(func_record.nspname) || '.' || quote_ident(func_record.proname) || ' FROM PUBLIC';
    END LOOP;
END $$;

GRANT EXECUTE ON FUNCTION public.has_role TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.admin_exists TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.protect_financial_integrity TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.claim_project TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.check_prospecting_assignment TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.validate_withdrawal_request TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.leads_close_to_pipeline TO authenticated, service_role;

GRANT EXECUTE ON FUNCTION public.get_project_assets_public TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_project_studio_data_public TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_project_public_data TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_project_public_data_by_token TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.set_client_token TO anon, authenticated, service_role;

-- 6. FORÇAR SEARCH PATH EM TODAS AS FUNÇÕES SECURITY DEFINER
DO $$ 
DECLARE 
    func_record record;
BEGIN
    FOR func_record IN 
        SELECT p.proname, n.nspname
        FROM pg_proc p 
        JOIN pg_namespace n ON p.pronamespace = n.oid 
        WHERE n.nspname = 'public' AND p.prosecdef = true
    LOOP
        EXECUTE 'ALTER FUNCTION ' || quote_ident(func_record.nspname) || '.' || quote_ident(func_record.proname) || ' SET search_path = public';
    END LOOP;
END $$;
