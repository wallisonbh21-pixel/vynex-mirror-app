# Plano de Correção: Persistência do Referral Token no Funil

O diagnóstico confirmou que o `referralToken` está sendo perdido durante a navegação do funil, resultando em Leads atribuídos incorretamente ao Admin. Implementaremos uma solução robusta de persistência e validação.

## O que vamos mudar

### 1. Backend (Segurança e Atribuição)
- Refatorar `submitLeadForm` em `src/lib/funnel.functions.ts` para garantir que o `originatorId` seja extraído e validado novamente no servidor.
- Garantir que `owner_id` e `current_responsible_id` sejam definidos como o vendedor dono do token.
- **Validação Estrita:** Se o token for institucional, `current_responsible_id` deve ser `NULL` e a origem deve ser "Institucional". Se não houver token, origem deve ser "Direto".

### 2. Frontend (Persistência da Jornada Atual)
- **Captura e Validação:** A rota `/comece-seu-projeto/ref/$token` validará o token e iniciará uma "Sessão de Indicação".
- **Isolamento de Jornada:** O token será armazenado com um marcador de tempo ou flag de "jornada ativa".
- **Acesso Direto Limpa Token Antigo:** Se o usuário entrar diretamente em `/comece-seu-projeto` (sem vir de um redirect `/ref/$token`), qualquer token de indicação antigo no `localStorage` será **limpo** imediatamente para garantir a origem "Direto".
- **Persistência Temporária:** O token persistirá apenas para permitir refresh e navegação entre etapas da jornada atual.
- **Limpeza Pós-Sucesso:** O token será removido do `localStorage` assim que o formulário for enviado com sucesso.

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

## Validação e Casos de Teste

1.  **TESTE A (Fluxo Feliz):** Acesso via `/ref/c43f90bc8934` -> Refresh -> Envio -> Originador/Responsável = Vendedor A.
2.  **TESTE B (Proteção de Acesso Direto):** Acesso via `/ref/A` -> Fecha aba -> Acesso direto `/comece-seu-projeto` -> Envio -> Origem = "Direto", Responsável = NULL.
3.  **TESTE C (Substituição de Token):** Acesso via `/ref/A` -> Sem fechar, acesso via `/ref/B` -> Envio -> Lead atribuído a B.
4.  **TESTE D (Institucional):** Acesso via link institucional -> Origem = "Institucional", Responsável = NULL, `referral_token_id` preservado.

ATA#006 — PLANO DE CORREÇÃO DO REFERRAL TOKEN AJUSTADO — AGUARDANDO APROVAÇÃO.
