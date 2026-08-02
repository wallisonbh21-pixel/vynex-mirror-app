CREATE TABLE public.prospecting_opportunities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_name text NOT NULL,
  category text,
  phone text,
  email text,
  address text,
  city text,
  state text,
  website text,
  instagram text,
  facebook text,
  google_maps_url text,
  place_id text,
  rating numeric,
  review_count integer NOT NULL DEFAULT 0,
  has_website boolean NOT NULL DEFAULT false,
  has_social_media boolean NOT NULL DEFAULT false,
  opportunity_level text NOT NULL DEFAULT 'alta',
  source text NOT NULL DEFAULT 'manual',
  status text NOT NULL DEFAULT 'nova',
  notes text,
  lead_id uuid REFERENCES public.leads(id) ON DELETE SET NULL,
  assigned_to uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.prospecting_opportunities TO authenticated;
GRANT ALL ON public.prospecting_opportunities TO service_role;
ALTER TABLE public.prospecting_opportunities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Vendedor gerencia suas oportunidades"
ON public.prospecting_opportunities FOR ALL TO authenticated
USING (auth.uid() = created_by OR auth.uid() = assigned_to OR public.has_role(auth.uid(), 'admin'))
WITH CHECK (auth.uid() = created_by OR public.has_role(auth.uid(), 'admin'));

CREATE UNIQUE INDEX prospecting_unique_business
  ON public.prospecting_opportunities (created_by, lower(business_name), lower(coalesce(city,'')), lower(coalesce(state,'')));
CREATE UNIQUE INDEX prospecting_unique_phone
  ON public.prospecting_opportunities (created_by, regexp_replace(phone, '\D', '', 'g'))
  WHERE phone IS NOT NULL AND phone <> '';

CREATE INDEX prospecting_status_idx ON public.prospecting_opportunities (status);
CREATE INDEX prospecting_level_idx ON public.prospecting_opportunities (opportunity_level);

CREATE OR REPLACE FUNCTION public.prospecting_set_level()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  NEW.has_website := COALESCE(NEW.has_website, false) OR (COALESCE(NEW.website,'') <> '');
  NEW.has_social_media := COALESCE(NEW.has_social_media, false)
    OR (COALESCE(NEW.instagram,'') <> '') OR (COALESCE(NEW.facebook,'') <> '');

  IF NEW.has_website THEN
    NEW.opportunity_level := 'baixa';
  ELSIF NEW.has_social_media THEN
    NEW.opportunity_level := 'media';
  ELSE
    NEW.opportunity_level := 'alta';
  END IF;

  IF NEW.assigned_to IS NULL THEN
    NEW.assigned_to := NEW.created_by;
  END IF;

  NEW.updated_at := now();
  RETURN NEW;
END; $$;

CREATE TRIGGER prospecting_set_level_trg
BEFORE INSERT OR UPDATE ON public.prospecting_opportunities
FOR EACH ROW EXECUTE FUNCTION public.prospecting_set_level();

CREATE TABLE public.prospecting_status_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  opportunity_id uuid NOT NULL REFERENCES public.prospecting_opportunities(id) ON DELETE CASCADE,
  actor_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  previous_status text,
  new_status text NOT NULL,
  message text,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.prospecting_status_events TO authenticated;
GRANT ALL ON public.prospecting_status_events TO service_role;
ALTER TABLE public.prospecting_status_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Ver histórico das próprias oportunidades"
ON public.prospecting_status_events FOR SELECT TO authenticated
USING (
  public.has_role(auth.uid(), 'admin')
  OR EXISTS (
    SELECT 1 FROM public.prospecting_opportunities o
    WHERE o.id = opportunity_id AND (o.created_by = auth.uid() OR o.assigned_to = auth.uid())
  )
);

CREATE POLICY "Registrar histórico das próprias oportunidades"
ON public.prospecting_status_events FOR INSERT TO authenticated
WITH CHECK (
  actor_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM public.prospecting_opportunities o
    WHERE o.id = opportunity_id AND (o.created_by = auth.uid() OR o.assigned_to = auth.uid() OR public.has_role(auth.uid(), 'admin'))
  )
);

CREATE TRIGGER prospecting_updated_at
BEFORE UPDATE ON public.prospecting_opportunities
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();