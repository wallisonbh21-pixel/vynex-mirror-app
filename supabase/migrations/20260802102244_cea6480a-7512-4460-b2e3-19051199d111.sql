-- Remove gatilhos duplicados (mesma função registrada mais de uma vez)
DROP TRIGGER IF EXISTS projects_protect_financials ON public.projects;
DROP TRIGGER IF EXISTS projects_commission_sync ON public.projects;
DROP TRIGGER IF EXISTS projects_updated ON public.projects;

-- Somente admin/diretor altera campos financeiros de projetos.
CREATE OR REPLACE FUNCTION public.projects_protect_financials()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NOT NULL AND NOT public.has_role(auth.uid(), 'admin') THEN
    NEW.value = OLD.value;
    NEW.commission = OLD.commission;
    NEW.commission_rate = OLD.commission_rate;
    NEW.owner_id = OLD.owner_id;

    -- A liberação da comissão na entrega continua automática (trigger de sync),
    -- mas ninguém sem perfil administrativo pode definir o status manualmente.
    IF NOT (NEW.status = 'entregue' AND OLD.status IS DISTINCT FROM 'entregue') THEN
      NEW.commission_status = OLD.commission_status;
    END IF;

    IF OLD.creator_id IS NOT NULL THEN
      NEW.creator_id = OLD.creator_id;
    END IF;
  END IF;
  RETURN NEW;
END; $$;

-- Somente admin/diretor altera o percentual de comissão do perfil.
CREATE OR REPLACE FUNCTION public.profiles_protect_commission()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NOT NULL AND NOT public.has_role(auth.uid(), 'admin') THEN
    NEW.commission_rate = OLD.commission_rate;
  END IF;
  RETURN NEW;
END; $$;

REVOKE EXECUTE ON FUNCTION public.profiles_protect_commission() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS profiles_protect_commission_trg ON public.profiles;
CREATE TRIGGER profiles_protect_commission_trg
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.profiles_protect_commission();