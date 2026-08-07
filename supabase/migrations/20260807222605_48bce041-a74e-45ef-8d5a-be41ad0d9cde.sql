-- Triggers for automatic notifications in the Client Portal

-- Function to handle project notifications
CREATE OR REPLACE FUNCTION public.handle_project_notifications()
RETURNS TRIGGER AS $$
DECLARE
    v_user_id UUID;
    v_project_title TEXT;
BEGIN
    -- Get project title
    SELECT title INTO v_project_title FROM public.projects WHERE id = COALESCE(NEW.project_id, NEW.id);

    -- 1. Notifications for NEW MESSAGES
    IF TG_TABLE_NAME = 'project_messages' AND TG_OP = 'INSERT' THEN
        -- Notify Team (Owner)
        SELECT owner_id INTO v_user_id FROM public.projects WHERE id = NEW.project_id;
        IF v_user_id IS NOT NULL AND v_user_id != NEW.sender_id THEN
            INSERT INTO public.notifications (user_id, title, body, category, project_id, link)
            VALUES (v_user_id, 'Nova Mensagem', 'Você recebeu uma nova mensagem no projeto: ' || v_project_title, 'message', NEW.project_id, '/projetos/' || NEW.project_id);
        END IF;

        -- Notify Client
        SELECT user_id INTO v_user_id FROM public.clients WHERE id = (SELECT client_id FROM public.projects WHERE id = NEW.project_id);
        IF v_user_id IS NOT NULL AND v_user_id != NEW.sender_id THEN
            INSERT INTO public.notifications (user_id, title, body, category, project_id, link)
            VALUES (v_user_id, 'Nova Mensagem', 'Você recebeu uma nova mensagem no projeto: ' || v_project_title, 'message', NEW.project_id, '/cliente/mensagens');
        END IF;
    END IF;

    -- 2. Notifications for NEW DOCUMENTS
    IF TG_TABLE_NAME = 'project_documents' AND TG_OP = 'INSERT' THEN
        -- Notify Client about new document
        SELECT user_id INTO v_user_id FROM public.clients WHERE id = (SELECT client_id FROM public.projects WHERE id = NEW.project_id);
        IF v_user_id IS NOT NULL THEN
            INSERT INTO public.notifications (user_id, title, body, category, project_id, link)
            VALUES (v_user_id, 'Novo Documento', 'Um novo documento foi compartilhado no projeto: ' || v_project_title, 'document', NEW.project_id, '/cliente/documentos');
        END IF;
    END IF;

    -- 3. Notifications for APPROVAL EVENTS
    IF TG_TABLE_NAME = 'project_approval_events' AND TG_OP = 'INSERT' THEN
        -- Notify Team about Approval/Feedback
        SELECT owner_id INTO v_user_id FROM public.projects WHERE id = NEW.project_id;
        IF v_user_id IS NOT NULL THEN
            IF NEW.event_type = 'APPROVAL' THEN
                INSERT INTO public.notifications (user_id, title, body, category, project_id, link)
                VALUES (v_user_id, 'Projeto Aprovado! 🎉', 'O cliente aprovou o projeto: ' || v_project_title, 'approval', NEW.project_id, '/projetos/' || NEW.project_id);
            ELSIF NEW.event_type = 'FEEDBACK' THEN
                INSERT INTO public.notifications (user_id, title, body, category, project_id, link)
                VALUES (v_user_id, 'Solicitação de Ajustes', 'O cliente solicitou ajustes no projeto: ' || v_project_title, 'feedback', NEW.project_id, '/projetos/' || NEW.project_id);
            END IF;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create Triggers
DROP TRIGGER IF EXISTS tr_notify_project_messages ON public.project_messages;
CREATE TRIGGER tr_notify_project_messages
AFTER INSERT ON public.project_messages
FOR EACH ROW EXECUTE FUNCTION public.handle_project_notifications();

DROP TRIGGER IF EXISTS tr_notify_project_documents ON public.project_documents;
CREATE TRIGGER tr_notify_project_documents
AFTER INSERT ON public.project_documents
FOR EACH ROW EXECUTE FUNCTION public.handle_project_notifications();

DROP TRIGGER IF EXISTS tr_notify_project_approvals ON public.project_approval_events;
CREATE TRIGGER tr_notify_project_approvals
AFTER INSERT ON public.project_approval_events
FOR EACH ROW EXECUTE FUNCTION public.handle_project_notifications();
