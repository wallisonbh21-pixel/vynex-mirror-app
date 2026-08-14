-- Relaxar restrições da tabela lead_attribution para permitir leads sem responsável imediato
ALTER TABLE public.lead_attribution 
ALTER COLUMN originator_id DROP NOT NULL,
ALTER COLUMN current_responsible_id DROP NOT NULL;

-- Comentário para registro
COMMENT ON COLUMN public.lead_attribution.originator_id IS 'ID do originador (vendedor ou admin). Pode ser NULL para acesso direto.';
COMMENT ON COLUMN public.lead_attribution.current_responsible_id IS 'Responsável atual. Pode ser NULL se for institucional ou aguardando atribuição.';
