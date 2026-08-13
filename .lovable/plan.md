# Plano de Implementação - ATA#006 - FASE 4: CENTRAL DE INDICAÇÃO DE CLIENTES

Implementação da área logada para Vendedores e Admin gerenciarem links de indicação, visualizarem métricas reais e acompanharem o status das indicações integradas ao CRM.

## 1. Infraestrutura e Rotas
- Criar a rota protegida `src/routes/_authenticated/indicar.tsx` (Central de Indicação).
- Atualizar `src/components/AppShell.tsx` para incluir "INDICAÇÃO DE CLIENTES" nos menus `NAV_VENDEDOR` e `NAV_ADMIN` (a ser verificado).
- Restringir acesso via `requireVendedor` ou logicamente via roles dentro da página.

## 2. Lógica de Dados (Server Functions / Hooks)
- Criar `src/lib/referral.functions.ts` para:
  - `getMyReferralToken`: Busca o token do vendedor logado ou institucional (se admin).
  - `getReferralMetrics`: Agrega contagens de leads por status (Novo, Em Negociação, Convertido) filtrado pelo `originator_id`.
  - `getReferralLeads`: Lista leads originados pelo usuário com `current_responsible_id` e status.
- Criar `src/lib/admin-referral.functions.ts` para visão global do Admin.

## 3. Componentes da Interface
- **Dashboard de Indicação**:
  - Bloco de Link: Exibição do link `/comece-seu-projeto/ref/[TOKEN]`.
  - Ações: Botão Copiar (com feedback), Compartilhar WhatsApp (mensagem template) e Modal QR Code.
- **Cards de Métricas**:
  - Total, Novos, Em Negociação, Convertidos e % de Conversão.
- **Tabela/Cards de Leads**:
  - Listagem com status amigáveis e link "Abrir no CRM" para detalhes.
- **Visão Admin**:
  - Seção "Visão Geral" e "Desempenho por Vendedor".
  - Link Institucional fixo.

## 4. Segurança e Privacidade
- Validar RLS nas tabelas `referral_tokens`, `lead_attribution` e `leads`.
- Garantir que vendedor só veja o que originou (`originator_id = auth.uid()`).
- Admin visualiza tudo.

## Detalhes Técnicos
- **QR Code**: Utilizar biblioteca `qrcode.react`.
- **WhatsApp**: `https://wa.me/?text=...`.
- **Status Mapping**:
  - `novo` -> "Novo"
  - `contato` -> "Aguardando Contato"
  - `em_contato` -> "Em Contato"
  - `negociacao` -> "Em Negociação"
  - `fechado` -> "Convertido"
  - `perdido` -> "Perdido"

## Validação
- Build: `bun run build:dev`.
- Testes manuais: Fluxo de cópia, geração de lead via link e persistência de Originador na reatribuição.
