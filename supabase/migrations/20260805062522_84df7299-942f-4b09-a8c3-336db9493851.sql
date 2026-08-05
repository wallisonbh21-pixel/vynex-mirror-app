CREATE TABLE public.project_briefings (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    data jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(project_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.project_briefings TO authenticated;
GRANT ALL ON public.project_briefings TO service_role;

ALTER TABLE public.project_briefings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Creators and admins can select briefings"
ON public.project_briefings
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.projects p
        WHERE p.id = project_briefings.project_id
        AND (p.creator_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
    )
);

CREATE POLICY "Creators can insert/update briefings"
ON public.project_briefings
FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.projects p
        WHERE p.id = project_briefings.project_id
        AND (p.creator_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
    )
);
