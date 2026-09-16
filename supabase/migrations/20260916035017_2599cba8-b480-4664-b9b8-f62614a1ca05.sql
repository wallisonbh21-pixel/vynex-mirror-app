-- 1. Storage policies for private bucket project-documents
CREATE POLICY "Team manages project documents storage"
ON storage.objects FOR ALL TO authenticated
USING (
  bucket_id = 'project-documents' AND (
    public.has_role(auth.uid(),'admin'::public.app_role)
    OR public.has_role(auth.uid(),'vendedor'::public.app_role)
    OR public.has_role(auth.uid(),'criador'::public.app_role)
  )
)
WITH CHECK (
  bucket_id = 'project-documents' AND (
    public.has_role(auth.uid(),'admin'::public.app_role)
    OR public.has_role(auth.uid(),'vendedor'::public.app_role)
    OR public.has_role(auth.uid(),'criador'::public.app_role)
  )
);

CREATE POLICY "Clients read own project documents storage"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'project-documents'
  AND EXISTS (
    SELECT 1
    FROM public.project_documents d
    JOIN public.projects p ON p.id = d.project_id
    JOIN public.clients c ON c.id = p.client_id
    WHERE d.file_path = storage.objects.name
      AND c.user_id = auth.uid()
  )
);

-- 2. Block self-assignment of the "criador" role at signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _requested text;
  _role public.app_role;
BEGIN
  INSERT INTO public.profiles (id, full_name, phone)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name',''), NEW.raw_user_meta_data->>'phone')
  ON CONFLICT (id) DO NOTHING;

  _requested := COALESCE(NEW.raw_user_meta_data->>'role', 'vendedor');

  -- Privileged roles can never be self-assigned during signup.
  -- The only exception is the very first admin, when no admin exists yet.
  IF _requested = 'admin' AND NOT public.admin_exists() THEN
    _role := 'admin'::public.app_role;
  ELSE
    _role := 'vendedor'::public.app_role;
  END IF;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, _role)
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$;

-- 3. Fix privileged function without fixed search_path
ALTER FUNCTION public.handle_project_notifications() SET search_path = public;

-- 4. Referral tokens: least privilege
DROP POLICY IF EXISTS "Referral tokens are viewable by authenticated users" ON public.referral_tokens;
CREATE POLICY "Referral tokens viewable by owner or admin"
ON public.referral_tokens FOR SELECT TO authenticated
USING (seller_id = auth.uid() OR public.has_role(auth.uid(),'admin'::public.app_role));
REVOKE SELECT ON public.referral_tokens FROM anon;

-- 5. Remove duplicated public lead-capture policies (keep one per table)
DROP POLICY IF EXISTS "Public leads insert" ON public.leads;
DROP POLICY IF EXISTS "Public activities insert" ON public.lead_activities;
DROP POLICY IF EXISTS "Public attribution insert" ON public.lead_attribution;