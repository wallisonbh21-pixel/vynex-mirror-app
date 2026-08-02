-- 1) Novos campos de produção/entrega/comissão
ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS site_type text,
  ADD COLUMN IF NOT EXISTS commission_rate numeric NOT NULL DEFAULT 30,
  ADD COLUMN IF NOT EXISTS commission_status text NOT NULL DEFAULT 'pendente',
  ADD COLUMN IF NOT EXISTS assigned_at timestamptz,
  ADD COLUMN IF NOT EXISTS delivered_at timestamptz,
  ADD COLUMN IF NOT EXISTS delivery_link text,
  ADD COLUMN IF NOT EXISTS delivery_notes text;

-- 2) Migrar status antigos para o novo fluxo
UPDATE public.projects SET status = 'disponivel' WHERE status = 'fila';
UPDATE public.projects SET status = 'aguardando_aprovacao' WHERE status = 'revisao';
UPDATE public.projects SET status = 'em_producao' WHERE status = 'producao';
ALTER TABLE public.projects ALTER COLUMN status SET DEFAULT 'disponivel';

-- 3) Comissão disponível quando entregue
CREATE OR REPLACE FUNCTION public.projects_commission_sync()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'entregue' AND (OLD.status IS DISTINCT FROM 'entregue') THEN
    NEW.delivered_at = COALESCE(NEW.delivered_at, now());
    IF NEW.commission_status = 'pendente' THEN
      NEW.commission_status = 'disponivel';
    END IF;
  END IF;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS projects_commission_sync ON public.projects;
CREATE TRIGGER projects_commission_sync
BEFORE UPDATE ON public.projects
FOR EACH ROW EXECUTE FUNCTION public.projects_commission_sync();

DROP TRIGGER IF EXISTS projects_updated_at ON public.projects;
CREATE TRIGGER projects_updated_at
BEFORE UPDATE ON public.projects
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 4) Criador não pode alterar valores/comissão nem reatribuir o projeto
CREATE OR REPLACE FUNCTION public.projects_protect_financials()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NOT NULL
     AND auth.uid() <> OLD.owner_id
     AND NOT public.has_role(auth.uid(), 'admin') THEN
    NEW.value = OLD.value;
    NEW.commission = OLD.commission;
    NEW.commission_rate = OLD.commission_rate;
    NEW.commission_status = OLD.commission_status;
    NEW.owner_id = OLD.owner_id;
    IF OLD.creator_id IS NOT NULL THEN
      NEW.creator_id = OLD.creator_id;
    END IF;
  END IF;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS projects_protect_financials ON public.projects;
CREATE TRIGGER projects_protect_financials
BEFORE UPDATE ON public.projects
FOR EACH ROW EXECUTE FUNCTION public.projects_protect_financials();

-- 5) Vitrine: projetos disponíveis visíveis para criadores
DROP POLICY IF EXISTS "projects available to creators" ON public.projects;
CREATE POLICY "projects available to creators"
ON public.projects FOR SELECT TO authenticated
USING (status = 'disponivel' AND creator_id IS NULL AND public.has_role(auth.uid(), 'criador'));

-- 6) Assumir projeto de forma atômica (primeiro que clicar leva)
CREATE OR REPLACE FUNCTION public.claim_project(_project_id uuid)
RETURNS public.projects
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _row public.projects;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Não autenticado';
  END IF;
  IF NOT (public.has_role(auth.uid(), 'criador') OR public.has_role(auth.uid(), 'admin')) THEN
    RAISE EXCEPTION 'Apenas criadores podem assumir projetos';
  END IF;

  UPDATE public.projects
     SET creator_id = auth.uid(),
         status = 'em_producao',
         assigned_at = now(),
         updated_at = now()
   WHERE id = _project_id
     AND creator_id IS NULL
     AND status = 'disponivel'
  RETURNING * INTO _row;

  IF _row.id IS NULL THEN
    RAISE EXCEPTION 'Este projeto já foi assumido por outro criador';
  END IF;

  RETURN _row;
END; $$;

REVOKE ALL ON FUNCTION public.claim_project(uuid) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.claim_project(uuid) TO authenticated;