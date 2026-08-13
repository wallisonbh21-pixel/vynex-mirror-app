# Planejamento do Novo Funil Comercial ScaleNexus

Este documento detalha o diagnóstico da arquitetura atual e o plano de implementação para o **Novo Funil Comercial (Fase 6)**, focado em prospecção sem autenticação inicial, rastreamento de indicações e briefings estruturados, incorporando as diretrizes de segurança e processos da ATA#006.

## A. REGRAS DE NEGÓCIO E FLUXO OPERACIONAL

### 1. Separação de Conversão e Acesso
O fluxo comercial é independente da infraestrutura de login. A falha no envio de convite ou criação de Auth não bloqueia o processo comercial.
- **Fluxo**: Lead → Negociação → Convertido → Criar/Atualizar Cliente → Criar Projeto.
- **Portal**: A ativação do acesso (Auth + Convite) é um passo posterior e manual/opcional.
- **Status de Acesso**: Clientes sem conta vinculada ficam com status "ACESSO PENDENTE".

### 2. Atribuição e Rastreamento
- **Originador vs Responsável**:
  - **Originador**: Vendedor que gerou a indicação original (imutável após criação).
  - **Responsável Atual**: Vendedor que atende o lead no momento (pode ser reatribuído).
- **Referral Tokens**: Validados exclusivamente no backend via Server Function. Cookies/localStorage servem apenas para UX (continuidade), não para autoridade de dados.
- **Indicação Institucional**: Links gerados pelo Admin sem vendedor vinculado (Originador = ScaleNexus/Admin).

### 3. Duplicidade e Segurança
- **Identificação Exata**: Comparação de E-mail e Telefone normalizados. Sem fusão automática por nome/empresa (apenas sinalização para revisão).
- **Proteção da API**: O formulário público não tem acesso direto às tabelas. Tudo passa por uma Server Function segura com Rate Limiting e auditoria.
- **Status Inicial**: Novos leads entram como "NOVO — AGUARDANDO CONTATO" com notificação automática para o responsável.

---

## B. O QUE JÁ EXISTE (Reutilizável)
- **Tabela `leads`**: Base para armazenamento de prospectos.
- **Tabela `lead_activities`**: Histórico de interações.
- **Tabela `project_briefings`**: Armazenamento JSON (a ser mantido para compatibilidade).
- **`src/lib/crm.ts`**: Hook `useConvertLead` (será refatorado para o novo fluxo).

---

## C. INFRAESTRUTURA A SER CRIADA

### 1. Banco de Dados
- **Tabela `referral_tokens`**: Vincula códigos públicos a usuários ou ao "Admin/Institucional".
- **Tabela `lead_attribution`**: Histórico auditável de atribuição (quem trouxe e quem atende).
- **Tabela `services_catalog`**: Centralização de inteligência de produto.
  - Campos: `base_price`, `recurring_fee`, `commission_rules` (vendedor/criador), `billing_cycle`, `conditional_questions` (JSON).

### 2. Backend (Server Functions)
- **`processPublicLead`**:
  - Valida `referral_token`.
  - Normaliza dados e verifica duplicidade.
  - Registra lead e atribuição inicial.
  - Dispara notificações.

---

## D. FASES DE IMPLEMENTAÇÃO RECOMENDADAS

### FASE 1: Fundação e Catálogo (Infra)
- Migrations para `referral_tokens`, `services_catalog` e `lead_attribution`.
- Scripts de geração de tokens para vendedores existentes.
- Cadastro inicial do catálogo de serviços (Landing Page, Institucional, Loja, etc).

### FASE 2: Captura Segura (API + Fluxo Público)
- Implementação da Server Function `processPublicLead`.
- Criação da rota pública `/comece-seu-projeto` com suporte a `ref/:token`.
- Lógica de normalização e detecção de duplicidade (E-mail/Telefone).

### FASE 3: Refatoração do Pipeline e Conversão
- Atualização do Pipeline Comercial para refletir o status "NOVO".
- Refatoração da `useConvertLead` para separar a criação do Cliente/Projeto da criação do Auth.
- Implementação do botão "Ativar Acesso ao Portal" no perfil do Cliente.

### FASE 4: Painel do Vendedor e Briefing Dinâmico
- Área de "Minhas Indicações" para vendedores.
- Integração das perguntas dinâmicas do `services_catalog` no formulário de briefing, mantendo compatibilidade com `project_briefings`.

---

**ATA#006 — PLANEJAMENTO ATUALIZADO — AGUARDANDO APROVAÇÃO PARA INICIAR FASE 1.**
