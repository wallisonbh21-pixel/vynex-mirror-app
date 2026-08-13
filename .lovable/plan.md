# Planejamento do Novo Funil Comercial ScaleNexus

Este documento detalha o diagnóstico da arquitetura atual e o plano de implementação para o **Novo Funil Comercial (Fase 6)**, focado em prospecção sem autenticação inicial, rastreamento de indicações e briefings estruturados.

## A. O QUE JÁ EXISTE (Reutilizável)

### 1. Banco de Dados
- **Tabela `leads`**: Estrutura robusta para armazenamento de prospectos (nome, empresa, contato, nicho, origem, status).
- **Tabela `lead_activities`**: Histórico completo de interações.
- **Tabela `project_briefings`**: Estrutura JSON flexível que pode ser estendida para o novo formulário.
- **Tabela `proposals` & `contracts`**: Base para a conversão financeira.
- **Tabela `profiles`**: Contém `commission_rate` para vendedores e criadores.
- **Tabela `user_roles`**: Suporte para papéis `admin`, `vendedor`, `criador` e `cliente`.

### 2. Lógica e UI
- **`src/lib/crm.ts`**: Hook `useConvertLead` que já realiza a ponte Lead -> Cliente -> Projeto.
- **`src/lib/prospecting.ts`**: Motor de busca e validação de duplicidade básico.
- **`src/lib/briefing.ts`**: Lógica de salvamento e recuperação de dados JSON.
- **`RecordDialog.tsx`**: Componente de formulário dinâmico baseado em schemas.
- **`SalesProgression.tsx`**: Visualizador de etapas do funil.

---

## B. O QUE PRECISA SER CRIADO

### 1. Infraestrutura de Rastreamento
- **Nova Tabela `referral_tokens`**:
  - `user_id`: UUID do Vendedor/Admin.
  - `token`: Código público seguro (slug alfanumérico).
  - `type`: 'vendedor' ou 'institucional'.
- **Logs de Atribuição**: Tabela `lead_attribution` para histórico de mudanças de responsável.

### 2. Catálogo de Serviços e Preços
- **Nova Tabela `services_catalog`**:
  - `id`, `name`, `type` (site, trafego, etc).
  - `base_price`, `recurring_fee`.
  - `config`: JSON com perguntas específicas do briefing para este serviço.

---

## C. ARQUITETURA DE INDICAÇÃO

1. **Link Exclusivo**: Utilizaremos um `token` gerado aleatoriamente (ex: `nexus-7j2k`) vinculado ao perfil do vendedor.
2. **URL Pública**: `/comece-seu-projeto/ref/:token`.
3. **Persistência**: O token será armazenado em `localStorage/Cookie` no navegador do prospect para garantir a atribuição mesmo se ele fechar a aba e voltar depois.
4. **Painel do Vendedor**: Nova rota `/_authenticated/vendedor/indicacoes` com contadores reais extraídos de `leads` filtrados por `owner_id` e `source` específico.

---

## D. FORMULÁRIO "COMECE SEU PROJETO"

1. **Público**: Rota `/comece-seu-projeto` (sem `requireAuth`).
2. **Server Function Segura**: O formulário enviará os dados para uma `createServerFn` que:
   - Valida o `referral_token`.
   - Verifica duplicidade (Email/WhatsApp).
   - Insere na tabela `leads` com `status: "novo"`.
   - Notifica o Vendedor via `notifications`.
3. **Perguntas Condicionais**: O formulário será montado dinamicamente a partir do `services_catalog`.

---

## E. CRM E CONVERSÃO

- **Fluxo**: Lead entra no Pipeline -> Vendedor negocia -> Move para "Fechado" -> Aciona Modal de Conversão.
- **Mudança Crítica**: A criação do usuário Auth (Supabase) só ocorrerá no momento da execução da `useConvertLead`, disparando o e-mail de boas-vindas.

---

## F. SEGURANÇA E DUPLICIDADE

- **Spam**: Implementação de Rate Limiting na Server Function e possivelmente CAPTCHA.
- **Duplicidade**: O sistema fará um "fuzzy match" (e-mail exato ou telefone exato). Se encontrar, em vez de criar novo, adiciona uma `lead_activity` no lead existente: "Nova tentativa de contato via formulário público".
- **RLS**: As tabelas de Briefing continuarão protegidas, mas a Server Function usará `supabaseAdmin` para realizar o "ponteio" inicial seguro.

---

## G. FASES DE IMPLEMENTAÇÃO

### FASE 1: Fundação e Rastreamento (Infra)
- Criar `referral_tokens`.
- Criar catálogo de serviços básico.
- Gerar links exclusivos para vendedores existentes.

### FASE 2: Captura Pública (Frontend + API)
- Rota pública `/comece-seu-projeto`.
- Server Function de processamento de Leads.
- Validação de duplicidade.

### FASE 3: Painel Comercial 2.0
- Nova área "Indicações" para Vendedores.
- Relatórios de conversão por vendedor para o Admin.

### FASE 4: Integração de Serviços (Briefing Dinâmico)
- Migrar briefing atual para o novo formato baseado no catálogo.
- Tela final de "Resumo do Projeto" (Pós-briefing).

---

**ATA#006 — PLANEJAMENTO DO NOVO FUNIL COMERCIAL CONCLUÍDO — AGUARDANDO APROVAÇÃO PARA IMPLEMENTAÇÃO.**
