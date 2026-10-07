CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE
  _requested text;
  _role public.app_role;
BEGIN
  INSERT INTO public.profiles (id, full_name, phone)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name',''), NEW.raw_user_meta_data->>'phone')
  ON CONFLICT (id) DO NOTHING;

  _requested := COALESCE(NEW.raw_user_meta_data->>'role', 'vendedor');

  -- Each account receives exactly one role. Privileged roles (criador, diretor, rh)
  -- are never self-assigned; admin only for the very first admin.
  IF _requested = 'admin' AND NOT public.admin_exists() THEN
    _role := 'admin'::public.app_role;
  ELSIF _requested = 'cliente' THEN
    _role := 'cliente'::public.app_role;
  ELSE
    _role := 'vendedor'::public.app_role;
  END IF;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, _role)
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$function$;