# Plano de Implementação — ATA#006 — FASE 3: PIPELINE E CONVERSÃO

Integração dos leads do funil ao CRM e refatoração da conversão comercial para um modelo desacoplado de autenticação.

## 1. CRM & Pipeline (Novos Leads)
- **Visualização**: Atualizar `LeadFunnelCard.tsx` e `pipeline.tsx` para exibir dados da `lead_attribution` (Originador/Responsável).
- **Status Inicial**: Garantir que o status "novo" seja tratado como "NOVO — AGUARDANDO CONTATO".
- **Filtros**: Refinar `useRows('leads')` para respeitar as permissões de vendedor (ver apenas seus leads ou institucionais atribuídos).
- **Atribuição**: Garantir que a `lead_attribution` mantenha o `originator_id` imutável e o `current_responsible_id` atualizável apenas por autorizados (Admin), gerando log em `lead_activities`.

## 2. Refatoração da Conversão (Lead → Cliente)
- **useConvertLead (src/lib/crm.ts)**:
    - Remover dependência de criação de usuário Auth. Acesso ao Portal fica "PENDENTE".
    - Implementar verificação de duplicidade de cliente por e-mail/telefone normalizado. Não fundir automaticamente; preservar dados existentes.
    - Criar `client` e `project` mantendo o `lead_id` para rastreabilidade total.
    - Transferir dados de `lead_attribution` para o novo cliente (preservando Originador e Responsável Atual).
    - Registrar atividade de conversão.
    - Garantir que falhas em e-mail/Resend/Auth não revertam a criação do Cliente/Projeto.

## 3. Gestão de Acesso (Pós-Conversão)
- **Status Visual**: Em `admin.clientes.tsx` e `clientes.tsx`, exibir status "Acesso ao Portal" como Pendente (sem `user_id`) ou Ativo (com `user_id`).
- **Ativação Independente**: O botão "Ativar Acesso" deve chamar a função de onboarding existente sem afetar o registro comercial já criado.

## 4. Segurança e Integridade
- **Triggers/RLS**: Garantir que o `originator_id` seja imutável para não-admins.
- **Histórico**: Registrar todas as reatribuições em `lead_activities`.

## Detalhes Técnicos
- **Tabelas**: `leads`, `lead_attribution`, `clients`, `projects`, `lead_activities`.
- **Arquivos-chave**: `src/lib/crm.ts`, `src/routes/_authenticated/pipeline.tsx`, `src/components/SalesFunnel.tsx`, `src/routes/_authenticated/leads.$leadId.tsx`.
