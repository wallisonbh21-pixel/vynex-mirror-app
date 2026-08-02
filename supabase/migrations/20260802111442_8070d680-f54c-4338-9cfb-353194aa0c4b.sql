ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS submitted_at timestamptz,
  ADD COLUMN IF NOT EXISTS approved_to_client_by uuid REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS approved_to_client_at timestamptz,
  ADD COLUMN IF NOT EXISTS client_approved_at timestamptz,
  ADD COLUMN IF NOT EXISTS client_token text,
  ADD COLUMN IF NOT EXISTS client_token_expires_at timestamptz;

CREATE UNIQUE INDEX IF NOT EXISTS projects_client_token_key ON public.projects (client_token) WHERE client_token IS NOT NULL;

ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS contact_email text;

CREATE TABLE IF NOT EXISTS public.project_approval_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  actor_id uuid REFERENCES auth.users(id),
  actor_label text NOT NULL DEFAULT '',
  event_type text NOT NULL,
  message text,
  previous_status text,
  new_status text,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.project_approval_events TO authenticated;
GRANT ALL ON public.project_approval_events TO service_role;
ALTER TABLE public.project_approval_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "approval events read" ON public.project_approval_events
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.projects p
    WHERE p.id = project_id
      AND (p.owner_id = auth.uid() OR p.creator_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
  ));

CREATE POLICY "approval events insert" ON public.project_approval_events
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.projects p
    WHERE p.id = project_id
      AND (p.owner_id = auth.uid() OR p.creator_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
  ));

CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  body text,
  category text NOT NULL DEFAULT 'geral',
  link text,
  project_id uuid REFERENCES public.projects(id) ON DELETE CASCADE,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "notifications read own" ON public.notifications
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "notifications update own" ON public.notifications
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "notifications insert authenticated" ON public.notifications
  FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE INDEX IF NOT EXISTS notifications_user_idx ON public.notifications (user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS public.whatsapp_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES public.projects(id) ON DELETE SET NULL,
  client_id uuid REFERENCES public.clients(id) ON DELETE SET NULL,
  phone text NOT NULL,
  message text NOT NULL,
  notification_type text NOT NULL DEFAULT 'aprovacao_site',
  send_status text NOT NULL DEFAULT 'preparado',
  sent_at timestamptz,
  external_message_id text,
  error_message text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.whatsapp_messages TO authenticated;
GRANT ALL ON public.whatsapp_messages TO service_role;
ALTER TABLE public.whatsapp_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "whatsapp admin read" ON public.whatsapp_messages
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER whatsapp_messages_updated_at
  BEFORE UPDATE ON public.whatsapp_messages
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();