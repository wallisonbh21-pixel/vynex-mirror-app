CREATE OR REPLACE FUNCTION public.sn_client_last_access(p_client_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid uuid := auth.uid();
  _owner uuid;
  _client_user uuid;
  _last timestamptz;
  _created timestamptz;
BEGIN
  IF _uid IS NULL THEN
    RAISE EXCEPTION 'Não autorizado.' USING ERRCODE = '42501';
  END IF;

  SELECT owner_id, user_id INTO _owner, _client_user FROM public.clients WHERE id = p_client_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Acesso negado.' USING ERRCODE = '42501';
  END IF;

  IF NOT (
    public.has_role(_uid, 'admin') OR public.has_role(_uid, 'diretor')
    OR (public.has_role(_uid, 'vendedor') AND _owner = _uid)
  ) THEN
    RAISE EXCEPTION 'Acesso negado.' USING ERRCODE = '42501';
  END IF;

  IF _client_user IS NULL THEN
    RETURN jsonb_build_object('last_sign_in_at', NULL, 'created_at', NULL);
  END IF;

  SELECT last_sign_in_at, created_at INTO _last, _created FROM auth.users WHERE id = _client_user;
  RETURN jsonb_build_object('last_sign_in_at', _last, 'created_at', _created);
END;
$$;

REVOKE ALL ON FUNCTION public.sn_client_last_access(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.sn_client_last_access(uuid) TO authenticated;