ALTER POLICY "Clients can view their own data" ON public.clients
  USING ((user_id = auth.uid()) OR public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'diretor'::app_role));