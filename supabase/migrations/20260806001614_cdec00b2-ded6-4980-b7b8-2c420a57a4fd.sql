-- SCALE NEXUS SECURITY HARDENING MIGRATION v2
-- FOCUS: FINANCIAL PROTECTION, MEETING IDENTITY, API BYPASS, AND RLS ENFORCEMENT

-- 1. CLEANUP
DROP POLICY IF EXISTS "transactions_select_own_or_admin" ON public.transactions;
DROP POLICY IF EXISTS "transactions_select_own" ON public.transactions;
DROP POLICY IF EXISTS "transactions_admin_all" ON public.transactions;

DROP POLICY IF EXISTS "withdrawals_insert_own" ON public.withdrawals;
DROP POLICY IF EXISTS "withdrawals_select_own_or_admin" ON public.withdrawals;
DROP POLICY IF EXISTS "withdrawals_select_own" ON public.withdrawals;
DROP POLICY IF EXISTS "withdrawals_insert_request" ON public.withdrawals;
DROP POLICY IF EXISTS "withdrawals_admin_manage" ON public.withdrawals;

DROP POLICY IF EXISTS "Vendedor gerencia suas oportunidades" ON public.prospecting_opportunities;
DROP POLICY IF EXISTS "prospecting_insert_identity" ON public.prospecting_opportunities;
DROP POLICY IF EXISTS "prospecting_manage_own" ON public.prospecting_opportunities;

DROP POLICY IF EXISTS "Organizers can create meetings" ON public.meetings;
DROP POLICY IF EXISTS "meetings_insert_secure" ON public.meetings;
DROP POLICY IF EXISTS "meetings_insert_criador" ON public.meetings;
DROP POLICY IF EXISTS "meetings_insert_vendedor" ON public.meetings;
DROP POLICY IF EXISTS "meetings_insert_identity" ON public.meetings;

-- 2. TRANSACTIONS HARDENING
CREATE POLICY "transactions_select_own" 
ON public.transactions FOR SELECT 
TO authenticated 
USING (user_id = auth.uid());

CREATE POLICY "transactions_admin_all" 
ON public.transactions FOR ALL 
TO authenticated 
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 3. WITHDRAWALS HARDENING
CREATE POLICY "withdrawals_select_own" 
ON public.withdrawals FOR SELECT 
TO authenticated 
USING (user_id = auth.uid());

CREATE POLICY "withdrawals_insert_request" 
ON public.withdrawals FOR INSERT 
TO authenticated 
WITH CHECK (
    user_id = auth.uid() AND 
    status = 'pending' AND 
    paid_at IS NULL
);

CREATE POLICY "withdrawals_admin_manage" 
ON public.withdrawals FOR ALL 
TO authenticated 
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 4. FINANCIAL PROTECTIVE TRIGGERS
CREATE OR REPLACE FUNCTION public.protect_financial_integrity()
RETURNS TRIGGER AS $$
BEGIN
    IF NOT public.has_role(auth.uid(), 'admin') THEN
        IF (TG_OP = 'INSERT') THEN
            IF NEW.type IN ('commission', 'bonus') THEN
                RAISE EXCEPTION 'Unauthorized: Financial records can only be created by the system or admin.';
            END IF;
        ELSIF (TG_OP = 'UPDATE') THEN
            IF OLD.amount <> NEW.amount OR OLD.user_id <> NEW.user_id OR OLD.type <> NEW.type THEN
                RAISE EXCEPTION 'Unauthorized: Critical financial fields are immutable for non-admins.';
            END IF;
        ELSIF (TG_OP = 'DELETE') THEN
            RAISE EXCEPTION 'Unauthorized: Financial records cannot be deleted by users.';
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS tr_protect_transactions ON public.transactions;
CREATE TRIGGER tr_protect_transactions
BEFORE INSERT OR UPDATE OR DELETE ON public.transactions
FOR EACH ROW EXECUTE FUNCTION public.protect_financial_integrity();

-- 5. WITHDRAWAL VALIDATION TRIGGER (BALANCE CHECK)
CREATE OR REPLACE FUNCTION public.validate_withdrawal_request()
RETURNS TRIGGER AS $$
DECLARE
    v_balance DECIMAL;
BEGIN
    SELECT COALESCE(SUM(amount), 0) INTO v_balance
    FROM public.transactions
    WHERE user_id = auth.uid();

    v_balance := v_balance - (
        SELECT COALESCE(SUM(amount), 0)
        FROM public.withdrawals
        WHERE user_id = auth.uid() AND status IN ('pending', 'approved', 'paid')
    );

    IF NEW.amount > v_balance THEN
        RAISE EXCEPTION 'Insufficient balance: Requested %, Available %', NEW.amount, v_balance;
    END IF;
    
    IF NEW.amount <= 0 THEN
        RAISE EXCEPTION 'Invalid withdrawal amount.';
    END IF;

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

-- 6. MEETING IDENTITY ENFORCEMENT
CREATE POLICY "meetings_insert_identity" 
ON public.meetings FOR INSERT 
TO authenticated 
WITH CHECK (created_by = auth.uid());

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'meeting_messages') THEN
        DROP POLICY IF EXISTS "meeting_messages_insert_secure" ON public.meeting_messages;
        DROP POLICY IF EXISTS "Participants can send meeting messages" ON public.meeting_messages;
        DROP POLICY IF EXISTS "meeting_messages_insert_identity" ON public.meeting_messages;
        EXECUTE 'CREATE POLICY "meeting_messages_insert_identity" ON public.meeting_messages FOR INSERT TO authenticated WITH CHECK (sender_id = auth.uid() AND EXISTS (SELECT 1 FROM public.meeting_participants WHERE meeting_id = meeting_messages.meeting_id AND user_id = auth.uid()))';
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'meeting_notes') THEN
        DROP POLICY IF EXISTS "meeting_notes_insert_secure" ON public.meeting_notes;
        DROP POLICY IF EXISTS "Participants can create notes" ON public.meeting_notes;
        DROP POLICY IF EXISTS "meeting_notes_insert_identity" ON public.meeting_notes;
        EXECUTE 'CREATE POLICY "meeting_notes_insert_identity" ON public.meeting_notes FOR INSERT TO authenticated WITH CHECK (author_id = auth.uid() AND EXISTS (SELECT 1 FROM public.meeting_participants WHERE meeting_id = meeting_notes.meeting_id AND user_id = auth.uid()))';
    END IF;
END $$;

-- 7. PROSPECTING CREATED_BY ENFORCEMENT
CREATE POLICY "prospecting_insert_identity"
ON public.prospecting_opportunities FOR INSERT
TO authenticated
WITH CHECK (created_by = auth.uid());

CREATE POLICY "prospecting_manage_own"
ON public.prospecting_opportunities FOR ALL
TO authenticated
USING (created_by = auth.uid() OR assigned_to = auth.uid() OR public.has_role(auth.uid(), 'admin'));

-- 8. SECURITY DEFINER HARDENING
REVOKE EXECUTE ON FUNCTION public.protect_financial_integrity() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.validate_withdrawal_request() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.check_prospecting_assignment() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.protect_financial_integrity() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.validate_withdrawal_request() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.check_prospecting_assignment() TO authenticated, service_role;
