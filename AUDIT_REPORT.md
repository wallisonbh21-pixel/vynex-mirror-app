/**
 * Relatório de Auditoria Forense - ScaleNexus
 * Data: 2026-08-06
 */

### 1. Transactions (Financeiro)
- **Status Atual:** 
  - `transactions_admin_all` (service_role: ALL) - OK.
  - `transactions_read_own` (authenticated: SELECT) - OK.
  - `transactions_select_own` (authenticated: SELECT) - OK.
- **Vulnerabilidade:** Embora não existam policies explicitas de INSERT/UPDATE para `authenticated`, a ausência de uma negação explícita ou proteção contra manipulação via RPCs foi mitigada pela trigger `tr_protect_transactions`. No entanto, o scanner pode estar detectando a falta de grants restritivos.
- **Causa Real:** A trigger `tr_protect_transactions` bloqueia mutações exceto para `service_role`, mas as políticas RLS poderiam ser mais explícitas.

### 2. Withdrawals (Saques)
- **Status Atual:**
  - `withdrawals_insert_request` (authenticated: INSERT) - **CRÍTICO**. 
    - `WITH CHECK ((user_id = auth.uid()) AND (status = 'pending'::text) AND (paid_at IS NULL))`.
    - Permite ao usuário definir o `user_id` e o `status`. A trigger `tr_validate_withdrawal` corrige isso no servidor, mas a policy ainda "permite" a tentativa.
- **Vulnerabilidade:** Risco de self-approval se houver bypass da trigger ou se novas colunas administrativas forem adicionadas sem proteção na policy.

### 3. API de Prospecção (Bypass)
- **Status Atual:** O header `X-ScaleNexus-Audit` foi removido funcionalmente do código em `src/routes/api/prospecting/search.ts`.
- **Finding persistente:** Referências em logs de build anteriores ou metadados de scanner. Nenhuma referência funcional encontrada no código atual.

### 4. Stack Trace
- **Status Atual:** `src/routes/api/prospecting/search.ts` retorna `err.message` em um bloco `catch`.
- **Vulnerabilidade:** Exposição de detalhes internos da Geoapify ou erros de banco de dados.

### 5. URL XSS
- **Status Atual:** Pontos detectados em `leads.index.tsx`, `aprovacao.$token.tsx`, `MeetingRoomLayout.tsx`, e `projetos.$projectId.tsx`.
- **Vulnerabilidade:** Uso de `href={project.delivery_link}` sem sanitização.

### 6. Prospecting Opportunities
- **Status Atual:** Policy `prospecting_manage_own` usa `ALL` com `created_by = auth.uid()`.
- **Vulnerabilidade:** Permite `UPDATE` no campo `created_by`.

### 7. Meetings (Identidade)
- **Status Atual:** 
  - `meetings_update_security` permite update se `created_by = auth.uid()`.
  - `notes_update_identity` permite update se `author_id = auth.uid()`.
- **Vulnerabilidade:** Permite alterar o dono da reunião ou da nota após a criação.

### 8. SECURITY DEFINER
- **Status Atual:** 11 funções SD encontradas.
- **Crítico:** `set_client_token` e `get_project_public_data_by_token` têm `anon_execute: true`. Isso é necessário para o Portal de Aprovação, mas deve ser monitorado. `handle_new_user` está restrito (anon: false, authenticated: false).
