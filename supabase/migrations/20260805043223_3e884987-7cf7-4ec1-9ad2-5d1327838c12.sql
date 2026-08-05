-- Checklist items for projects
CREATE TABLE public.project_checklist_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    completed BOOLEAN DEFAULT FALSE NOT NULL,
    completed_at TIMESTAMPTZ,
    completed_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Project notes/internal observations
CREATE TABLE public.project_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
    author_id UUID REFERENCES auth.users(id) NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Grants
GRANT SELECT, INSERT, UPDATE, DELETE ON public.project_checklist_items TO authenticated;
GRANT ALL ON public.project_checklist_items TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.project_notes TO authenticated;
GRANT ALL ON public.project_notes TO service_role;

-- RLS
ALTER TABLE public.project_checklist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_notes ENABLE ROW LEVEL SECURITY;

-- Policies for project_checklist_items
CREATE POLICY "Creators can manage checklist items of their assigned projects"
ON public.project_checklist_items
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.projects
    WHERE projects.id = project_checklist_items.project_id
    AND (projects.creator_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.projects
    WHERE projects.id = project_checklist_items.project_id
    AND (projects.creator_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
  )
);

-- Policies for project_notes
CREATE POLICY "Creators can manage notes of their assigned projects"
ON public.project_notes
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.projects
    WHERE projects.id = project_notes.project_id
    AND (projects.creator_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.projects
    WHERE projects.id = project_notes.project_id
    AND (projects.creator_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
  )
);
