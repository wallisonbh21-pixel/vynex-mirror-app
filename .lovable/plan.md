# Plano de Implementação: ATA#006 — FASE 2: CAPTURA SEGURA

Este plano detalha a implementação do funil de vendas público da ScaleNexus, garantindo a captura segura de leads e atribuição correta de indicações, respeitando os ajustes solicitados.

## Objetivo
Criar uma porta de entrada pública para novos interessados (/comece-seu-projeto) que identifique indicações via token público seguro, utilize o catálogo de serviços dinâmico e crie apenas leads através de Server Functions.

## 1. Banco de Dados e Segurança
- **Segurança**: Manter RLS em `leads`, `lead_attribution` e `lead_activities`. A inserção pública de leads será mediada exclusivamente por uma Server Function com `service_role`.
- **Services Catalog**: A estrutura `briefing_questions` (JSONB) já existe e será mantida vazia nesta fase, conforme solicitado.

## 2. Backend (Server Functions)
- **`src/lib/funnel.functions.ts`**:
  - `submitLeadForm`: Função segura para processar o formulário.
    - Validação de dados (Zod).
    - Normalização de e-mail e telefone.
    - **Validação de Indicação**: Utilizará a coluna `token` (texto seguro) da tabela `referral_tokens` para identificar o vendedor, nunca o UUID interno.
    - **Verificação de Duplicidade**: Se e-mail ou telefone já existem, apenas registra uma atividade no lead existente ("Novo interesse recebido pelo formulário").
    - **Criação de Lead**: Cria o registro com status "NOVO — AGUARDANDO CONTATO".
    - **Restrição**: Não criará Cliente, Projeto, Usuário Auth ou acesso ao Portal.

## 3. Frontend (Rotas e Componentes)
- **Rotas**:
  - `src/routes/comece-seu-projeto/index.tsx`: Rota principal do funil.
  - `src/routes/comece-seu-projeto/ref.$token.tsx`: Rota de indicação que valida o token público e mantém a referência para o formulário.
- **Componentes**:
  - `src/components/funnel/FunnelLayout.tsx`: Design profissional e minimalista (ScaleNexus Style).
  - `src/components/funnel/FunnelForm.tsx`: Formulário multi-etapas:
    1. Escolha de Serviço (carregado de `services_catalog`).
    2. Dados Básicos (Nome, Empresa, WhatsApp, E-mail, Cidade/Estado, Segmento).
    3. Informações Complementares (Objetivo, Necessidades, Observações).
  - `src/components/funnel/FunnelSuccess.tsx`: Feedback de sucesso.

## 4. Validação e Testes
- **Build**: `bun run build:dev`.
- **Cenário A (Direto)**: Lead criado sem atribuição.
- **Cenário B (Indicação)**: Lead criado com `lead_attribution` vinculado ao vendedor do token público.
- **Cenário C (Duplicado)**: Apenas `lead_activity` registrada no lead original.

---
**ATA#006 — PLANO DA FASE 2 ATUALIZADO — INICIANDO IMPLEMENTAÇÃO.**

