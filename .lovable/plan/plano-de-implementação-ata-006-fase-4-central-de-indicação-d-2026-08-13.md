# Plano de Implementação - ATA#006 - FASE 4: CENTRAL DE INDICAÇÃO DE CLIENTES

Implementação da área logada para Vendedores e Admin gerenciarem links de indicação, visualizarem métricas reais e acompanharem o status das indicações integradas ao CRM.

## 1. Infraestrutura e Rotas
- Criar a rota protegida `src/routes/_authenticated/indicar.tsx` (Central de Indicação).
- Atualizar `src/components/AppShell.tsx` para incluir "INDICAÇÃO DE CLIENTES" nos menus `NAV_VENDEDOR` e `NAV_ADMIN`.
- Restringir acesso via `requireVendedor` ou logicamente via roles dentro da página.

## 2. Lógica de Dados (Server Functions / Hooks)
- Criar `src/lib/referral.functions.ts` para:
  - `getReferralToken`: Busca o token do usuário. Para Admin, prioriza o token com `is_institutional = true`.
  - `getReferralMetrics`: Agrega contagens de leads por status reais (`novo`, `negociacao`, `fechado`) filtrado pelo `originator_id`.
  - `getReferralLeads`: Lista leads originados pelo usuário com `current_responsible_id` e status, omitindo dados privados do responsável.

## 3. Componentes da Interface
- **Dashboard de Indicação**:
  - Bloco de Link: Exibição da URL completa: `https://[host]/comece-seu-projeto/ref/[TOKEN]` (via `window.location.origin`).
  - Ações: Botão Copiar (com feedback), Compartilhar WhatsApp (mensagem template amigável) e Modal QR Code.
- **Cards de Métricas**:
  - Total de Indicações, Novos (`novo`), Em Negociação (`negociacao`, `proposta`), Convertidos (`fechado`) e % de Conversão.
- **Tabela/Cards de Leads**:
  - Listagem com `STATUS_LABEL` reais do CRM. Link "Abrir no CRM" para detalhes.
- **Visão Admin**:
  - Seção "Visão Geral" e "Desempenho por Vendedor".
  - Link Institucional destacado.

## 4. Segurança e Privacidade
- Validar RLS: Vendedores acessam apenas leads onde `originator_id = auth.uid()`.
- Privacidade: Responsável Atual exibe apenas `full_name` ou `nickname`, nunca UUID ou e-mail/telefone privado.
- Admin visualiza todos os tokens e métricas globais.

## 5. Auditoria de Status (Confirmado)
- Reutilizar status de `src/lib/format.ts`: `novo`, `contatado`, `interessado`, `proposta`, `negociacao`, `fechado`, `perdido`.
- **Mapeamento Amigável**:
  - `novo` -> "Novo"
  - `contatado` -> "Aguardando Contato"
  - `negociacao`, `proposta`, `interessado` -> "Em Negociação"
  - `fechado` -> "Convertido"
  - `perdido` -> "Perdido"

## Validação
- Build: `bun run build:dev`.
- Testes: Cópia de link, geração de lead via link (Originador imutável) e visualização mobile.
