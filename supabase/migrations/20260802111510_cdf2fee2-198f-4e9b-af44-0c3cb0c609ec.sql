DROP POLICY IF EXISTS "notifications insert authenticated" ON public.notifications;

CREATE POLICY "notifications insert scoped" ON public.notifications
  FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    OR public.has_role(auth.uid(), 'admin')
    OR (
      project_id IS NOT NULL AND EXISTS (
        SELECT 1 FROM public.projects p
        WHERE p.id = project_id
          AND (p.owner_id = auth.uid() OR p.creator_id = auth.uid())
          AND (p.owner_id = notifications.user_id OR p.creator_id = notifications.user_id
               OR public.has_role(notifications.user_id, 'admin'))
      )
    )
  );