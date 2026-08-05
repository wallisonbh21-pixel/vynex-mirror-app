-- Create meeting_messages table
CREATE TABLE public.meeting_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    meeting_id UUID NOT NULL REFERENCES public.meetings(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES auth.users(id),
    message TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create meeting_notes table
CREATE TABLE public.meeting_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    meeting_id UUID NOT NULL REFERENCES public.meetings(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES auth.users(id),
    content TEXT NOT NULL,
    is_public BOOLEAN DEFAULT false, -- If other participants can see it
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Grants
GRANT SELECT, INSERT ON public.meeting_messages TO authenticated;
GRANT ALL ON public.meeting_messages TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.meeting_notes TO authenticated;
GRANT ALL ON public.meeting_notes TO service_role;

-- RLS for meeting_messages
ALTER TABLE public.meeting_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Participants can view meeting messages"
ON public.meeting_messages
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.meeting_participants
        WHERE meeting_id = meeting_messages.meeting_id
        AND user_id = auth.uid()
    ) OR public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Participants can send meeting messages"
ON public.meeting_messages
FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.meeting_participants
        WHERE meeting_id = meeting_messages.meeting_id
        AND user_id = auth.uid()
    )
);

-- RLS for meeting_notes
ALTER TABLE public.meeting_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all meeting notes"
ON public.meeting_notes
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Authors can view their own notes"
ON public.meeting_notes
FOR SELECT
TO authenticated
USING (author_id = auth.uid());

CREATE POLICY "Participants can view public notes"
ON public.meeting_notes
FOR SELECT
TO authenticated
USING (
    is_public = true AND
    EXISTS (
        SELECT 1 FROM public.meeting_participants
        WHERE meeting_id = meeting_notes.meeting_id
        AND user_id = auth.uid()
    )
);

CREATE POLICY "Participants can create notes"
ON public.meeting_notes
FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.meeting_participants
        WHERE meeting_id = meeting_notes.meeting_id
        AND user_id = auth.uid()
    )
);

CREATE POLICY "Authors/Admins can update notes"
ON public.meeting_notes
FOR UPDATE
TO authenticated
USING (author_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
WITH CHECK (author_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

-- Update meeting_participants with presence tracking fields if not exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='meeting_participants' AND column_name='joined_at') THEN
        ALTER TABLE public.meeting_participants ADD COLUMN joined_at TIMESTAMPTZ;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='meeting_participants' AND column_name='left_at') THEN
        ALTER TABLE public.meeting_participants ADD COLUMN left_at TIMESTAMPTZ;
    END IF;
END
$$;
