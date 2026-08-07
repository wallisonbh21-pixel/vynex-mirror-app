-- Migration: Client Portal Evolution Phase 1
-- Tables for Messages and Documents

-- 1. Table for Project Messages (Chat between Client and Team)
CREATE TABLE IF NOT EXISTS public.project_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
    sender_id UUID REFERENCES auth.users(id) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- RLS for project_messages
ALTER TABLE public.project_messages ENABLE ROW LEVEL SECURITY;

-- Grants for project_messages
GRANT SELECT, INSERT ON public.project_messages TO authenticated;
GRANT ALL ON public.project_messages TO service_role;

CREATE POLICY "Clients can view messages for their projects"
ON public.project_messages FOR SELECT
TO authenticated
USING (
    project_id IN (
        SELECT id FROM public.projects 
        WHERE client_id IN (SELECT id FROM public.clients WHERE user_id = auth.uid())
    )
);

CREATE POLICY "Clients can send messages for their projects"
ON public.project_messages FOR INSERT
TO authenticated
WITH CHECK (
    project_id IN (
        SELECT id FROM public.projects 
        WHERE client_id IN (SELECT id FROM public.clients WHERE user_id = auth.uid())
    ) AND
    sender_id = auth.uid()
);

CREATE POLICY "Team can view all project messages"
ON public.project_messages FOR SELECT
TO authenticated
USING (
    public.has_role(auth.uid(), 'admin') OR
    public.has_role(auth.uid(), 'vendedor') OR
    public.has_role(auth.uid(), 'criador')
);

CREATE POLICY "Team can send project messages"
ON public.project_messages FOR INSERT
TO authenticated
WITH CHECK (
    public.has_role(auth.uid(), 'admin') OR
    public.has_role(auth.uid(), 'vendedor') OR
    public.has_role(auth.uid(), 'criador')
);

-- 2. Table for Project Documents (Files shared with clients)
CREATE TABLE IF NOT EXISTS public.project_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    category TEXT DEFAULT 'Documento' NOT NULL,
    size_bytes BIGINT,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    uploaded_by UUID REFERENCES auth.users(id) NOT NULL
);

-- RLS for project_documents
ALTER TABLE public.project_documents ENABLE ROW LEVEL SECURITY;

-- Grants for project_documents
GRANT SELECT, INSERT, UPDATE, DELETE ON public.project_documents TO authenticated;
GRANT ALL ON public.project_documents TO service_role;

CREATE POLICY "Clients can view documents for their projects"
ON public.project_documents FOR SELECT
TO authenticated
USING (
    project_id IN (
        SELECT id FROM public.projects 
        WHERE client_id IN (SELECT id FROM public.clients WHERE user_id = auth.uid())
    )
);

CREATE POLICY "Team can manage project documents"
ON public.project_documents FOR ALL
TO authenticated
USING (
    public.has_role(auth.uid(), 'admin') OR
    public.has_role(auth.uid(), 'vendedor') OR
    public.has_role(auth.uid(), 'criador')
);

-- 3. Ensure project_approval_events is correctly set up for Phase 1 actions
-- Grants for project_approval_events
GRANT SELECT, INSERT ON public.project_approval_events TO authenticated;
GRANT ALL ON public.project_approval_events TO service_role;
