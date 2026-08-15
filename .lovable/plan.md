# Plano de Correção: Persistência do Referral Token no Funil

O diagnóstico confirmou que o `referralToken` está sendo perdido durante a navegação do funil, resultando em Leads atribuídos incorretamente ao Admin. Implementaremos uma solução robusta de persistência e validação.

## O que vamos mudar

### 1. Backend (Segurança e Atribuição)
- Refatorar `submitLeadForm` em `src/lib/funnel.functions.ts` para garantir que o `originatorId` seja extraído corretamente do token.
- Garantir que `owner_id` e `current_responsible_id` sejam definidos como o vendedor dono do token, sem fallbacks artificiais.

### 2. Frontend (Persistência e UX)
- **Captura e Validação:** A rota `/comece-seu-projeto/ref/$token` validará o token antes de armazená-lo.
- **Persistência Híbrida:** Utilizaremos `localStorage` para persistência entre sessões/refresh, mas o estado do componente `FunnelForm` será a fonte primária durante o preenchimento.
- **Proteção contra Overwrite:** Implementar lógica para evitar que um acesso direto limpe um token válido já armazenado, mas permitir a substituição se um novo link de indicação for acessado.

### 3. Fluxo de Navegação
- Garantir que o token seja injetado no payload final do `submitLeadForm` independentemente de refresh ou troca de etapas.
- Limpeza do token apenas após o sucesso confirmado do envio.

## Detalhes técnicos

- **Arquivos afetados:**
    - `src/lib/funnel.functions.ts`: Lógica de atribuição e validação de token.
    - `src/components/funnel/FunnelForm.tsx`: Gerenciamento do estado do token durante o fluxo.
    - `src/routes/comece-seu-projeto/ref.$token.tsx`: Captura e redirecionamento inicial.

- **Diferenciação de Origem:**
    - Se `referralToken` presente e válido -> Origem "Indicação", Responsável = Vendedor.
    - Se `referralToken` ausente -> Origem "Direto" ou "Institucional", Responsável = NULL.

## Validação

1.  Simulação de acesso via link `/ref/c43f90bc8934`.
2.  Navegação completa pelas 3 etapas com refresh na etapa de contato.
3.  Submissão do formulário.
4.  Verificação no banco de dados:
    - `leads.owner_id` deve ser o UUID do vendedor.
    - `lead_attribution.originator_id` deve ser o UUID do vendedor.
    - `lead_attribution.referral_token_id` deve estar preenchido.

ATA#006 — PLANO DE CORREÇÃO DO REFERRAL TOKEN — AGUARDANDO APROVAÇÃO.
