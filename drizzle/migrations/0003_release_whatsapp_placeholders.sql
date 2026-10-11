-- Preenche nome e empresa do cliente na mensagem de WhatsApp preparada na liberação.
CREATE OR REPLACE FUNCTION public.sn_release_to_client(p_project_id uuid, p_whatsapp_message text DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _uid uuid := auth.uid(); _p record; _c record; _token text; _name text; _company text;
BEGIN
  IF _uid IS NULL OR NOT public.has_role(_uid,'admin') THEN
    RAISE EXCEPTION 'Apenas administradores podem liberar o envio ao cliente.' USING ERRCODE='42501';
  END IF;
  SELECT id, title, status, owner_id, creator_id, client_id INTO _p FROM public.projects WHERE id = p_project_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Projeto não encontrado.' USING ERRCODE='22023'; END IF;
  IF _p.status <> 'aguardando_aprovacao' THEN
    RAISE EXCEPTION 'Somente projetos aguardando aprovação interna podem ser liberados.' USING ERRCODE='22023';
  END IF;
  _token := encode(extensions.gen_random_bytes(32), 'hex');
  UPDATE public.projects SET status = 'aguardando_cliente', client_token = _token,
    client_token_expires_at = now() + interval '30 days', approved_to_client_by = _uid, approved_to_client_at = now()
  WHERE id = _p.id;
  SELECT id, company, contact_name, contact_email, contact_phone INTO _c FROM public.clients WHERE id = _p.client_id;
  _name := coalesce(nullif(_c.contact_name,''), nullif(_c.company,''), 'cliente');
  _company := coalesce(nullif(_c.company,''), 'sua empresa');

  INSERT INTO public.project_approval_events (project_id, actor_id, actor_label, event_type, message, previous_status, new_status)
  VALUES (_p.id, _uid, 'Administração', 'liberado_cliente',
          'Link seguro gerado para ' || coalesce(_c.company,'cliente') || '.', _p.status, 'aguardando_cliente');

  IF coalesce(_c.contact_phone,'') <> '' AND p_whatsapp_message IS NOT NULL THEN
    INSERT INTO public.whatsapp_messages (project_id, client_id, phone, message, notification_type, send_status)
    VALUES (_p.id, _c.id, _c.contact_phone,
      replace(replace(replace(left(p_whatsapp_message, 4000), '{{TOKEN}}', _token), '{{NAME}}', _name), '{{COMPANY}}', _company),
      'aprovacao_site', 'preparado');
  END IF;
  IF _p.creator_id IS NOT NULL THEN
    INSERT INTO public.notifications (user_id, title, body, category, project_id, link)
    VALUES (_p.creator_id, 'Seu projeto foi liberado para o cliente.', _p.title, 'aprovacao', _p.id, '/meus-projetos');
  END IF;
  INSERT INTO public.notifications (user_id, title, body, category, project_id, link)
  VALUES (_p.owner_id, 'Site enviado para aprovação do cliente.', coalesce(_c.company,'Cliente') || ' — ' || _p.title, 'aprovacao', _p.id, '/projetos');

  RETURN jsonb_build_object('token', _token, 'clientName', _name, 'company', _company, 'clientEmail', _c.contact_email);
END $$;
REVOKE ALL ON FUNCTION public.sn_release_to_client(uuid,text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.sn_release_to_client(uuid,text) TO authenticated, service_role;