# Plano de Implementação: ATA#006 — FASE 2: CAPTURA SEGURA

Este plano detalha a implementação do funil de vendas público da ScaleNexus, garantindo a captura segura de leads e atribuição correta de indicações.

## Objetivo
Criar uma porta de entrada pública para novos projetos (/comece-seu-projeto) que identifique automaticamente indicações de vendedores, utilize o catálogo de serviços dinâmico e crie leads de forma segura através de Server Functions.

## 1. Banco de Dados e Segurança (RLS)
- **Migration**: Adicionar colunas necessárias e triggers de notificação.
- **Segurança**: Garantir que as tabelas `leads`, `lead_attribution` e `lead_activities` permaneçam protegidas por RLS, permitindo inserção apenas via Server Function (service_role).

## 2. Backend (Server Functions)
- **`src/lib/funnel.functions.ts`**:
  - `submitLeadForm`: Função segura para processar o formulário.
    - Validação de dados (Zod).
    - Normalização de e-mail e telefone.
    - Validação de `referral_token`.
    - Verificação de duplicidade (e-mail/telefone).
    - Criação de `lead` com status "NOVO — AGUARDANDO CONTATO".
    - Criação de `lead_attribution` se houver token válido.
    - Registro de atividade inicial.
    - Disparo de notificação (Trigger DB ou Server Logic).

## 3. Frontend (Rotas e Componentes)
- **Rotas**:
  - `src/routes/comece-seu-projeto/index.tsx`: Rota principal do funil.
  - `src/routes/comece-seu-projeto/ref.$token.tsx`: Rota com parâmetro de indicação (captura token e redireciona ou mantém estado).
- **Componentes**:
  - `src/components/funnel/FunnelLayout.tsx`: Layout minimalista e profissional (Apple-style).
  - `src/components/funnel/StepServiceSelection.tsx`: Escolha do serviço do `services_catalog`.
  - `src/components/funnel/StepContactForm.tsx`: Dados básicos (Nome, Whats, E-mail, etc).
  - `src/components/funnel/StepDynamicBriefing.tsx`: Perguntas baseadas no JSON do serviço escolhido.
  - `src/components/funnel/FunnelSuccess.tsx`: Tela de confirmação.

## 4. Integração do Catálogo
- O formulário buscará as opções e perguntas diretamente de `public.services_catalog`.
- As perguntas iniciais (Seção 5 da ATA) serão inseridas como padrão no catálogo se não estiverem lá.

## 5. Validação
- Build e Typecheck.
- Teste de fluxo completo:
  - Acesso direto vs Acesso via link de indicação.
  - Verificação de duplicidade de e-mail.
  - Verificação de criação de registro em `lead_attribution`.

## Detalhes Técnicos
- **Duplicidade**: Se o lead já existe, apenas uma atividade é registrada, evitando spam de registros duplicados no CRM.
- **Atribuição**: O backend validará o token UUID oculto vinculado ao `referral_token`.

---
**ATA#006 — PLANO DA FASE 2 PRONTO PARA IMPLEMENTAÇÃO.**
