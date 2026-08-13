# Plano de Ajuste: Etapa de Seleção de Serviço do Funil

O objetivo é corrigir a renderização da etapa de seleção de serviços no funil público da ScaleNexus, garantindo que as opções do catálogo sejam exibidas corretamente, que o título esteja alinhado com o solicitado, e que um novo campo de texto para briefing detalhado seja incluído e persistido.

## Ações a realizar

1. **Catálogo de Serviços**:
   - Garantir que a query de `services_catalog` traga as opções solicitadas.
   - Nota: Como não posso alterar o banco de dados diretamente via SQL neste momento sem permissão explícita para migração de dados, assumo que os dados corretos devem estar lá ou serão injetados. Vou focar na interface que consome esses dados.

2. **Frontend (`src/components/funnel/FunnelForm.tsx`)**:
   - Atualizar o título da primeira etapa para "Qual solução sua empresa precisa?".
   - Implementar a renderização visual das opções de serviço como botões de seleção (cards).
   - Adicionar o campo de texto "Conte mais sobre o que você precisa" com o placeholder solicitado.
   - Garantir que o campo de texto seja mapeado para `formData.details.needs` (que já existe no schema do lead).
   - Impedir o avanço para a próxima etapa se nenhum serviço for selecionado.

3. **Validação e Persistência (`src/lib/funnel.functions.ts`)**:
   - Garantir que o campo `needs` dentro do objeto `details` seja corretamente recebido e processado na criação do Lead/Atividade.

## Detalhes Técnicos

- **Componente**: `FunnelForm.tsx`
- **Função de Servidor**: `submitLeadForm` em `funnel.functions.ts`
- **Estado**: O campo de texto será vinculado a `formData.details.needs`.
- **UI**: Uso de Tailwind CSS para manter o padrão Dark premium da ScaleNexus.

Não serão alterados: CRM, lógica de indicação (referral), banco de dados (schema) ou integrações externas.
