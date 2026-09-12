CREATE OR REPLACE FUNCTION public.is_meeting_participant(_meeting_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.meeting_participants mp
    WHERE mp.meeting_id = _meeting_id AND mp.user_id = _user_id
  )
$$;

DROP POLICY IF EXISTS participants_select_shared ON public.meeting_participants;

CREATE POLICY participants_select_shared ON public.meeting_participants
FOR SELECT TO authenticated
USING (user_id = auth.uid() OR public.is_meeting_participant(meeting_id, auth.uid()));