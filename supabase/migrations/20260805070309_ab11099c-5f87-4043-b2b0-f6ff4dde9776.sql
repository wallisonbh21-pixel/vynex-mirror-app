-- Fix security vulnerability in project_assets RLS policy
-- The previous policy allowed any anonymous user to view assets of any project that had ANY client_token.
-- The new policy requires a valid client_token to be provided via the 'app.client_token' setting.

-- First, drop the insecure policy
DROP POLICY IF EXISTS "Public can view assets for valid projects" ON public.project_assets;

-- Create the secure policy
-- This policy uses current_setting to validate the token provided in the request context
CREATE POLICY "Public can view assets with valid token"
ON public.project_assets
FOR SELECT
TO anon
USING (
    EXISTS (
        SELECT 1 FROM public.projects p
        WHERE p.id = project_assets.project_id
        AND p.client_token IS NOT NULL
        AND p.client_token = current_setting('app.client_token', true)
        AND (p.client_token_expires_at IS NULL OR p.client_token_expires_at > now())
    )
);

-- Also update project_studio_data to be consistent and more secure
DROP POLICY IF EXISTS "Public can view studio data for projects with valid tokens" ON public.project_studio_data;

CREATE POLICY "Public can view studio data with valid token"
ON public.project_studio_data
FOR SELECT
TO anon
USING (
    EXISTS (
        SELECT 1 FROM public.projects p
        WHERE p.id = project_studio_data.project_id
        AND p.client_token IS NOT NULL
        AND p.client_token = current_setting('app.client_token', true)
        AND (p.client_token_expires_at IS NULL OR p.client_token_expires_at > now())
    )
);

-- Ensure authenticated users can still see assets for projects they have access to
-- (This might be redundant with existing policies but good for clarity)
DROP POLICY IF EXISTS "Users can manage their project assets" ON public.project_assets;
CREATE POLICY "Users can manage their project assets"
ON public.project_assets
FOR ALL
TO authenticated
USING (
    owner_id = auth.uid() 
    OR public.has_role(auth.uid(), 'admin')
    OR EXISTS (
        SELECT 1 FROM public.projects p
        WHERE p.id = project_assets.project_id
        AND p.creator_id = auth.uid()
    )
);
