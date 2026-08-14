# Plano de Correção: Robusteza do Funil Comercial

## Objetivo
Corrigir a falha de processamento no formulário público, garantindo que o envio de leads seja resiliente a falhas de atribuição, tokens inválidos e instabilidades de rede.

## Alterações Técnicas

### Backend (Server Functions)
- **Refatorar `submitLeadForm` em `src/lib/funnel.functions.ts`**:
    - Adicionar bloco `try/catch` global com retorno de erro estruturado.
    - **Remover completamente UUIDs de sistema fixos** (0000...).
    - **Lógica de Atribuição**:
        - **Token Vendedor**: `originator_id` e `current_responsible_id` definidos como o vendedor do token.
        - **Token Institucional**: `originator_id` compatível com estrutura institucional, `current_responsible_id = NULL`.
        - **Sem Token (Direto)**: Origem "ScaleNexus / Direto", `current_responsible_id = NULL`.
        - **Token Inválido**: Retornar erro amigável, sem fallback silencioso para UUIDs fictícios.
    - **Validação de Serviço**: Verificar se o `serviceId` existe e está ativo antes da criação do Lead. Salvar `service_id` e `service_name` no histórico/notes para preservação nominal.


### Frontend (Interface)
- **Aprimorar `FunnelForm.tsx`**:
    - Adicionar validação preventiva do `serviceId` e campos obrigatórios antes do envio final.
    - Melhorar o tratamento de erros no `handleSubmit` para exibir mensagens específicas retornadas pelo servidor.
    - Garantir que o estado de carregamento (`loading`) bloqueie múltiplos cliques.

## Validação
- Teste de regressão com Playwright para os cenários:
    - **A) Link de vendedor válido**: Originador e Responsável = vendedor.
    - **B) Link institucional**: Origem Institucional, Responsável vazio (NULL).
    - **C) Acesso direto (sem token)**: Origem Direta, Responsável vazio (NULL).
    - **D) Token inválido**: Mensagem amigável ao usuário, sem crash, sem UUID fictício.
    - **E) Serviço inválido/desativado**: Mensagem amigável, impede criação de lead incorreto.
    - **F) Serviço válido**: Persistência correta de `service_id` + `service_name`.

