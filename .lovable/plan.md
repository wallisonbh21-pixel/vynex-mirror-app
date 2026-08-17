# Plano de Implementação: ScaleNexus Dashboard Administrativo Premium

Este plano descreve a criação da "Visão Geral da Operação", um dashboard executivo para administradores e diretores da ScaleNexus, focado em indicadores reais de receita, contratos e desempenho.

## 1. Auditoria de Dados e Roteamento

### Roteamento Atual
- A rota administrativa atual é `/admin` (gerenciada em `src/routes/_authenticated/admin.tsx`).
- Atualmente, ela foca em gestão de usuários, papéis e saques.
- **Mudança Proposta:** Transformar a rota `/admin` no Dashboard Executivo principal (Visão Geral) e mover a gestão de usuários/saques para uma sub-rota ou aba (ex: `/admin/usuarios`).

### Fontes de Dados (Tabelas Reais)
- **Receita/MRR:** Tabela `contracts` (colunas `amount` e `monthly_fee`). Filtro por status 'ativo'.
- **Contratos:** Tabela `contracts`. Contagem de linhas ativas.
- **Comissões:** Tabela `commissions` (coluna `amount` onde `status = 'pendente'`).
- **Funil de Leads:** Tabela `leads`. Agrupamento pela coluna `status`.
- **Destaques do Time:**
  - Vendedores: Join entre `profiles` e `leads`/`contracts` via `lead_attribution`.
  - Criadores: Join entre `profiles` e `projects` (contagem de `delivered_at`).

## 2. Arquitetura do Layout (Inspirado na Referência)

O layout utilizará a estrutura `AppShell` existente, mas com uma nova organização interna de cards e grids.

- **Cards Executivos (Top):** 4 slots (Receita, Contratos, MRR, Comissões).
- **Área Central (Gráficos):**
  - Esquerda (70%): Gráfico de Receita vs Recorrência (Evolução Mensal).
  - Direita (30%): Gráfico de Funil de Leads (Status do CRM).
- **Área Inferior (Tabelas e Rankings):**
  - Esquerda (60%): Tabela de Contratos Recentes.
  - Direita (40%): Widget "Destaques do Time" (Ranking Vendedores/Criadores).

## 3. Detalhes Técnicos

### Componentes a serem criados/reutilizados:
- `AdminDashboard`: Componente principal na rota `/admin`.
- `RevenueChart`: Utilizando Recharts (já disponível no projeto) para evolução mensal.
- `LeadsFunnelChart`: Gráfico de barras horizontal para status do CRM.
- `TeamHighlights`: Lista ranqueada de performance.

### Segurança (RLS):
- As consultas utilizarão `supabase` client padrão dentro do `serverFn` ou loader, respeitando as políticas de `admin`/`diretor`.
- Garantir que a `requireAdmin()` check da rota permaneça ativa.

## 4. Etapas de Execução

1. **Infraestrutura de Dados:** Criar funções `functions.ts` para buscar agregados reais (Receita, MRR, Funil) de forma eficiente.
2. **Refatoração do Roteamento:** Ajustar `src/routes/_authenticated/admin.tsx` para o novo Dashboard e mover a lógica atual de gestão de usuários para `src/routes/_authenticated/admin.usuarios.tsx`.
3. **Desenvolvimento da Interface:**
   - Implementar os Cards Executivos com `StatCard` (reutilizado/estilizado).
   - Criar os componentes de gráficos (Receita e Funil).
   - Implementar a Tabela de Contratos Recentes com links dinâmicos.
4. **Validação:** Testar com dados reais do banco para garantir que não há valores mockados.

## 5. Indicadores com Dados Reais vs Módulos Futuros

- **Contratos/Leads/Vendedores:** Dados reais disponíveis.
- **MRR:** Calculado sobre a coluna `monthly_fee` de contratos ativos.
- **Desempenho de Criadores:** Baseado na contagem de projetos entregues (`delivered_at`).
- **Comissões:** Baseado na tabela `commissions` se houver registros; caso contrário, exibirá "Sem dados suficientes".

NÃO iniciarei a implementação até sua aprovação deste plano.
