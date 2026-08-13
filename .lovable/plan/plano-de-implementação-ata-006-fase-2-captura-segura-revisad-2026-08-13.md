# Plano de Implementação: ATA#006 — FASE 2: CAPTURA SEGURA (Revisado)

Este plano detalha a implementação do funil de vendas público da ScaleNexus, focando exclusivamente na captura segura de leads e atribuição via tokens públicos.

## Objetivo
Criar uma porta de entrada pública (/comece-seu-projeto) para novos interessados, identificando indicações via tokens públicos seguros e criando apenas leads no CRM.

## 1. Banco de Dados e Segurança
- **Segurança**: RLS mantido em `leads`, `lead_attribution` e `lead_activities`. Inserção via Server Function com `service_role`.
- **Services Catalog**: Mantida a estrutura `briefing_questions` (JSONB) existente. **Não serão inseridas perguntas definitivas nesta fase**; a estrutura estará pronta para configurações posteriores.

## 2. Backend (Server Functions)
- **`src/lib/funnel.functions.ts`**:
  - `submitLeadForm`: Função segura (service_role) para processamento.
    - Validação de dados (Zod) e normalização (e-mail/telefone).
    - **Validação de Indicação**: Utilizará exclusivamente o **token público seguro** (texto) da tabela `referral_tokens`. O UUID interno nunca será exposto ou utilizado como identificador público.
    - **Verificação de Duplicidade**: Se o lead já existir (e-mail/telefone), registra apenas uma `lead_activity` ("Novo interesse recebido pelo formulário") sem duplicar o registro principal.
    - **Escopo Estrito**: Cria apenas o registro de `lead` com status "NOVO — AGUARDANDO CONTATO".
    - **Proibições**: Não cria Cliente, Projeto, Usuário Auth, Acesso ao Portal, Cobrança ou Comissão.

## 3. Frontend (Rotas e Componentes)
- **Rotas**:
  - `src/routes/comece-seu-projeto/index.tsx`: Fluxo principal.
  - `src/routes/comece-seu-projeto/ref.$token.tsx`: Captura do token público e redirecionamento seguro.
- **Componentes**:
  - `src/components/funnel/FunnelLayout.tsx`: UI minimalista e profissional (Apple-style).
  - `src/components/funnel/FunnelForm.tsx`: 
    1. Seleção de Serviço (dinâmico via `services_catalog`).
    2. Dados do Interessado (Nome, Empresa, WhatsApp, E-mail, Cidade/Estado, Segmento).
    3. Contexto do Projeto (Objetivo, Necessidades, Observações).

## 4. Validação
- **Cenário de Indicação**: Validar que o `lead_attribution` aponta para o vendedor correto através do token de texto, sem vazar IDs internos.
- **Cenário de Duplicidade**: Confirmar que múltiplos envios do mesmo e-mail geram apenas atividades cronológicas no lead original.
- **Isolamento**: Garantir que nenhum dado de precificação ou comissão seja exposto no frontend público.

---
**ATA#006 — PLANO DA FASE 2 ATUALIZADO — AGUARDANDO APROVAÇÃO PARA INICIAR.**


