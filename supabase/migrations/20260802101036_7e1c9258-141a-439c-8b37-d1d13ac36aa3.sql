-- 1) Perfil: apelido e foto
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS nickname text,
  ADD COLUMN IF NOT EXISTS avatar_url text;

-- 2) Novas funções administrativas
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'diretor';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'rh';

-- 3) Diretor herda acesso de admin (comparação textual evita uso do novo literal na mesma transação)
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id
      AND (role = _role OR (_role::text = 'admin' AND role::text = 'diretor'))
  )
$$;

-- 4) Comissão: somente admin/diretor define
CREATE OR REPLACE FUNCTION public.projects_protect_financials()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  IF auth.uid() IS NOT NULL AND NOT public.has_role(auth.uid(), 'admin') THEN
    NEW.commission = OLD.commission;
    NEW.commission_rate = OLD.commission_rate;
    NEW.commission_status = OLD.commission_status;
    IF auth.uid() <> OLD.owner_id THEN
      NEW.value = OLD.value;
      NEW.owner_id = OLD.owner_id;
      IF OLD.creator_id IS NOT NULL THEN
        NEW.creator_id = OLD.creator_id;
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS projects_protect_financials_trg ON public.projects;
CREATE TRIGGER projects_protect_financials_trg
BEFORE UPDATE ON public.projects
FOR EACH ROW EXECUTE FUNCTION public.projects_protect_financials();

CREATE OR REPLACE FUNCTION public.projects_default_financials()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  IF auth.uid() IS NOT NULL AND NOT public.has_role(auth.uid(), 'admin') THEN
    NEW.commission = 0;
    NEW.commission_rate = 30;
    NEW.commission_status = 'pendente';
  END IF;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS projects_default_financials_trg ON public.projects;
CREATE TRIGGER projects_default_financials_trg
BEFORE INSERT ON public.projects
FOR EACH ROW EXECUTE FUNCTION public.projects_default_financials();

DROP TRIGGER IF EXISTS projects_commission_sync_trg ON public.projects;
CREATE TRIGGER projects_commission_sync_trg
BEFORE UPDATE ON public.projects
FOR EACH ROW EXECUTE FUNCTION public.projects_commission_sync();

-- 5) Lead fechado -> cliente + contrato + projeto disponível
CREATE OR REPLACE FUNCTION public.leads_close_to_pipeline()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _company text;
  _amount numeric;
  _client_id uuid;
  _contract_id uuid;
BEGIN
  IF NEW.status <> 'fechado' OR OLD.status = 'fechado' THEN
    RETURN NEW;
  END IF;
  IF EXISTS (SELECT 1 FROM public.contracts WHERE lead_id = NEW.id) THEN
    RETURN NEW;
  END IF;

  _company := COALESCE(NULLIF(NEW.company, ''), NULLIF(NEW.trade_name, ''), NEW.name);
  _amount := GREATEST(COALESCE(NEW.closed_value, 0), COALESCE(NEW.estimated_value, 0));

  INSERT INTO public.clients (owner_id, company, niche, city, contact_name, contact_phone, monthly_fee, status, lead_id)
  VALUES (NEW.owner_id, _company, NEW.niche, NEW.city, NEW.name, COALESCE(NEW.whatsapp, NEW.phone), 0, 'ativo', NEW.id)
  RETURNING id INTO _client_id;

  INSERT INTO public.contracts (owner_id, lead_id, client_id, title, amount, monthly_fee, status, signed_at)
  VALUES (NEW.owner_id, NEW.id, _client_id, 'Contrato — ' || _company, _amount, 0, 'ativo', CURRENT_DATE)
  RETURNING id INTO _contract_id;

  UPDATE public.clients SET contract_id = _contract_id WHERE id = _client_id;

  INSERT INTO public.projects (owner_id, client_id, contract_id, title, status, value, commission_rate, commission_status)
  VALUES (NEW.owner_id, _client_id, _contract_id, 'Site — ' || _company, 'disponivel', _amount, 30, 'pendente');

  IF NEW.closed_at IS NULL THEN
    NEW.closed_at = now();
  END IF;
  IF COALESCE(NEW.closed_value, 0) = 0 THEN
    NEW.closed_value = _amount;
  END IF;

  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS leads_close_to_pipeline_trg ON public.leads;
CREATE TRIGGER leads_close_to_pipeline_trg
BEFORE UPDATE ON public.leads
FOR EACH ROW EXECUTE FUNCTION public.leads_close_to_pipeline();

DROP TRIGGER IF EXISTS leads_updated_at_trg ON public.leads;
CREATE TRIGGER leads_updated_at_trg
BEFORE UPDATE ON public.leads
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 6) Cadastro de admin apenas enquanto não houver nenhum
CREATE OR REPLACE FUNCTION public.admin_exists()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE role::text IN ('admin','diretor'))
$$;

GRANT EXECUTE ON FUNCTION public.admin_exists() TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _requested text;
  _role public.app_role;
BEGIN
  INSERT INTO public.profiles (id, full_name, phone)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name',''), NEW.raw_user_meta_data->>'phone')
  ON CONFLICT (id) DO NOTHING;

  _requested := COALESCE(NEW.raw_user_meta_data->>'role', 'vendedor');
  IF _requested NOT IN ('vendedor','criador','admin') THEN
    _requested := 'vendedor';
  END IF;
  IF _requested = 'admin' AND public.admin_exists() THEN
    _requested := 'vendedor';
  END IF;
  _role := _requested::public.app_role;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, _role)
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END; $$;