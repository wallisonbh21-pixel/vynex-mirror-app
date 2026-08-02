CREATE TYPE public.app_role AS ENUM ('admin','vendedor','criador');

CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL DEFAULT '',
  phone text,
  pix_key text,
  commission_rate numeric NOT NULL DEFAULT 20,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, phone)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name',''), NEW.raw_user_meta_data->>'phone');
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, COALESCE((NEW.raw_user_meta_data->>'role')::public.app_role, 'vendedor'))
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END; $$;

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE POLICY "own profile read" ON public.profiles FOR SELECT TO authenticated
  USING (id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "own profile update" ON public.profiles FOR UPDATE TO authenticated
  USING (id = auth.uid() OR public.has_role(auth.uid(),'admin'))
  WITH CHECK (id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "own profile insert" ON public.profiles FOR INSERT TO authenticated
  WITH CHECK (id = auth.uid());

CREATE POLICY "roles read" ON public.user_roles FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));

CREATE TABLE public.clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company text NOT NULL,
  niche text,
  city text,
  contact_name text,
  contact_phone text,
  monthly_fee numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'ativo',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.clients TO authenticated;
GRANT ALL ON public.clients TO service_role;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
CREATE POLICY "clients own or admin" ON public.clients FOR ALL TO authenticated
  USING (owner_id = auth.uid() OR public.has_role(auth.uid(),'admin'))
  WITH CHECK (owner_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE TRIGGER clients_updated BEFORE UPDATE ON public.clients FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  company text,
  phone text,
  email text,
  source text,
  status text NOT NULL DEFAULT 'novo',
  estimated_value numeric NOT NULL DEFAULT 0,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.leads TO authenticated;
GRANT ALL ON public.leads TO service_role;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "leads own or admin" ON public.leads FOR ALL TO authenticated
  USING (owner_id = auth.uid() OR public.has_role(auth.uid(),'admin'))
  WITH CHECK (owner_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE TRIGGER leads_updated BEFORE UPDATE ON public.leads FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  creator_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  client_id uuid REFERENCES public.clients(id) ON DELETE SET NULL,
  title text NOT NULL,
  description text,
  status text NOT NULL DEFAULT 'fila',
  due_date date,
  value numeric NOT NULL DEFAULT 0,
  commission numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.projects TO authenticated;
GRANT ALL ON public.projects TO service_role;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "projects visible" ON public.projects FOR SELECT TO authenticated
  USING (owner_id = auth.uid() OR creator_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "projects insert" ON public.projects FOR INSERT TO authenticated
  WITH CHECK (owner_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "projects update" ON public.projects FOR UPDATE TO authenticated
  USING (owner_id = auth.uid() OR creator_id = auth.uid() OR public.has_role(auth.uid(),'admin'))
  WITH CHECK (owner_id = auth.uid() OR creator_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "projects delete" ON public.projects FOR DELETE TO authenticated
  USING (owner_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE TRIGGER projects_updated BEFORE UPDATE ON public.projects FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  month date NOT NULL,
  sales_target integer NOT NULL DEFAULT 0,
  revenue_target numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, month)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.goals TO authenticated;
GRANT ALL ON public.goals TO service_role;
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "goals own or admin" ON public.goals FOR ALL TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'))
  WITH CHECK (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));

CREATE TABLE public.transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type text NOT NULL DEFAULT 'comissao',
  amount numeric NOT NULL DEFAULT 0,
  description text,
  occurred_at date NOT NULL DEFAULT current_date,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.transactions TO authenticated;
GRANT ALL ON public.transactions TO service_role;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "transactions own or admin" ON public.transactions FOR ALL TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'))
  WITH CHECK (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));

CREATE TABLE public.withdrawals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount numeric NOT NULL DEFAULT 0,
  pix_key text,
  status text NOT NULL DEFAULT 'pendente',
  paid_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.withdrawals TO authenticated;
GRANT ALL ON public.withdrawals TO service_role;
ALTER TABLE public.withdrawals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "withdrawals own or admin" ON public.withdrawals FOR ALL TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'))
  WITH CHECK (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));