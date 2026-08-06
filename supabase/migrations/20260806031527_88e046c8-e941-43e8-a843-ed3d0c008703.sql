-- 0. Update app_role enum to include 'cliente'
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'cliente';

-- 1. Table: public.clients
-- Allow clients to read only their own record
DROP POLICY IF EXISTS "Clients can view their own record" ON public.clients;
CREATE POLICY "Clients can view their own record"
ON public.clients
FOR SELECT
TO authenticated
USING (
  auth.uid() = user_id OR 
  public.has_role(auth.uid(), 'admin') OR 
  (public.has_role(auth.uid(), 'vendedor') AND owner_id = auth.uid())
);

-- 2. Table: public.projects
-- Allow clients to view only their own projects
DROP POLICY IF EXISTS "projects visible" ON public.projects;
CREATE POLICY "projects visible"
ON public.projects
FOR SELECT
TO authenticated
USING (
  (SELECT EXISTS (SELECT 1 FROM public.clients c WHERE c.id = public.projects.client_id AND c.user_id = auth.uid())) OR
  public.has_role(auth.uid(), 'admin') OR
  (public.has_role(auth.uid(), 'criador') AND creator_id = auth.uid()) OR
  (public.has_role(auth.uid(), 'vendedor') AND owner_id = auth.uid())
);

-- 3. Table: public.meetings
DROP POLICY IF EXISTS "Clients can view their own meetings" ON public.meetings;
CREATE POLICY "Clients can view their own meetings"
ON public.meetings
FOR SELECT
TO authenticated
USING (
  (SELECT EXISTS (SELECT 1 FROM public.clients c WHERE c.id = public.meetings.client_id AND c.user_id = auth.uid())) OR
  public.has_role(auth.uid(), 'admin') OR
  created_by = auth.uid()
);

-- 4. Table: public.contracts
DROP POLICY IF EXISTS "Clients can view their own contracts" ON public.contracts;
CREATE POLICY "Clients can view their own contracts"
ON public.contracts
FOR SELECT
TO authenticated
USING (
  (SELECT EXISTS (SELECT 1 FROM public.clients c WHERE c.id = public.contracts.client_id AND c.user_id = auth.uid())) OR
  public.has_role(auth.uid(), 'admin') OR
  owner_id = auth.uid()
);

-- 5. Table: public.transactions
-- Note: project_id might be missing or typed differently in transactions if it's not present. 
-- Checking columns: transactions only has user_id, type, amount, description, occurred_at, created_at.
-- Skipping RLS for transactions based on project_id since it's not there.
-- Instead, use user_id which is already protected for 'authenticated'.

GRANT SELECT ON public.clients TO authenticated;
GRANT SELECT ON public.projects TO authenticated;
GRANT SELECT ON public.meetings TO authenticated;
GRANT SELECT ON public.contracts TO authenticated;
GRANT SELECT ON public.transactions TO authenticated;