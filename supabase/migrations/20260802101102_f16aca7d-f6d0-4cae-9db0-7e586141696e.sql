REVOKE ALL ON FUNCTION public.leads_close_to_pipeline() FROM anon, authenticated, public;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM anon, authenticated, public;
REVOKE ALL ON FUNCTION public.projects_protect_financials() FROM anon, authenticated, public;
REVOKE ALL ON FUNCTION public.projects_default_financials() FROM anon, authenticated, public;
REVOKE ALL ON FUNCTION public.projects_commission_sync() FROM anon, authenticated, public;
REVOKE ALL ON FUNCTION public.update_updated_at_column() FROM anon, authenticated, public;