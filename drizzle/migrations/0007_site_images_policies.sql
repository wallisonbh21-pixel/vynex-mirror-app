CREATE OR REPLACE FUNCTION public.can_edit_project_site(_project_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.has_role(auth.uid(), 'admin') OR EXISTS (
    SELECT 1 FROM public.projects p
    WHERE p.id = _project_id AND (p.creator_id = auth.uid() OR p.owner_id = auth.uid())
  )
$$;
REVOKE ALL ON FUNCTION public.can_edit_project_site(uuid) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.can_edit_project_site(uuid) TO authenticated;

CREATE POLICY "site-images editors insert" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'site-images'
  AND (storage.foldername(name))[1] ~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$'
  AND public.can_edit_project_site(((storage.foldername(name))[1])::uuid)
  AND lower(storage.extension(name)) IN ('jpg','jpeg','png','webp','gif')
);
CREATE POLICY "site-images editors select" ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'site-images'
  AND (storage.foldername(name))[1] ~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$'
  AND public.can_edit_project_site(((storage.foldername(name))[1])::uuid)
);
CREATE POLICY "site-images editors delete" ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'site-images'
  AND (storage.foldername(name))[1] ~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$'
  AND public.can_edit_project_site(((storage.foldername(name))[1])::uuid)
);