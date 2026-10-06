CREATE TABLE public.project_sites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL UNIQUE REFERENCES public.projects(id) ON DELETE CASCADE,
  slug text NOT NULL UNIQUE CHECK (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' AND char_length(slug) BETWEEN 3 AND 60),
  status text NOT NULL DEFAULT 'RASCUNHO' CHECK (status IN ('RASCUNHO','PUBLICADO','ARQUIVADO')),
  current_version_id uuid,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.project_sites TO authenticated;
GRANT ALL ON public.project_sites TO service_role;
ALTER TABLE public.project_sites ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Team can view project sites" ON public.project_sites FOR SELECT TO authenticated
USING (public.has_role(auth.uid(),'admin') OR EXISTS (SELECT 1 FROM public.projects p WHERE p.id = project_sites.project_id AND p.creator_id = auth.uid()));

CREATE TABLE public.project_site_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id uuid NOT NULL REFERENCES public.project_sites(id) ON DELETE CASCADE,
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  version_number integer NOT NULL,
  status text NOT NULL DEFAULT 'PUBLICADO' CHECK (status IN ('PUBLICADO','ARQUIVADO')),
  sections jsonb NOT NULL,
  design_system jsonb NOT NULL,
  site_title text,
  published_by uuid NOT NULL,
  published_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (site_id, version_number)
);
GRANT SELECT ON public.project_site_versions TO authenticated;
GRANT ALL ON public.project_site_versions TO service_role;
ALTER TABLE public.project_site_versions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Team can view site versions" ON public.project_site_versions FOR SELECT TO authenticated
USING (public.has_role(auth.uid(),'admin') OR EXISTS (SELECT 1 FROM public.projects p WHERE p.id = project_site_versions.project_id AND p.creator_id = auth.uid()));

ALTER TABLE public.project_sites ADD CONSTRAINT project_sites_current_version_fk FOREIGN KEY (current_version_id) REFERENCES public.project_site_versions(id) ON DELETE SET NULL;

-- Conteúdo publicado é imutável (exceto mudança de status para ARQUIVADO)
CREATE OR REPLACE FUNCTION public.protect_site_version_content()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.sections IS DISTINCT FROM OLD.sections OR NEW.design_system IS DISTINCT FROM OLD.design_system
     OR NEW.version_number <> OLD.version_number OR NEW.project_id <> OLD.project_id OR NEW.site_id <> OLD.site_id
     OR NEW.published_at <> OLD.published_at OR NEW.published_by <> OLD.published_by THEN
    RAISE EXCEPTION 'Versões publicadas são imutáveis';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER trg_protect_site_version BEFORE UPDATE ON public.project_site_versions
FOR EACH ROW EXECUTE FUNCTION public.protect_site_version_content();

CREATE OR REPLACE FUNCTION public.publish_project_site(p_project_id uuid, p_slug text)
RETURNS TABLE(slug text, version_number integer, version_id uuid)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_project record;
  v_studio record;
  v_site record;
  v_slug text;
  v_next int;
  v_vid uuid;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Não autenticado'; END IF;
  SELECT id, title, creator_id INTO v_project FROM projects WHERE id = p_project_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Projeto não encontrado'; END IF;
  IF NOT (has_role(v_uid,'admin') OR v_project.creator_id = v_uid) THEN
    RAISE EXCEPTION 'Sem permissão para publicar este projeto';
  END IF;

  SELECT sections, design_system INTO v_studio FROM project_studio_data WHERE project_id = p_project_id;
  IF NOT FOUND OR v_studio.sections IS NULL OR jsonb_typeof(v_studio.sections) <> 'array' OR jsonb_array_length(v_studio.sections) = 0 THEN
    RAISE EXCEPTION 'O site precisa ter ao menos uma seção salva antes de publicar';
  END IF;
  IF v_studio.design_system IS NULL OR jsonb_typeof(v_studio.design_system) <> 'object' THEN
    RAISE EXCEPTION 'Sistema visual inválido';
  END IF;

  SELECT * INTO v_site FROM project_sites WHERE project_id = p_project_id FOR UPDATE;
  IF NOT FOUND THEN
    v_slug := lower(trim(coalesce(p_slug, '')));
    IF v_slug !~ '^[a-z0-9]+(-[a-z0-9]+)*$' OR char_length(v_slug) NOT BETWEEN 3 AND 60 THEN
      RAISE EXCEPTION 'Endereço inválido: use letras minúsculas, números e hífens (3 a 60)';
    END IF;
    IF EXISTS (SELECT 1 FROM project_sites s WHERE s.slug = v_slug) THEN
      RAISE EXCEPTION 'Este endereço já está em uso';
    END IF;
    INSERT INTO project_sites(project_id, slug, created_by) VALUES (p_project_id, v_slug, v_uid) RETURNING * INTO v_site;
  END IF;

  SELECT coalesce(max(v.version_number),0)+1 INTO v_next FROM project_site_versions v WHERE v.site_id = v_site.id;
  UPDATE project_site_versions SET status = 'ARQUIVADO' WHERE site_id = v_site.id AND status = 'PUBLICADO';
  INSERT INTO project_site_versions(site_id, project_id, version_number, sections, design_system, site_title, published_by)
  VALUES (v_site.id, p_project_id, v_next, v_studio.sections, v_studio.design_system, v_project.title, v_uid)
  RETURNING id INTO v_vid;
  UPDATE project_sites SET current_version_id = v_vid, status = 'PUBLICADO', updated_at = now() WHERE id = v_site.id;

  RETURN QUERY SELECT v_site.slug, v_next, v_vid;
END $$;
REVOKE ALL ON FUNCTION public.publish_project_site(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.publish_project_site(uuid, text) TO authenticated;

CREATE OR REPLACE FUNCTION public.get_published_site(p_slug text)
RETURNS TABLE(site_title text, version_number integer, published_at timestamptz, sections jsonb, design_system jsonb)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT v.site_title, v.version_number, v.published_at, v.sections, v.design_system
  FROM project_sites s JOIN project_site_versions v ON v.id = s.current_version_id
  WHERE s.slug = lower(p_slug) AND s.status = 'PUBLICADO'
  LIMIT 1
$$;
REVOKE ALL ON FUNCTION public.get_published_site(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_published_site(text) TO anon, authenticated;