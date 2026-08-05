-- FINDING 2 & 3: New stateless RPC for Public Project Data
-- This avoids session variables (GUC) and set_client_token()

BEGIN;

-- 1. Create a secure RPC that validates token explicitly
CREATE OR REPLACE FUNCTION public.get_project_public_data(p_project_id uuid, p_client_token text)
RETURNS TABLE (
    id uuid,
    title text,
    status text,
    site_type text,
    delivery_link text,
    submitted_at timestamptz,
    client_token_expires_at timestamptz,
    client_id uuid,
    client_company text,
    client_contact_name text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Validate token and expiry in a single query
    RETURN QUERY
    SELECT 
        p.id,
        p.title,
        p.status,
        p.site_type,
        p.delivery_link,
        p.submitted_at,
        p.client_token_expires_at,
        p.client_id,
        c.company as client_company,
        c.contact_name as client_contact_name
    FROM public.projects p
    LEFT JOIN public.clients c ON p.client_id = c.id
    WHERE p.id = p_project_id
      AND p.client_token = p_client_token
      AND (p.client_token_expires_at IS NULL OR p.client_token_expires_at > now());
END;
$$;

-- 2. Create a secure RPC for Studio Data with explicit token
CREATE OR REPLACE FUNCTION public.get_project_studio_data_public(p_project_id uuid, p_client_token text)
RETURNS TABLE (
    id uuid,
    project_id uuid,
    design_system jsonb,
    sections jsonb,
    updated_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Validate project token first
    IF EXISTS (
        SELECT 1 FROM public.projects p 
        WHERE p.id = p_project_id 
          AND p.client_token = p_client_token 
          AND (p.client_token_expires_at IS NULL OR p.client_token_expires_at > now())
    ) THEN
        RETURN QUERY
        SELECT 
            sd.id,
            sd.project_id,
            sd.design_system,
            sd.sections,
            sd.updated_at
        FROM public.project_studio_data sd
        WHERE sd.project_id = p_project_id;
    END IF;
END;
$$;

-- 3. Create a secure RPC for Assets with explicit token
CREATE OR REPLACE FUNCTION public.get_project_assets_public(p_project_id uuid, p_client_token text)
RETURNS TABLE (
    id uuid,
    project_id uuid,
    name text,
    type text,
    url text,
    size bigint,
    created_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Validate project token first
    IF EXISTS (
        SELECT 1 FROM public.projects p 
        WHERE p.id = p_project_id 
          AND p.client_token = p_client_token 
          AND (p.client_token_expires_at IS NULL OR p.client_token_expires_at > now())
    ) THEN
        RETURN QUERY
        SELECT 
            a.id,
            a.project_id,
            a.name,
            a.type,
            a.url,
            a.size,
            a.created_at
        FROM public.project_assets a
        WHERE a.project_id = p_project_id;
    END IF;
END;
$$;

-- 4. Permissions for new functions
REVOKE ALL ON FUNCTION public.get_project_public_data(uuid, text) FROM PUBLIC, authenticated, anon;
REVOKE ALL ON FUNCTION public.get_project_studio_data_public(uuid, text) FROM PUBLIC, authenticated, anon;
REVOKE ALL ON FUNCTION public.get_project_assets_public(uuid, text) FROM PUBLIC, authenticated, anon;

GRANT EXECUTE ON FUNCTION public.get_project_public_data(uuid, text) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_project_studio_data_public(uuid, text) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_project_assets_public(uuid, text) TO anon, authenticated, service_role;

-- 5. Hardening project_assets and project_studio_data RLS to prevent leakage 
-- We still keep RLS but it won't depend on set_client_token if we use RPC.
-- However, we should FIX the RLS policy to be safer just in case someone calls it.
-- But since we are moving to RPC, we could even REMOVE the public view policy 
-- after confirming the frontend uses the RPC.

COMMIT;