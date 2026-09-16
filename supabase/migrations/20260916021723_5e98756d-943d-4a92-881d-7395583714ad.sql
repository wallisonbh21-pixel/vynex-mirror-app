
CREATE TABLE public.nexusbuild_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL DEFAULT 'Nova conversa',
  context jsonb NOT NULL DEFAULT '{}'::jsonb,
  archived boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.nexusbuild_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.nexusbuild_conversations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('user','assistant','system')),
  content text NOT NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_nexusbuild_conversations_user ON public.nexusbuild_conversations(user_id, updated_at DESC);
CREATE INDEX idx_nexusbuild_messages_conversation ON public.nexusbuild_messages(conversation_id, created_at);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.nexusbuild_conversations TO authenticated;
GRANT ALL ON public.nexusbuild_conversations TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.nexusbuild_messages TO authenticated;
GRANT ALL ON public.nexusbuild_messages TO service_role;

ALTER TABLE public.nexusbuild_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nexusbuild_messages ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.can_use_nexusbuild(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role IN ('admin','criador')
  )
$$;

CREATE POLICY "Usuario autorizado gerencia suas conversas"
ON public.nexusbuild_conversations FOR ALL TO authenticated
USING (user_id = auth.uid() AND public.can_use_nexusbuild(auth.uid()))
WITH CHECK (user_id = auth.uid() AND public.can_use_nexusbuild(auth.uid()));

CREATE POLICY "Usuario autorizado gerencia suas mensagens"
ON public.nexusbuild_messages FOR ALL TO authenticated
USING (user_id = auth.uid() AND public.can_use_nexusbuild(auth.uid()))
WITH CHECK (
  user_id = auth.uid()
  AND public.can_use_nexusbuild(auth.uid())
  AND EXISTS (
    SELECT 1 FROM public.nexusbuild_conversations c
    WHERE c.id = conversation_id AND c.user_id = auth.uid()
  )
);

CREATE TRIGGER trg_nexusbuild_conversations_updated_at
BEFORE UPDATE ON public.nexusbuild_conversations
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
