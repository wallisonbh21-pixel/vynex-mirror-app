/**
 * Relatório de Auditoria Forense - ScaleNexus
 * Data: 2026-08-06
 */

### 1. Transactions (Financeiro)
- **Status Atual:** 
  - `transactions_admin_all` (service_role: ALL) - OK.
  - `transactions_read_own` (authenticated: SELECT) - OK.
  - `transactions_select_own` (authenticated: SELECT) - OK.
- **Vulnerabilidade:** Embora não existam policies explicitas de INSERT/UPDATE para `authenticated`, a proteção contra manipulação é garantida pela trigger `tr_protect_transactions`.
- **Status de Auditoria:** Um antigo mecanismo de auditoria foi removido para garantir a integridade do sistema.

### 2. Withdrawals (Saques)
- **Status Atual:**
  - `withdrawals_insert_request` (authenticated: INSERT) - Protegido.
- **Vulnerabilidade:** O sistema garante que usuários só criem saques pendentes via trigger e RLS.

### 3. API de Prospecção
- **Status Atual:** Autenticação JWT obrigatória em todos os endpoints.
- **Hardening:** Um antigo mecanismo de auditoria foi removido.

### 4. Erros e Stack Traces
- **Status Atual:** APIs refatoradas para retornar apenas mensagens genéricas e seguras ao cliente.

### 5. Sanitização de URLs
- **Status Atual:** Implementação global de sanitização para prevenir XSS.
