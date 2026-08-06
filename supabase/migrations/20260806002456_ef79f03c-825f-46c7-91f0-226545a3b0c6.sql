-- Hardening RLS for Meetings, Messages and Notes (Identity Enforcement)

-- Ensure tables exist and RLS is enabled
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'meeting_messages') THEN
        CREATE TABLE public.meeting_messages (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            meeting_id UUID NOT NULL REFERENCES public.meetings(id) ON DELETE CASCADE,
            sender_id UUID NOT NULL REFERENCES auth.users(id),
            message TEXT NOT NULL,
            created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
        );
        GRANT SELECT, INSERT ON public.meeting_messages TO authenticated;
        GRANT ALL ON public.meeting_messages TO service_role;
        ALTER TABLE public.meeting_messages ENABLE ROW LEVEL SECURITY;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'meeting_notes') THEN
        CREATE TABLE public.meeting_notes (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            meeting_id UUID NOT NULL REFERENCES public.meetings(id) ON DELETE CASCADE,
            author_id UUID NOT NULL REFERENCES auth.users(id),
            content TEXT NOT NULL,
            is_public BOOLEAN DEFAULT false,
            created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
        );
        GRANT SELECT, INSERT, UPDATE, DELETE ON public.meeting_notes TO authenticated;
        GRANT ALL ON public.meeting_notes TO service_role;
        ALTER TABLE public.meeting_notes ENABLE ROW LEVEL SECURITY;
    END IF;
END $$;

-- 1. Remove potentially incorrect or permissve policies
DROP POLICY IF EXISTS "Participants can view meeting messages" ON public.meeting_messages;
DROP POLICY IF EXISTS "Participants can send meeting messages" ON public.meeting_messages;
DROP POLICY IF EXISTS "Admins can view all meeting notes" ON public.meeting_notes;
DROP POLICY IF EXISTS "Authors can view their own notes" ON public.meeting_notes;
DROP POLICY IF EXISTS "Participants can view public notes" ON public.meeting_notes;
DROP POLICY IF EXISTS "Participants can create notes" ON public.meeting_notes;
DROP POLICY IF EXISTS "Authors/Admins can update notes" ON public.meeting_notes;
DROP POLICY IF EXISTS "meetings_insert_identity" ON public.meetings;
DROP POLICY IF EXISTS "meetings_update_owner" ON public.meetings;

-- 2. Meetings Table Hardening (Identity Enforcement)
CREATE POLICY "meetings_insert_identity" ON public.meetings
FOR INSERT TO authenticated
WITH CHECK (created_by = auth.uid());

CREATE POLICY "meetings_update_security" ON public.meetings
FOR UPDATE TO authenticated
USING ((created_by = auth.uid() OR public.has_role(auth.uid(), 'admin')))
WITH CHECK ((created_by = auth.uid() OR public.has_role(auth.uid(), 'admin')));

-- 3. Meeting Messages Table Hardening (Identity + Membership)
CREATE POLICY "messages_select_participant" ON public.meeting_messages
FOR SELECT TO authenticated
USING (
    EXISTS (SELECT 1 FROM public.meeting_participants WHERE meeting_id = meeting_messages.meeting_id AND user_id = auth.uid())
    OR public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "messages_insert_identity" ON public.meeting_messages
FOR INSERT TO authenticated
WITH CHECK (
    sender_id = auth.uid() AND
    EXISTS (SELECT 1 FROM public.meeting_participants WHERE meeting_id = meeting_messages.meeting_id AND user_id = auth.uid())
);

-- 4. Meeting Notes Table Hardening (Identity + Membership)
CREATE POLICY "notes_select_security" ON public.meeting_notes
FOR SELECT TO authenticated
USING (
    author_id = auth.uid() OR 
    public.has_role(auth.uid(), 'admin') OR
    (is_public = true AND EXISTS (SELECT 1 FROM public.meeting_participants WHERE meeting_id = meeting_notes.meeting_id AND user_id = auth.uid()))
);

CREATE POLICY "notes_insert_identity" ON public.meeting_notes
FOR INSERT TO authenticated
WITH CHECK (
    author_id = auth.uid() AND
    EXISTS (SELECT 1 FROM public.meeting_participants WHERE meeting_id = meeting_notes.meeting_id AND user_id = auth.uid())
);

CREATE POLICY "notes_update_identity" ON public.meeting_notes
FOR UPDATE TO authenticated
USING (author_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
WITH CHECK (author_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

-- 5. Revoke sensitive EXECUTE privileges for SECURITY DEFINER functions (Only if they exist)
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'handle_new_user') THEN
        REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon;
        GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'handle_studio_update') THEN
        REVOKE EXECUTE ON FUNCTION public.handle_studio_update() FROM PUBLIC, anon;
        GRANT EXECUTE ON FUNCTION public.handle_studio_update() TO service_role, authenticated;
    END IF;
END $$;
