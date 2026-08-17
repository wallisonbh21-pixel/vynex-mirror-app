# Plano de Padronização Visual Global — ScaleNexus

O objetivo deste plano é unificar a experiência visual de todos os perfis (Admin, Vendedor, Criador e Cliente) sob um único **Design System Premium**, baseado na nova referência visual do Dashboard Administrativo.

## 1. Fundação e Design System (Fase 1)

Criaremos a infraestrutura de componentes compartilhados que servirá de base para todos os painéis.

### Componentes Globais a serem criados/refatorados:
- **`DashboardShell`**: Layout estrutural com `sidebar` escura, fundo `dark premium` e `header` padronizado.
- **`DashboardHeader`**: Título da área e descrição curta (ex: "Visão Geral" / "Resumo da operação").
- **`StatCard` (Refatoração)**: Padronizar bordas discretas, cantos arredondados, ícones e indicadores de tendência (trending up/down).
- **`DashboardSection`**: Container para agrupar cards e gráficos com espaçamento consistente.
- **`PremiumTable`**: Wrapper para o componente de tabela com estilos de hover, bordas e responsividade (cards no mobile).
- **`ActivityTimeline`**: Componente unificado para exibir "Atividades Recentes" em todos os painéis.

## 2. Implementação por Perfil

### Painel Administrador (Fase 2)
- **Status**: Já iniciado, mas requer ajuste para usar os novos componentes globais.
- **Foco**: Manter as métricas reais (Receita, MRR, Funil) com o layout final polido.

### Painel Vendedor / CRM (Fase 3)
- **Rota**: `/painel` e `/leads`.
- **Novos Cards**: Leads novos, Em negociação, Propostas, Convertidos, Taxa de conversão.
- **Gráfico**: Funil Comercial (evolução real dos leads).
- **Seções**: "Minhas Indicações" e "Atividades Recentes".
- **Restrição**: Ocultar dados financeiros globais.

### Painel Criador (Fase 4)
- **Rota**: `/criacao`.
- **Foco**: Produção e prazos.
- **Cards**: Projetos atribuídos, Em produção, Aguardando cliente, Entregues no mês.
- **Gráfico/Status**: Progresso da produção e próximos prazos.
- **Seções**: "Meus Projetos" (lista resumida) e "Próximas Entregas".

### Painel Cliente (Fase 5)
- **Rota**: `/cliente`.
- **Estética**: Mais "clean" e amigável, sem ruído administrativo.
- **Foco**: Transparência no progresso do projeto.
- **Cards**: Progresso atual, Próxima Etapa, Ação necessária (ex: aprovar briefing).
- **Acesso rápido**: Atalhos para Mensagens, Documentos e Reuniões.

## 3. Padronização da Sidebar

Unificaremos o componente `SidebarContent` no `AppShell.tsx`:
- **Estilo**: Fundo dark consistente, estados de hover e active com glow ciano.
- **Estrutura**: Logo no topo, navegação central, perfil do usuário com logout na base.
- **Dinamismo**: Ícones e labels seguindo o mesmo peso visual para todos os cargos.

## 4. Cronograma de Execução

1.  **Dia 1**: Criação dos componentes `DashboardHeader`, `DashboardSection` e `PremiumTable`.
2.  **Dia 2**: Migração do `AppShell` (Sidebar) e Dashboard Admin para os novos padrões.
3.  **Dia 3**: Reformulação do Dashboard do Vendedor.
4.  **Dia 4**: Reformulação do Dashboard do Criador.
5.  **Dia 5**: Refinamento do Portal do Cliente e auditoria responsiva global.

---
**Observação**: Nenhuma lógica de negócio, política de RLS ou fluxo de dados será alterado. O trabalho é estritamente de UI/UX e refatoração de componentes de apresentação.
