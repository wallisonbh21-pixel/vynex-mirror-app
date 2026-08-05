-- Table for storing user's favorite library items
CREATE TABLE public.studio_favorites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    item_id TEXT NOT NULL, -- Can be a section ID, template ID, or element type
    item_type TEXT NOT NULL CHECK (item_type IN ('template', 'section', 'element')),
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(user_id, item_id, item_type)
);

GRANT SELECT, INSERT, DELETE ON public.studio_favorites TO authenticated;
GRANT ALL ON public.studio_favorites TO service_role;

ALTER TABLE public.studio_favorites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own favorites"
ON public.studio_favorites
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Table for storing user-created templates
CREATE TABLE public.studio_user_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    creator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL,
    niche TEXT,
    structure JSONB NOT NULL, -- Complete StudioData
    preview_url TEXT,
    tags TEXT[],
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.studio_user_templates TO authenticated;
GRANT ALL ON public.studio_user_templates TO service_role;

ALTER TABLE public.studio_user_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Creators can manage their own templates"
ON public.studio_user_templates
FOR ALL
TO authenticated
USING (auth.uid() = creator_id)
WITH CHECK (auth.uid() = creator_id);
