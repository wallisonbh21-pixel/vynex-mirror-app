-- 1. Adicionar 'cliente' ao enum app_role
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = 'app_role' AND e.enumlabel = 'cliente') THEN
        ALTER TYPE public.app_role ADD VALUE 'cliente';
    END IF;
END $$;

-- 2. Garantir que a tabela clients tenha um user_id opcional
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clients' AND column_name = 'user_id') THEN
        ALTER TABLE public.clients ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;
        CREATE UNIQUE INDEX idx_clients_user_id ON public.clients(user_id);
    END IF;
END $$;

-- 3. RLS para a tabela clients
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Clients can view their own data" ON public.clients;
CREATE POLICY "Clients can view their own data"
ON public.clients
FOR SELECT
TO authenticated
USING (
    user_id = auth.uid() OR 
    public.has_role(auth.uid(), 'admin') OR 
    public.has_role(auth.uid(), 'diretor') OR
    public.has_role(auth.uid(), 'vendedor')
);

-- 4. RLS para projects
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Clients can view their own projects" ON public.projects;
CREATE POLICY "Clients can view their own projects"
ON public.projects
FOR SELECT
TO authenticated
USING (
    client_id IN (SELECT id FROM public.clients WHERE user_id = auth.uid()) OR
    public.has_role(auth.uid(), 'admin') OR
    public.has_role(auth.uid(), 'vendedor') OR
    public.has_role(auth.uid(), 'criador')
);

-- 5. RLS para meetings
ALTER TABLE public.meetings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Clients can view their own meetings" ON public.meetings;
CREATE POLICY "Clients can view their own meetings"
ON public.meetings
FOR SELECT
TO authenticated
USING (
    id IN (SELECT meeting_id FROM public.meeting_participants WHERE user_id = auth.uid())
);

-- 6. RLS para meeting_messages
ALTER TABLE public.meeting_messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Clients can view messages from their meetings" ON public.meeting_messages;
CREATE POLICY "Clients can view messages from their meetings"
ON public.meeting_messages
FOR SELECT
TO authenticated
USING (
    meeting_id IN (SELECT meeting_id FROM public.meeting_participants WHERE user_id = auth.uid())
);

DROP POLICY IF EXISTS "Clients can send messages to their meetings" ON public.meeting_messages;
CREATE POLICY "Clients can send messages to their meetings"
ON public.meeting_messages
FOR INSERT
TO authenticated
WITH CHECK (
    meeting_id IN (SELECT meeting_id FROM public.meeting_participants WHERE user_id = auth.uid()) AND
    sender_id = auth.uid()
);

-- 7. RLS para transactions
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Clients can view their own transactions" ON public.transactions;
CREATE POLICY "Clients can view their own transactions"
ON public.transactions
FOR SELECT
TO authenticated
USING (
    user_id = auth.uid()
);

-- 8. Grants
GRANT SELECT ON public.clients TO authenticated;
GRANT SELECT ON public.projects TO authenticated;
GRANT SELECT ON public.meetings TO authenticated;
GRANT SELECT ON public.meeting_participants TO authenticated;
GRANT SELECT ON public.meeting_messages TO authenticated;
GRANT SELECT ON public.transactions TO authenticated;
