-- FINDING 1 & 4 Fixes
-- Revoke PUBLIC/authenticated EXECUTE on SECURITY DEFINER functions properly

BEGIN;

-- Revoke everything first to be sure
REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, authenticated, anon;
REVOKE ALL ON FUNCTION public.admin_exists() FROM PUBLIC, authenticated, anon;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, authenticated, anon;
REVOKE ALL ON FUNCTION public.set_client_token(text) FROM PUBLIC, authenticated, anon;

-- Explicitly GRANT EXECUTE only to necessary roles
-- has_role and admin_exists are used in RLS policies, so 'authenticated' NEEDS execute permission to run the policies.
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.admin_exists() TO authenticated, service_role;

-- handle_new_user is only for the auth trigger, so only service_role/system
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role;

-- set_client_token is for public portal, but we are going to replace it. 
-- For now, keep it for anon/authenticated if it's still being used, 
-- but later we'll remove it.
GRANT EXECUTE ON FUNCTION public.set_client_token(text) TO anon, authenticated, service_role;

-- Fix Finding 1: Prospecting Opportunities - Using OLD in RLS policies
-- Supabase/PG allows using 'prospecting_opportunities' name to refer to the NEW row, 
-- but accessing OLD values usually requires a different strategy if subqueries are forbidden.
-- However, we can use a simpler policy for ownership and a TRIGGER for restriction.

DROP POLICY IF EXISTS "Vendedor gerencia suas oportunidades" ON public.prospecting_opportunities;

CREATE POLICY "Vendedor gerencia suas oportunidades"
ON public.prospecting_opportunities
FOR ALL
TO authenticated
USING (
  (created_by = auth.uid()) OR 
  (assigned_to = auth.uid()) OR 
  public.has_role(auth.uid(), 'admin'::app_role)
);

-- Trigger to prevent assigned_to change by non-admins
CREATE OR REPLACE FUNCTION public.check_prospecting_assignment()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF (OLD.assigned_to IS DISTINCT FROM NEW.assigned_to) AND NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Somente administradores podem alterar o vendedor responsável.';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tr_check_prospecting_assignment ON public.prospecting_opportunities;
CREATE TRIGGER tr_check_prospecting_assignment
BEFORE UPDATE ON public.prospecting_opportunities
FOR EACH ROW
EXECUTE FUNCTION public.check_prospecting_assignment();

COMMIT;