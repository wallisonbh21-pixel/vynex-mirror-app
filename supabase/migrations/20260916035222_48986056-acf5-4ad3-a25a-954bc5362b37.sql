DROP POLICY IF EXISTS "Clients can view their own projects" ON public.projects;
CREATE POLICY "Clients can view their own projects"
ON public.projects FOR SELECT TO authenticated
USING (
  client_id IN (SELECT c.id FROM public.clients c WHERE c.user_id = auth.uid())
  OR public.has_role(auth.uid(),'admin'::public.app_role)
);