
-- Create project_studio_data to store the visual editor state
CREATE TABLE IF NOT EXISTS public.project_studio_data (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    design_system jsonb DEFAULT '{
        "colors": {"primary": "#3B82F6", "secondary": "#64748B", "accent": "#10B981"},
        "fonts": {"heading": "Inter", "body": "Inter"},
        "spacing": "normal",
        "borderRadius": "0.75rem"
    }'::jsonb,
    sections jsonb DEFAULT '[]'::jsonb,
    history jsonb DEFAULT '[]'::jsonb,
    last_saved_at timestamptz DEFAULT now(),
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    UNIQUE(project_id)
);

-- RLS for project_studio_data
ALTER TABLE public.project_studio_data ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE ON public.project_studio_data TO authenticated;
GRANT ALL ON public.project_studio_data TO service_role;

-- Policies for project_studio_data (Creators can only manage their projects)
CREATE POLICY "Creators can manage studio data for their projects"
ON public.project_studio_data
FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.projects p
        WHERE p.id = project_studio_data.project_id
        AND p.creator_id = auth.uid()
    )
    OR public.has_role(auth.uid(), 'admin')
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.projects p
        WHERE p.id = project_studio_data.project_id
        AND p.creator_id = auth.uid()
    )
    OR public.has_role(auth.uid(), 'admin')
);

-- Enable public read access for the Client Approval Portal
GRANT SELECT ON public.project_studio_data TO anon;

CREATE POLICY "Public can view studio data for projects with valid tokens"
ON public.project_studio_data
FOR SELECT
TO anon
USING (
    EXISTS (
        SELECT 1 FROM public.projects p
        WHERE p.id = project_studio_data.project_id
        AND p.client_token IS NOT NULL
        AND (p.client_token_expires_at IS NULL OR p.client_token_expires_at > now())
    )
);

-- Create project_assets for images/files used in Studio
CREATE TABLE IF NOT EXISTS public.project_assets (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id uuid REFERENCES public.projects(id) ON DELETE CASCADE,
    name text NOT NULL,
    url text NOT NULL,
    type text NOT NULL, -- 'image', 'document', etc.
    size integer,
    created_at timestamptz DEFAULT now(),
    owner_id uuid NOT NULL REFERENCES auth.users(id)
);

ALTER TABLE public.project_assets ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, DELETE ON public.project_assets TO authenticated;
GRANT ALL ON public.project_assets TO service_role;
GRANT SELECT ON public.project_assets TO anon;

CREATE POLICY "Users can manage their project assets"
ON public.project_assets
FOR ALL
TO authenticated
USING (owner_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Public can view assets for valid projects"
ON public.project_assets
FOR SELECT
TO anon
USING (
    EXISTS (
        SELECT 1 FROM public.projects p
        WHERE p.id = project_assets.project_id
        AND p.client_token IS NOT NULL
    )
);
