CREATE TABLE public.site_template_settings (
  template_id text PRIMARY KEY,
  status text NOT NULL DEFAULT 'ativo' CHECK (status IN ('ativo','inativo')),
  featured boolean NOT NULL DEFAULT false,
  display_order integer NOT NULL DEFAULT 100 CHECK (display_order BETWEEN 1 AND 9999),
  available_for_creators boolean NOT NULL DEFAULT true,
  available_for_clients boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid
);
GRANT SELECT, INSERT, UPDATE ON public.site_template_settings TO authenticated;
GRANT ALL ON public.site_template_settings TO service_role;
ALTER TABLE public.site_template_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Team reads template settings" ON public.site_template_settings FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'criador'));
CREATE POLICY "Admins insert template settings" ON public.site_template_settings FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins update template settings" ON public.site_template_settings FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

INSERT INTO public.site_template_settings (template_id,status,featured,display_order,available_for_creators,available_for_clients) VALUES
 ('tpl-imobiliaria-premium','ativo',true,1,true,false),
 ('tpl-ia-automacao','ativo',true,2,true,false),
 ('tpl-tecnologia-saas','ativo',true,3,true,false);

ALTER TABLE public.projects
  ADD COLUMN template_id text,
  ADD COLUMN template_selected_at timestamptz,
  ADD COLUMN template_selected_by uuid;

CREATE OR REPLACE FUNCTION public.projects_guard_template()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE s public.site_template_settings%ROWTYPE;
BEGIN
  IF NEW.template_id IS NOT DISTINCT FROM OLD.template_id THEN RETURN NEW; END IF;
  IF auth.uid() IS NULL THEN RETURN NEW; END IF;
  IF OLD.status NOT IN ('disponivel','briefing') THEN
    RAISE EXCEPTION 'TEMPLATE_LOCKED: este projeto já iniciou a produção; o modelo não pode mais ser alterado.';
  END IF;
  IF NEW.template_id IS NOT NULL AND NOT public.has_role(auth.uid(),'admin') THEN
    SELECT * INTO s FROM public.site_template_settings WHERE template_id = NEW.template_id;
    IF NOT FOUND OR s.status <> 'ativo' OR NOT s.available_for_creators THEN
      RAISE EXCEPTION 'TEMPLATE_UNAVAILABLE: modelo indisponível para criadores.';
    END IF;
  END IF;
  NEW.template_selected_at := now();
  NEW.template_selected_by := auth.uid();
  RETURN NEW;
END $$;
CREATE TRIGGER projects_guard_template_trg BEFORE UPDATE OF template_id ON public.projects
FOR EACH ROW EXECUTE FUNCTION public.projects_guard_template();