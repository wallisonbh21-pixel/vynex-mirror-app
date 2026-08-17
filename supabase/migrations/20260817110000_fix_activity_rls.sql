-- 1. Melhorar política de visualização de atividades
-- Permitir que o vendedor veja atividades de leads que ele é dono
DROP POLICY IF EXISTS "lead activities own or admin" ON public.lead_activities;
CREATE POLICY "lead_activities_view_policy" ON public.lead_activities 
FOR SELECT TO authenticated 
USING (
  user_id = auth.uid() 
  OR has_role(auth.uid(), 'admin') 
  OR EXISTS (
    SELECT 1 FROM public.leads 
    WHERE id = lead_activities.lead_id 
    AND (owner_id = auth.uid())
  )
);

-- Garantir GRANTs
GRANT SELECT ON public.lead_activities TO authenticated;
