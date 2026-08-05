
-- Ajuste final: revogar anon de get_project_public_data (legado)
BEGIN;
REVOKE ALL ON FUNCTION public.get_project_public_data(uuid, text) FROM anon;
COMMIT;
