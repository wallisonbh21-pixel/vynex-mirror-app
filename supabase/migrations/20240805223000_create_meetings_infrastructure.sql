-- Create enums for meeting types and statuses
CREATE TYPE public.meeting_type AS ENUM (
  'CLIENT',
  'SELLER',
  'CREATOR',
  'TRAFFIC_MANAGER',
  'TEAM',
  'GENERAL',
  'PROJECT',
  'INTERNAL'
);

CREATE TYPE public.meeting_status AS ENUM (
  'SCHEDULED',
  'LIVE',
  'COMPLETED',
  'CANCELLED',
  'NO_SHOW'
);

CREATE TYPE public.meeting_participant_status AS ENUM (
  'PENDING',
  'ACCEPTED',
  'DECLINED',
  'REMOVED'
);

-- Create meetings table
CREATE TABLE public.meetings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  meeting_type public.meeting_type NOT NULL DEFAULT 'GENERAL',
  status public.meeting_status NOT NULL DEFAULT 'SCHEDULED',
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  scheduled_at timestamp with time zone NOT NULL,
  duration_minutes integer NOT NULL DEFAULT 60,
  meeting_link text UNIQUE,
  project_id uuid REFERENCES public.projects(id) ON DELETE CASCADE,
  client_id uuid REFERENCES public.clients(id) ON DELETE CASCADE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  started_at timestamp with time zone,
  ended_at timestamp with time zone,
  cancelled_at timestamp with time zone,
  meeting_notes text,
  meeting_summary text,
  meeting_action_items jsonb
);

-- Create meeting participants table
CREATE TABLE public.meeting_participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id uuid REFERENCES public.meetings(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  participant_type text NOT NULL, -- ADMIN, VENDEDOR, CRIADOR, CLIENTE, GESTOR_DE_TRAFEGO
  invitation_status public.meeting_participant_status NOT NULL DEFAULT 'PENDING',
  joined_at timestamp with time zone,
  left_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(meeting_id, user_id)
);

-- Enable RLS
ALTER TABLE public.meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meeting_participants ENABLE ROW LEVEL SECURITY;

-- Grant access
GRANT SELECT, INSERT, UPDATE, DELETE ON public.meetings TO authenticated;
GRANT ALL ON public.meetings TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.meeting_participants TO authenticated;
GRANT ALL ON public.meeting_participants TO service_role;

-- RLS Policies for meetings

-- Admin: full access
CREATE POLICY "meetings_admin_all" ON public.meetings
FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Others: select if participant
CREATE POLICY "meetings_select_participant" ON public.meetings
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.meeting_participants
    WHERE meeting_id = public.meetings.id AND user_id = auth.uid()
  )
);

-- Vendedor: insert if creating for own client
CREATE POLICY "meetings_insert_vendedor" ON public.meetings
FOR INSERT TO authenticated
WITH CHECK (
  public.has_role(auth.uid(), 'vendedor') AND
  (client_id IS NULL OR EXISTS (
    SELECT 1 FROM public.clients WHERE id = client_id AND owner_id = auth.uid()
  ))
);

-- Criador: insert if related to own project
CREATE POLICY "meetings_insert_criador" ON public.meetings
FOR INSERT TO authenticated
WITH CHECK (
  public.has_role(auth.uid(), 'criador') AND
  project_id IS NOT NULL AND
  EXISTS (
    SELECT 1 FROM public.projects WHERE id = project_id AND creator_id = auth.uid()
  )
);

-- Update policy: owner or admin
CREATE POLICY "meetings_update_owner" ON public.meetings
FOR UPDATE TO authenticated
USING (created_by = auth.uid() OR public.has_role(auth.uid(), 'admin'))
WITH CHECK (created_by = auth.uid() OR public.has_role(auth.uid(), 'admin'));

-- RLS Policies for meeting_participants

-- Admin: full access
CREATE POLICY "participants_admin_all" ON public.meeting_participants
FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Users can see their own participation and participation of others in the same meetings
CREATE POLICY "participants_select_shared" ON public.meeting_participants
FOR SELECT TO authenticated
USING (
  user_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM public.meeting_participants mp
    WHERE mp.meeting_id = public.meeting_participants.meeting_id AND mp.user_id = auth.uid()
  )
);

-- Users can update their own invitation status
CREATE POLICY "participants_update_own_status" ON public.meeting_participants
FOR UPDATE TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Triggers for updated_at
CREATE TRIGGER meetings_updated_at
  BEFORE UPDATE ON public.meetings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to generate secure meeting link if not provided
CREATE OR REPLACE FUNCTION public.generate_meeting_link()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.meeting_link IS NULL THEN
    NEW.meeting_link := 'https://scalenexus.app/reuniao/' || encode(gen_random_bytes(12), 'hex');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_generate_meeting_link
  BEFORE INSERT ON public.meetings
  FOR EACH ROW EXECUTE FUNCTION public.generate_meeting_link();
