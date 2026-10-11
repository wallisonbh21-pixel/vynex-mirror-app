-- ScaleNexus: funções seguras que substituem o uso da chave administrativa.
-- Todas: SECURITY DEFINER, search_path fixo, identidade via auth.uid(), autorização explícita.

-- 1. Cadastro de clientes (admin/diretor/vendedor; dono = chamador)
CREATE OR REPLACE FUNCTION public.sn_register_client(
  p_contact_email text, p_contact_name text DEFAULT '', p_contact_phone text DEFAULT '',
  p_company text DEFAULT '', p_notes text DEFAULT ''
) RETURNS public.clients LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _uid uuid := auth.uid(); _row public.clients;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'Não autorizado.' USING ERRCODE = '42501'; END IF;
  IF NOT (public.has_role(_uid,'admin') OR public.has_role(_uid,'vendedor')) THEN
    RAISE EXCEPTION 'Você não tem permissão para cadastrar clientes.' USING ERRCODE = '42501';
  END IF;
  IF p_contact_email IS NULL OR p_contact_email !~* '^[^@\s]+@[^@\s]+\.[^@\s]+$' OR length(p_contact_email) > 255 THEN
    RAISE EXCEPTION 'E-mail inválido' USING ERRCODE = '22023';
  END IF;
  INSERT INTO public.clients (contact_name, contact_email, contact_phone, company, notes, owner_id, status)
  VALUES (left(coalesce(p_contact_name,''),200), lower(trim(p_contact_email)), left(coalesce(p_contact_phone,''),40),
          left(coalesce(p_company,''),200), left(coalesce(p_notes,''),5000), _uid, 'ativo')
  RETURNING * INTO _row;
  RETURN _row;
END $$;

-- 2. Exclusão de clientes (admin: qualquer; vendedor: só os próprios; bloqueia se houver projetos)
CREATE OR REPLACE FUNCTION public.sn_delete_client(p_client_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _uid uuid := auth.uid(); _is_admin boolean; _c record; _n int;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'Não autorizado.' USING ERRCODE = '42501'; END IF;
  _is_admin := public.has_role(_uid,'admin');
  IF NOT (_is_admin OR public.has_role(_uid,'vendedor')) THEN
    RAISE EXCEPTION 'Você não tem permissão para excluir clientes.' USING ERRCODE = '42501';
  END IF;
  SELECT id, owner_id, user_id, contact_name INTO _c FROM public.clients WHERE id = p_client_id FOR UPDATE;
  IF NOT FOUND OR (NOT _is_admin AND _c.owner_id <> _uid) THEN
    RAISE EXCEPTION 'Cliente não encontrado ou fora da sua carteira.' USING ERRCODE = '42501';
  END IF;
  SELECT count(*) INTO _n FROM public.projects WHERE client_id = p_client_id;
  IF _n > 0 THEN
    RAISE EXCEPTION 'Não é possível excluir o cliente "%" porque existem % projetos vinculados a ele.', _c.contact_name, _n USING ERRCODE = '23503';
  END IF;
  DELETE FROM public.clients WHERE id = p_client_id;
  RETURN jsonb_build_object('success', true, 'hadAuthUser', _c.user_id IS NOT NULL);
END $$;

-- 3. Funil comercial público (transação única; sem leitura pública de tabelas)
CREATE OR REPLACE FUNCTION public.sn_submit_public_lead(
  p_name text, p_company text, p_email text, p_whatsapp text, p_city text, p_state text,
  p_segment text, p_service_id uuid, p_referral_token text DEFAULT NULL, p_details jsonb DEFAULT '{}'::jsonb
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _default_admin uuid := 'ce4c32ee-583a-456c-8f0b-a516188d196b';
  _email text := lower(trim(coalesce(p_email,'')));
  _wa text := regexp_replace(coalesce(p_whatsapp,''), '\D', '', 'g');
  _svc record; _tok record; _existing record;
  _originator uuid; _token_id uuid; _source text := 'direto'; _display text := 'ScaleNexus / Direto';
  _lead_id uuid; _owner uuid;
BEGIN
  IF length(trim(coalesce(p_name,''))) < 2 OR length(p_name) > 200 THEN RAISE EXCEPTION 'Nome inválido.' USING ERRCODE='22023'; END IF;
  IF _email !~* '^[^@\s]+@[^@\s]+\.[^@\s]+$' OR length(_email) > 255 THEN RAISE EXCEPTION 'E-mail inválido.' USING ERRCODE='22023'; END IF;
  IF length(_wa) < 10 OR length(_wa) > 15 THEN RAISE EXCEPTION 'WhatsApp inválido.' USING ERRCODE='22023'; END IF;
  IF length(coalesce(p_company,'')) > 200 OR length(coalesce(p_city,'')) > 120 OR length(coalesce(p_state,'')) > 60
     OR length(coalesce(p_segment,'')) > 120 OR length(coalesce(p_details::text,'')) > 20000 THEN
    RAISE EXCEPTION 'Dados muito longos.' USING ERRCODE='22023';
  END IF;
  -- Proteção contra abuso: no máximo 3 envios do mesmo contato em 10 minutos e 30 leads públicos/minuto no total
  IF (SELECT count(*) FROM public.lead_activities a JOIN public.leads l ON l.id = a.lead_id
      WHERE (l.email = _email OR l.whatsapp = _wa) AND a.created_at > now() - interval '10 minutes') >= 3
     OR (SELECT count(*) FROM public.leads WHERE source IN ('direto','indicacao','indicacao_institucional')
         AND created_at > now() - interval '1 minute') >= 30 THEN
    RAISE EXCEPTION 'Muitas solicitações. Tente novamente em alguns minutos.' USING ERRCODE='54000';
  END IF;

  SELECT id, name, is_active INTO _svc FROM public.services_catalog WHERE id = p_service_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'O serviço selecionado não foi encontrado no nosso catálogo.' USING ERRCODE='22023'; END IF;
  IF NOT coalesce(_svc.is_active,false) THEN RAISE EXCEPTION 'O serviço "%" não está disponível no momento.', _svc.name USING ERRCODE='22023'; END IF;

  SELECT id, owner_id INTO _existing FROM public.leads WHERE email = _email OR whatsapp = _wa ORDER BY created_at LIMIT 1;
  IF FOUND THEN
    INSERT INTO public.lead_activities (lead_id, user_id, type, description, happened_at)
    VALUES (_existing.id, coalesce(_existing.owner_id, _default_admin), 'status',
            'Novo interesse recebido via Funil. Serviço: ' || _svc.name || '.', CURRENT_DATE);
    RETURN jsonb_build_object('success', true, 'isNew', false, 'message', 'Interesse registrado com sucesso.');
  END IF;

  IF p_referral_token IS NOT NULL AND length(p_referral_token) BETWEEN 4 AND 200 THEN
    SELECT id, seller_id, is_active, is_institutional INTO _tok FROM public.referral_tokens WHERE token = p_referral_token;
    IF FOUND THEN
      IF NOT coalesce(_tok.is_active,false) THEN RAISE EXCEPTION 'Este link de indicação não está mais ativo.' USING ERRCODE='22023'; END IF;
      _token_id := _tok.id; _originator := _tok.seller_id;
      IF coalesce(_tok.is_institutional,false) THEN _source := 'indicacao_institucional'; _display := 'ScaleNexus / Institucional';
      ELSE _source := 'indicacao'; _display := 'Indicação de Vendedor'; END IF;
    END IF;
  END IF;

  _owner := coalesce(_originator, _default_admin);
  INSERT INTO public.leads (name, company, estimated_value, closed_value, email, whatsapp, city, state, niche, status, source, owner_id, notes)
  VALUES (trim(p_name), nullif(trim(coalesce(p_company,'')),''), 0, 0, _email, _wa, p_city, p_state, p_segment, 'novo', _source, _owner,
          'Origem: ' || _display || E'\nInteresse inicial: ' || coalesce(p_details->>'objective', p_details->>'needs', '') ||
          E'\nServiço Escolhido: ' || _svc.name || ' (ID: ' || _svc.id || E')\nDados do Briefing: ' || coalesce(p_details::text,'{}'))
  RETURNING id INTO _lead_id;

  INSERT INTO public.lead_attribution (lead_id, originator_id, current_responsible_id, referral_token_id)
  VALUES (_lead_id, _originator, CASE WHEN _source = 'indicacao' AND _originator IS NOT NULL THEN _originator ELSE _default_admin END, _token_id);

  INSERT INTO public.lead_activities (lead_id, user_id, type, description, happened_at)
  VALUES (_lead_id, _owner, 'status', 'Lead criado via formulário público. Origem: ' || _display || '.', CURRENT_DATE);

  RETURN jsonb_build_object('success', true, 'isNew', true, 'leadId', _lead_id, 'message', 'Lead criado com sucesso.');
END $$;

-- 4. Indicações
CREATE OR REPLACE FUNCTION public.sn_get_referral_token()
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE _uid uuid := auth.uid(); _t record;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'Não autorizado.' USING ERRCODE='42501'; END IF;
  IF public.has_role(_uid,'admin') THEN
    SELECT token, is_active, is_institutional INTO _t FROM public.referral_tokens WHERE is_active AND is_institutional LIMIT 1;
  ELSE
    SELECT token, is_active, is_institutional INTO _t FROM public.referral_tokens
    WHERE is_active AND seller_id = _uid AND NOT coalesce(is_institutional,false) LIMIT 1;
  END IF;
  IF NOT FOUND THEN RETURN jsonb_build_object('token', null, 'is_active', false, 'is_institutional', false, 'exists', false); END IF;
  RETURN jsonb_build_object('token', _t.token, 'is_active', _t.is_active, 'is_institutional', _t.is_institutional, 'exists', true);
END $$;

CREATE OR REPLACE FUNCTION public.sn_referral_leads()
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE _uid uuid := auth.uid(); _admin boolean;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'Não autorizado.' USING ERRCODE='42501'; END IF;
  _admin := public.has_role(_uid,'admin');
  RETURN coalesce((
    SELECT jsonb_agg(jsonb_build_object(
      'lead_id', a.lead_id, 'originator_id', a.originator_id, 'current_responsible_id', a.current_responsible_id,
      'attributed_at', a.attributed_at,
      'leads', CASE WHEN l.id IS NULL THEN NULL ELSE jsonb_build_object('id', l.id, 'name', l.name, 'company', l.company, 'status', l.status, 'created_at', l.created_at, 'niche', l.niche) END,
      'current_responsible', CASE WHEN p.id IS NULL THEN NULL ELSE jsonb_build_object('id', p.id, 'full_name', p.full_name, 'nickname', p.nickname) END
    ) ORDER BY a.attributed_at DESC)
    FROM public.lead_attribution a
    LEFT JOIN public.leads l ON l.id = a.lead_id
    LEFT JOIN public.profiles p ON p.id = a.current_responsible_id
    WHERE _admin OR a.originator_id = _uid
  ), '[]'::jsonb);
END $$;

CREATE OR REPLACE FUNCTION public.sn_referral_metrics()
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE _uid uuid := auth.uid(); _admin boolean; _t int; _n int; _neg int; _c int;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'Não autorizado.' USING ERRCODE='42501'; END IF;
  _admin := public.has_role(_uid,'admin');
  SELECT count(*), count(*) FILTER (WHERE l.status='novo'),
         count(*) FILTER (WHERE l.status IN ('contatado','interessado','proposta','negociacao')),
         count(*) FILTER (WHERE l.status='fechado')
  INTO _t, _n, _neg, _c
  FROM public.lead_attribution a JOIN public.leads l ON l.id = a.lead_id
  WHERE _admin OR a.originator_id = _uid;
  RETURN jsonb_build_object('total', _t, 'novos', _n, 'emNegociacao', _neg, 'convertidos', _c,
    'taxaConversao', CASE WHEN _t > 0 THEN round(_c * 100.0 / _t) ELSE 0 END);
END $$;

CREATE OR REPLACE FUNCTION public.sn_admin_referral_stats()
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE _uid uuid := auth.uid();
BEGIN
  IF _uid IS NULL OR NOT public.has_role(_uid,'admin') THEN RAISE EXCEPTION 'Acesso negado' USING ERRCODE='42501'; END IF;
  RETURN jsonb_build_object(
    'total', (SELECT count(*) FROM public.leads),
    'performance', coalesce((
      SELECT jsonb_agg(x) FROM (
        SELECT coalesce(p.nickname, p.full_name, 'Vendedor') AS name, count(*)::int AS total,
               count(*) FILTER (WHERE l.status='fechado')::int AS convertidos,
               round(count(*) FILTER (WHERE l.status='fechado') * 100.0 / count(*))::int AS taxa
        FROM public.lead_attribution a JOIN public.leads l ON l.id = a.lead_id JOIN public.profiles p ON p.id = a.originator_id
        GROUP BY p.id, p.nickname, p.full_name
      ) x), '[]'::jsonb));
END $$;

-- 5. Aprovações (link público por token)
CREATE OR REPLACE FUNCTION public.sn_approval_view(p_token text)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE _p record; _c record;
BEGIN
  IF p_token IS NULL OR length(p_token) < 16 OR length(p_token) > 200 THEN RETURN jsonb_build_object('valid', false); END IF;
  SELECT * INTO _p FROM public.projects WHERE client_token = p_token;
  IF NOT FOUND OR (_p.client_token_expires_at IS NOT NULL AND _p.client_token_expires_at < now()) THEN
    RETURN jsonb_build_object('valid', false);
  END IF;
  SELECT company, contact_name INTO _c FROM public.clients WHERE id = _p.client_id;
  RETURN jsonb_build_object('valid', true,
    'project', jsonb_build_object('title', _p.title, 'siteType', _p.site_type, 'status', _p.status,
      'deliveryLink', _p.delivery_link, 'deliveryNotes', _p.delivery_notes,
      'releasedAt', _p.approved_to_client_at, 'approvedAt', _p.client_approved_at),
    'client', jsonb_build_object('name', coalesce(_c.contact_name,''), 'company', coalesce(_c.company,'')));
END $$;

CREATE OR REPLACE FUNCTION public.sn_client_approval_action(p_token text, p_action text, p_message text DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _p record; _c record; _label text; _new text; _msg text := left(trim(coalesce(p_message,'')), 2000);
  _title_admin text; _title_creator text; _title_owner text; _body text;
BEGIN
  IF p_action NOT IN ('approve','changes') THEN RETURN jsonb_build_object('ok', false, 'error', 'Ação inválida.'); END IF;
  IF p_token IS NULL OR length(p_token) < 16 OR length(p_token) > 200 THEN RETURN jsonb_build_object('ok', false, 'error', 'Este link não é mais válido.'); END IF;
  SELECT * INTO _p FROM public.projects WHERE client_token = p_token FOR UPDATE;
  IF NOT FOUND OR (_p.client_token_expires_at IS NOT NULL AND _p.client_token_expires_at < now()) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Este link não é mais válido.');
  END IF;
  IF p_action = 'approve' AND (_p.client_approved_at IS NOT NULL OR _p.status = 'aprovado') THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Este site já foi aprovado anteriormente.');
  END IF;
  IF _p.status <> 'aguardando_cliente' THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Este projeto não está aguardando aprovação do cliente.');
  END IF;
  IF p_action = 'changes' AND length(_msg) < 5 THEN RETURN jsonb_build_object('ok', false, 'error', 'Descreva as alterações desejadas.'); END IF;

  SELECT company, contact_name INTO _c FROM public.clients WHERE id = _p.client_id;
  _label := coalesce(nullif(_c.contact_name,''), nullif(_c.company,''), 'Cliente');

  IF p_action = 'approve' THEN
    _new := 'aprovado';
    UPDATE public.projects SET status = _new, client_approved_at = now(), client_token = NULL WHERE id = _p.id;
    _title_admin := 'Cliente aprovou o site.'; _title_creator := 'Seu projeto foi aprovado pelo cliente.'; _title_owner := 'Seu cliente teve o site aprovado.';
    _body := coalesce(_c.company,'Cliente') || ' aprovou o projeto ' || _p.title || '.';
  ELSE
    _new := 'ajustes_solicitados';
    UPDATE public.projects SET status = _new WHERE id = _p.id;
    _title_admin := 'Cliente solicitou alterações.'; _title_creator := 'Cliente solicitou alterações no projeto.'; _title_owner := _title_creator;
    _body := coalesce(_c.company,'Cliente') || ' — ' || _p.title || ': ' || _msg;
  END IF;

  INSERT INTO public.project_approval_events (project_id, actor_label, event_type, message, previous_status, new_status)
  VALUES (_p.id, _label, CASE WHEN p_action='approve' THEN 'aprovado_cliente' ELSE 'ajustes_cliente' END,
          nullif(_msg,''), _p.status, _new);

  INSERT INTO public.notifications (user_id, title, body, category, project_id, link)
  SELECT DISTINCT r.user_id, _title_admin, _body, 'aprovacao', _p.id, '/aprovacoes'
  FROM public.user_roles r WHERE r.role IN ('admin','diretor');
  IF _p.creator_id IS NOT NULL THEN
    INSERT INTO public.notifications (user_id, title, body, category, project_id, link)
    VALUES (_p.creator_id, _title_creator, _body, 'aprovacao', _p.id, '/meus-projetos');
  END IF;
  INSERT INTO public.notifications (user_id, title, body, category, project_id, link)
  VALUES (_p.owner_id, _title_owner, _body, 'aprovacao', _p.id, '/projetos');

  RETURN jsonb_build_object('ok', true);
END $$;

-- Liberação ao cliente (somente admin/diretor). Token gerado no banco.
CREATE OR REPLACE FUNCTION public.sn_release_to_client(p_project_id uuid, p_whatsapp_message text DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _uid uuid := auth.uid(); _p record; _c record; _token text;
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

  INSERT INTO public.project_approval_events (project_id, actor_id, actor_label, event_type, message, previous_status, new_status)
  VALUES (_p.id, _uid, 'Administração', 'liberado_cliente',
          'Link seguro gerado para ' || coalesce(_c.company,'cliente') || '.', _p.status, 'aguardando_cliente');

  IF coalesce(_c.contact_phone,'') <> '' AND p_whatsapp_message IS NOT NULL THEN
    INSERT INTO public.whatsapp_messages (project_id, client_id, phone, message, notification_type, send_status)
    VALUES (_p.id, _c.id, _c.contact_phone, replace(left(p_whatsapp_message, 4000), '{{TOKEN}}', _token), 'aprovacao_site', 'preparado');
  END IF;
  IF _p.creator_id IS NOT NULL THEN
    INSERT INTO public.notifications (user_id, title, body, category, project_id, link)
    VALUES (_p.creator_id, 'Seu projeto foi liberado para o cliente.', _p.title, 'aprovacao', _p.id, '/meus-projetos');
  END IF;
  INSERT INTO public.notifications (user_id, title, body, category, project_id, link)
  VALUES (_p.owner_id, 'Site enviado para aprovação do cliente.', coalesce(_c.company,'Cliente') || ' — ' || _p.title, 'aprovacao', _p.id, '/projetos');

  RETURN jsonb_build_object('token', _token, 'clientName', coalesce(nullif(_c.contact_name,''), _c.company, 'cliente'),
    'company', coalesce(_c.company,'sua empresa'), 'clientEmail', _c.contact_email);
END $$;

-- Privilégios mínimos
REVOKE ALL ON FUNCTION public.sn_register_client(text,text,text,text,text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.sn_delete_client(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.sn_get_referral_token() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.sn_referral_leads() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.sn_referral_metrics() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.sn_admin_referral_stats() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.sn_release_to_client(uuid,text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.sn_submit_public_lead(text,text,text,text,text,text,text,uuid,text,jsonb) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.sn_approval_view(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.sn_client_approval_action(text,text,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.sn_register_client(text,text,text,text,text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.sn_delete_client(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.sn_get_referral_token() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.sn_referral_leads() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.sn_referral_metrics() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.sn_admin_referral_stats() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.sn_release_to_client(uuid,text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.sn_submit_public_lead(text,text,text,text,text,text,text,uuid,text,jsonb) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.sn_approval_view(text) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.sn_client_approval_action(text,text,text) TO anon, authenticated, service_role;