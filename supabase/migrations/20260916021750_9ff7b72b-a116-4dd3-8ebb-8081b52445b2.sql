GRANT EXECUTE ON FUNCTION public.can_use_nexusbuild(uuid) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.can_use_nexusbuild(uuid) FROM PUBLIC, anon;