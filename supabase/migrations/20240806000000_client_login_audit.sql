DO $$ BEGIN
    CREATE TYPE public.login_status AS ENUM ('pendente', 'ativo', 'bloqueado');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

ALTER TABLE public.user_roles ADD COLUMN IF NOT EXISTS status public.login_status DEFAULT 'pendente';
ALTER TABLE public.user_roles ADD COLUMN IF NOT EXISTS last_access TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.user_roles ADD COLUMN IF NOT EXISTS first_access_completed BOOLEAN DEFAULT false;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view their own roles and status') THEN
        CREATE POLICY "Users can view their own roles and status" 
        ON public.user_roles FOR SELECT 
        TO authenticated 
        USING (auth.uid() = user_id);
    END IF;
END $$;

GRANT SELECT, UPDATE ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;

CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    action TEXT NOT NULL,
    actor_id UUID REFERENCES auth.users(id),
    target_id UUID,
    details JSONB
);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON public.audit_logs TO authenticated;
GRANT ALL ON public.audit_logs TO service_role;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admins can view audit logs') THEN
        CREATE POLICY "Admins can view audit logs"
        ON public.audit_logs FOR SELECT
        TO authenticated
        USING (public.has_role(auth.uid(), 'admin'));
    END IF;
END $$;
