INSERT INTO public.site_template_settings (template_id, status, featured, display_order, available_for_creators, available_for_clients)
VALUES ('tpl-educacao-inclusiva', 'ativo', false, 4, true, false)
ON CONFLICT (template_id) DO NOTHING;