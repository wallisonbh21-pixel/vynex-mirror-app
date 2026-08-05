CREATE TABLE public.project_site_plans (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id uuid REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
    sections jsonb DEFAULT '[]'::jsonb NOT NULL,
    strategy jsonb DEFAULT '{}'::jsonb NOT NULL,
    primary_cta text,
    visual_direction text,
    completion integer DEFAULT 0,
    status text DEFAULT 'rascunho' CHECK (status IN ('rascunho', 'revisado', 'aprovado')),
    created_at timestamptz DEFAULT now() NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL,
    UNIQUE(project_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.project_site_plans TO authenticated;
GRANT ALL ON public.project_site_plans TO service_role;

ALTER TABLE public.project_site_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage site plans for their projects"
    ON public.project_site_plans
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.projects p
            WHERE p.id = project_site_plans.project_id
            AND (p.creator_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
        )
    );

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION public.handle_site_plan_updated()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_site_plan_updated
    BEFORE UPDATE ON public.project_site_plans
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_site_plan_updated();
