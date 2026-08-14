-- Relaxar a restrição de owner_id na tabela leads para permitir leads sem dono inicial
ALTER TABLE public.leads 
ALTER COLUMN owner_id DROP NOT NULL;

-- Comentário para registro
COMMENT ON COLUMN public.leads.owner_id IS 'ID do dono do lead. Pode ser NULL para leads novos vindos do site público aguardando atribuição.';
