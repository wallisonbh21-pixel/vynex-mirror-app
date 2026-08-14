# Plano de Correção: Robusteza do Funil Comercial

## Objetivo
Corrigir a falha de processamento no formulário público, garantindo que o envio de leads seja resiliente a falhas de atribuição, tokens inválidos e instabilidades de rede.

## Alterações Técnicas

### Backend (Server Functions)
- **Refatorar `submitLeadForm` em `src/lib/funnel.functions.ts`**:
    - Adicionar bloco `try/catch` global com retorno de erro estruturado.
    - Implementar fallback garantido para `originatorId`: se nenhum admin for encontrado, usar um UUID de sistema fixo (`00000000-0000-0000-0000-000000000000`).
    - Resolver o nome do serviço nominalmente antes de salvar nas `notes`, evitando perda de contexto se o UUID do serviço mudar ou for removido.
    - Validar o `referralToken` com maior rigor, tratando tokens expirados ou inexistentes sem interromper o fluxo principal.

### Frontend (Interface)
- **Aprimorar `FunnelForm.tsx`**:
    - Adicionar validação preventiva do `serviceId` e campos obrigatórios antes do envio final.
    - Melhorar o tratamento de erros no `handleSubmit` para exibir mensagens específicas retornadas pelo servidor.
    - Garantir que o estado de carregamento (`loading`) bloqueie múltiplos cliques.

## Validação
- Teste de regressão com Playwright para:
    - Envio sem indicação (atribuição ao sistema).
    - Envio com indicação (atribuição ao vendedor).
    - Simulação de erro de banco para verificar resposta amigável ao usuário.
