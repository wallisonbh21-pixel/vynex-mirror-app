-- ==================================================
-- 1. PROJECT_ASSETS SECURITY
-- ==================================================

DROP POLICY IF EXISTS "Public can view assets with valid token" ON public.project_assets;

CREATE POLICY "Public can view assets with valid token" ON public.project_assets
FOR SELECT TO anon
USING (
  EXISTS (
    SELECT 1 FROM public.projects p
    WHERE p.id = project_assets.project_id
      AND p.client_token IS NOT NULL
      AND p.client_token = current_setting('app.client_token', true)
      AND (p.client_token_expires_at IS NULL OR p.client_token_expires_at > now())
  )
);

-- Ensure authenticated access is also correctly scoped
DROP POLICY IF EXISTS "Users can manage their project assets" ON public.project_assets;

CREATE POLICY "Users can manage their project assets" ON public.project_assets
FOR ALL TO authenticated
USING (
  owner_id = auth.uid() 
  OR public.has_role(auth.uid(), 'admin') 
  OR EXISTS (
    SELECT 1 FROM public.projects p
    WHERE p.id = project_assets.project_id 
      AND p.creator_id = auth.uid()
  )
);

-- ==================================================
-- 2. AVATARS STORAGE SECURITY
-- ==================================================

-- Restricted access to avatars to owner only
DROP POLICY IF EXISTS "avatars read authenticated" ON storage.objects;

CREATE POLICY "avatars read owner" ON storage.objects
FOR SELECT TO authenticated
USING (
  bucket_id = 'avatars' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Admin can see all avatars
CREATE POLICY "avatars read admin" ON storage.objects
FOR SELECT TO authenticated
USING (
  bucket_id = 'avatars' 
  AND public.has_role(auth.uid(), 'admin')
);

-- ==================================================
-- 3. PROSPECTING OPPORTUNITIES SECURITY
-- ==================================================

DROP POLICY IF EXISTS "Vendedor gerencia suas oportunidades" ON public.prospecting_opportunities;

CREATE POLICY "Vendedor gerencia suas oportunidades" ON public.prospecting_opportunities
FOR ALL TO authenticated
USING (
  created_by = auth.uid() 
  OR assigned_to = auth.uid() 
  OR public.has_role(auth.uid(), 'admin')
)
WITH CHECK (
  (
    (created_by = auth.uid() OR assigned_to = auth.uid()) 
    AND (
      -- Vendedor cannot change assigned_to unless it was NULL
      (assigned_to IS NOT DISTINCT FROM (SELECT assigned_to FROM public.prospecting_opportunities WHERE id = id))
      OR (SELECT assigned_to FROM public.prospecting_opportunities WHERE id = id) IS NULL
    )
  )
  OR public.has_role(auth.uid(), 'admin')
);

-- ==================================================
-- 4. SECURITY DEFINER & SEARCH_PATH & EXECUTE REVOKE
-- ==================================================

-- Revoke execute from public/anon for sensitive functions
REVOKE EXECUTE ON FUNCTION public.admin_exists() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.admin_exists() FROM anon;
REVOKE EXECUTE ON FUNCTION public.set_client_token(text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.set_client_token(text) FROM anon;
GRANT EXECUTE ON FUNCTION public.set_client_token(text) TO authenticated;
-- Grant execute back to anon for set_client_token specifically because Approval Portal needs it
GRANT EXECUTE ON FUNCTION public.set_client_token(text) TO anon;

-- Fix Search Path and restrict execute for triggers (should only be run by system/owner)
ALTER FUNCTION public.handle_new_user() SET search_path = public;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC;

ALTER FUNCTION public.leads_close_to_pipeline() SET search_path = public;
REVOKE EXECUTE ON FUNCTION public.leads_close_to_pipeline() FROM PUBLIC;

ALTER FUNCTION public.prospecting_set_level() SET search_path = public;
REVOKE EXECUTE ON FUNCTION public.prospecting_set_level() FROM PUBLIC;

ALTER FUNCTION public.handle_site_plan_updated() SET search_path = public;
REVOKE EXECUTE ON FUNCTION public.handle_site_plan_updated() FROM PUBLIC;

-- Fix Search Path for user-facing functions
ALTER FUNCTION public.has_role(uuid, public.app_role) SET search_path = public;
ALTER FUNCTION public.claim_project(uuid) SET search_path = public;
ALTER FUNCTION public.set_client_token(text) SET search_path = public;
ALTER FUNCTION public.admin_exists() SET search_path = public;

-- ==================================================
-- 5. PROJECT_STUDIO_DATA SECURITY
-- ==================================================

DROP POLICY IF EXISTS "Public can view studio data with valid token" ON public.project_studio_data;

CREATE POLICY "Public can view studio data with valid token" ON public.project_studio_data
FOR SELECT TO anon
USING (
  EXISTS (
    SELECT 1 FROM public.projects p
    WHERE p.id = project_studio_data.project_id
      AND p.client_token IS NOT NULL
      AND p.client_token = current_setting('app.client_token', true)
      AND (p.client_token_expires_at IS NULL OR p.client_token_expires_at > now())
  )
);
