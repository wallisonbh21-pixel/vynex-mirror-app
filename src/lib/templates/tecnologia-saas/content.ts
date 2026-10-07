/**
 * TEMPLATE 03 — TECNOLOGIA & SAAS PREMIUM
 *
 * Dados do projeto separados da estrutura visual (mesmo padrão dos Templates 01 e 02).
 * O NexusBuild substitui apenas este objeto (via `mergeTecnologiaSaasContent`).
 * Todo conteúdo abaixo é DEMONSTRATIVO ("NEXORA" não é cliente real).
 */

export const TECNOLOGIA_SAAS_TEMPLATE_ID = "tpl-tecnologia-saas";
export const TECNOLOGIA_SAAS_TEMPLATE_VERSION = 1;

export type SaasSectionKey =
  | "navbar" | "hero" | "showcase" | "problem" | "solution" | "features" | "howItWorks" | "product"
  | "integrations" | "security" | "results" | "pricing" | "testimonials" | "faq" | "cta" | "footer";

export type SaasIcon =
  | "layers" | "unlink" | "eye" | "clock" | "brain" | "workflow" | "chart" | "users" | "file" | "message" | "bell" | "sliders"
  | "shield" | "key" | "activity" | "database" | "server" | "plug" | "settings" | "trending";

export type SaasFeature = { id: string; icon: SaasIcon; title: string; text: string; size?: "lg" | "md" };
export type SaasStep = { id: string; number: string; title: string; text: string };
export type SaasStat = { value: number; prefix?: string; suffix?: string; label: string };
export type SaasPlan = { id: string; name: string; description: string; price: string; period: string; features: string[]; ctaLabel: string; highlighted?: boolean; badge?: string };
export type SaasTestimonial = { id: string; name: string; role: string; company: string; text: string; initials: string };
export type SaasFaq = { id: string; question: string; answer: string };
export type SaasTab = { id: string; label: string; heading: string; metrics: { label: string; value: string }[]; rows: { name: string; status: string; value: string }[] };

export type TecnologiaSaasContent = {
  brand: { name: string; logoUrl?: string; tagline: string };
  theme: { background: string; surface: string; text: string; muted: string; accent: string; accent2: string; violet: string; accentText: string; headingFont: string; bodyFont: string };
  contact: { email: string; phone: string; city: string };
  nav: { items: { label: string; target: SaasSectionKey }[]; loginLabel: string; ctaLabel: string };
  hero: { eyebrow: string; title: string; text: string; primaryCta: string; secondaryCta: string; trustNote: string;
    mock: { appName: string; menu: string[]; kpis: { label: string; value: string; delta: string }[]; chart: number[]; activity: string[]; notification: string } };
  showcase: { title: string; subtitle: string; kpis: { label: string; value: string; delta: string }[]; tasks: { title: string; owner: string; status: string }[]; clients: { name: string; plan: string; value: string }[]; performance: number[] };
  problem: { title: string; items: { id: string; icon: SaasIcon; title: string; text: string }[] };
  solution: { title: string; text: string; nodes: { id: string; icon: SaasIcon; label: string; text: string }[] };
  features: { title: string; subtitle: string; items: SaasFeature[] };
  howItWorks: { title: string; steps: SaasStep[] };
  product: { title: string; subtitle: string; tabs: SaasTab[] };
  integrations: { title: string; subtitle: string; items: string[]; disclaimer: string };
  security: { title: string; subtitle: string; items: { id: string; icon: SaasIcon; title: string; text: string }[]; indicators: { label: string; value: string }[] };
  results: { title: string; stats: SaasStat[]; disclaimer: string };
  pricing: { title: string; subtitle: string; plans: SaasPlan[]; disclaimer: string };
  testimonials: { title: string; items: SaasTestimonial[]; disclaimer: string };
  faq: { title: string; items: SaasFaq[] };
  cta: { title: string; text: string; buttonLabel: string };
  footer: { description: string; columns: { title: string; links: string[] }[]; socials: { label: string; url: string }[]; legal: string };
  sections: SaasSectionKey[];
};

export const TECNOLOGIA_SAAS_DEFAULT_CONTENT: TecnologiaSaasContent = {
  brand: { name: "NEXORA", tagline: "Plataforma inteligente para empresas que querem crescer." },
  theme: {
    background: "#03060d", surface: "#0a101c", text: "#f1f5fb", muted: "#8a96ab",
    accent: "#2563ff", accent2: "#38bdf8", violet: "#7c6cf0", accentText: "#ffffff",
    headingFont: "Sora", bodyFont: "Manrope",
  },
  contact: { email: "contato@nexora.com.br", phone: "(11) 0000-0000", city: "São Paulo — SP" },
  nav: {
    items: [
      { label: "Produto", target: "showcase" }, { label: "Recursos", target: "features" },
      { label: "Integrações", target: "integrations" }, { label: "Segurança", target: "security" },
      { label: "Planos", target: "pricing" }, { label: "FAQ", target: "faq" },
    ],
    loginLabel: "Entrar", ctaLabel: "Começar agora",
  },
  hero: {
    eyebrow: "Plataforma inteligente para empresas que querem crescer.",
    title: "Seu negócio merece uma tecnologia que acompanhe o seu crescimento.",
    text: "Centralize processos, equipes e resultados em uma plataforma criada para tornar sua operação mais simples, inteligente e escalável.",
    primaryCta: "Começar agora", secondaryCta: "Conhecer a plataforma",
    trustNote: "Teste sem compromisso · Configuração guiada",
    mock: {
      appName: "Painel NEXORA",
      menu: ["Visão geral", "Projetos", "Clientes", "Equipe", "Relatórios"],
      kpis: [
        { label: "Receita mensal", value: "R$ 284 mil", delta: "+12,4%" },
        { label: "Projetos ativos", value: "128", delta: "+8" },
        { label: "Eficiência", value: "94%", delta: "+3,1%" },
      ],
      chart: [32, 40, 36, 52, 48, 61, 58, 70, 66, 78, 74, 88],
      activity: ["Relatório trimestral gerado", "Novo cliente integrado", "Tarefa concluída por Ana"],
      notification: "Meta mensal atingida",
    },
  },
  showcase: {
    title: "Tudo o que sua operação precisa. Em um só lugar.",
    subtitle: "Visão geral, métricas, tarefas e clientes reunidos em uma experiência clara.",
    kpis: [
      { label: "Clientes ativos", value: "2.418", delta: "+6,2%" },
      { label: "Tarefas concluídas", value: "9.730", delta: "+14%" },
      { label: "Tempo médio", value: "2,4h", delta: "-18%" },
      { label: "Satisfação", value: "4,9", delta: "+0,2" },
    ],
    tasks: [
      { title: "Revisar proposta comercial", owner: "Equipe comercial", status: "Em andamento" },
      { title: "Integrar novo cliente", owner: "Sucesso do cliente", status: "Concluída" },
      { title: "Atualizar relatório mensal", owner: "Financeiro", status: "Pendente" },
      { title: "Planejar sprint", owner: "Produto", status: "Em andamento" },
    ],
    clients: [
      { name: "Empresa Exemplo A", plan: "Empresarial", value: "R$ 12.400" },
      { name: "Empresa Exemplo B", plan: "Profissional", value: "R$ 4.800" },
      { name: "Empresa Exemplo C", plan: "Profissional", value: "R$ 3.900" },
    ],
    performance: [40, 55, 48, 62, 70, 66, 82],
  },
  problem: {
    title: "Quando sua tecnologia não acompanha, sua operação sente.",
    items: [
      { id: "pr1", icon: "layers", title: "Processos espalhados", text: "Cada área trabalha em uma ferramenta diferente." },
      { id: "pr2", icon: "unlink", title: "Informações desconectadas", text: "Dados importantes ficam presos em planilhas e e-mails." },
      { id: "pr3", icon: "eye", title: "Pouca visibilidade", text: "Decisões são tomadas sem uma visão clara do todo." },
      { id: "pr4", icon: "clock", title: "Tempo perdido em tarefas manuais", text: "A equipe gasta horas com atividades repetitivas." },
    ],
  },
  solution: {
    title: "Uma plataforma criada para simplificar o complexo.",
    text: "Conecte pessoas, processos e informações em uma experiência centralizada.",
    nodes: [
      { id: "n1", icon: "users", label: "Equipe", text: "Todos trabalhando no mesmo lugar" },
      { id: "n2", icon: "workflow", label: "Processos", text: "Fluxos padronizados e automáticos" },
      { id: "n3", icon: "database", label: "Dados", text: "Informação organizada em tempo real" },
      { id: "n4", icon: "trending", label: "Resultados", text: "Crescimento visível e mensurável" },
    ],
  },
  features: {
    title: "Potência para sua operação. Simplicidade para sua equipe.",
    subtitle: "Recursos pensados para o dia a dia de empresas em crescimento.",
    items: [
      { id: "f1", icon: "brain", title: "Gestão inteligente", text: "Uma visão completa da operação, com prioridades sugeridas e acompanhamento em tempo real.", size: "lg" },
      { id: "f2", icon: "workflow", title: "Automação de processos", text: "Elimine tarefas repetitivas com fluxos configuráveis.", size: "lg" },
      { id: "f3", icon: "chart", title: "Análise de dados", text: "Indicadores claros para decidir melhor." },
      { id: "f4", icon: "users", title: "Gestão de equipes", text: "Responsáveis, prazos e carga de trabalho." },
      { id: "f5", icon: "file", title: "Relatórios", text: "Relatórios prontos em poucos cliques." },
      { id: "f6", icon: "message", title: "Colaboração", text: "Comentários e arquivos no contexto certo." },
      { id: "f7", icon: "bell", title: "Notificações inteligentes", text: "Alertas apenas para o que importa." },
      { id: "f8", icon: "sliders", title: "Personalização", text: "Adapte campos, etapas e painéis." },
    ],
  },
  howItWorks: {
    title: "Comece simples. Evolua rápido.",
    steps: [
      { id: "s1", number: "01", title: "Conecte sua operação", text: "Importe dados e conecte as ferramentas que sua equipe já usa." },
      { id: "s2", number: "02", title: "Configure sua plataforma", text: "Ajuste processos, permissões e painéis ao seu jeito de trabalhar." },
      { id: "s3", number: "03", title: "Acompanhe seus resultados", text: "Monitore indicadores e evolua com dados em tempo real." },
    ],
  },
  product: {
    title: "Uma experiência pensada para quem precisa fazer mais.",
    subtitle: "Navegue pelas principais áreas da plataforma.",
    tabs: [
      { id: "t1", label: "Visão geral", heading: "Visão geral da operação", metrics: [{ label: "Receita", value: "R$ 284 mil" }, { label: "Projetos", value: "128" }, { label: "Equipe", value: "46" }], rows: [{ name: "Operação Sul", status: "No prazo", value: "92%" }, { name: "Operação Norte", status: "Atenção", value: "78%" }, { name: "Operação Centro", status: "No prazo", value: "88%" }] },
      { id: "t2", label: "Projetos", heading: "Projetos em andamento", metrics: [{ label: "Ativos", value: "128" }, { label: "No prazo", value: "91%" }, { label: "Entregues", value: "34" }], rows: [{ name: "Implantação Exemplo A", status: "Em andamento", value: "64%" }, { name: "Migração de dados", status: "Concluído", value: "100%" }, { name: "Novo portal", status: "Planejado", value: "12%" }] },
      { id: "t3", label: "Clientes", heading: "Carteira de clientes", metrics: [{ label: "Ativos", value: "2.418" }, { label: "Novos", value: "+86" }, { label: "Retenção", value: "97%" }], rows: [{ name: "Empresa Exemplo A", status: "Empresarial", value: "R$ 12.400" }, { name: "Empresa Exemplo B", status: "Profissional", value: "R$ 4.800" }, { name: "Empresa Exemplo C", status: "Essencial", value: "R$ 990" }] },
      { id: "t4", label: "Equipe", heading: "Desempenho da equipe", metrics: [{ label: "Pessoas", value: "46" }, { label: "Tarefas/semana", value: "1.240" }, { label: "Engajamento", value: "93%" }], rows: [{ name: "Comercial", status: "12 pessoas", value: "96%" }, { name: "Operações", status: "18 pessoas", value: "90%" }, { name: "Suporte", status: "16 pessoas", value: "94%" }] },
      { id: "t5", label: "Resultados", heading: "Resultados do trimestre", metrics: [{ label: "Crescimento", value: "+24%" }, { label: "Custos", value: "-11%" }, { label: "Margem", value: "32%" }], rows: [{ name: "Janeiro", status: "Meta atingida", value: "104%" }, { name: "Fevereiro", status: "Meta atingida", value: "110%" }, { name: "Março", status: "Em andamento", value: "86%" }] },
    ],
  },
  integrations: {
    title: "Conecte as ferramentas que sua empresa já utiliza.",
    subtitle: "Uma rede integrada para os dados circularem sem retrabalho.",
    items: ["WhatsApp", "Google", "Slack", "Microsoft", "Stripe", "HubSpot", "Salesforce", "E-mail", "API", "Webhook"],
    disclaimer: "Integrações ilustrativas. As conexões disponíveis são definidas em cada projeto.",
  },
  security: {
    title: "Construído para empresas que levam seus dados a sério.",
    subtitle: "Camadas de proteção trabalhando em conjunto, todos os dias.",
    items: [
      { id: "se1", icon: "shield", title: "Segurança", text: "Dados criptografados em trânsito e em repouso." },
      { id: "se2", icon: "key", title: "Controle de acesso", text: "Permissões por perfil, equipe e função." },
      { id: "se3", icon: "activity", title: "Monitoramento", text: "Acompanhamento contínuo de atividades." },
      { id: "se4", icon: "database", title: "Backup", text: "Cópias automáticas e recuperação rápida." },
      { id: "se5", icon: "server", title: "Confiabilidade", text: "Infraestrutura preparada para escalar." },
    ],
    indicators: [{ label: "Disponibilidade", value: "99,9%" }, { label: "Backups", value: "Diários" }, { label: "Monitoramento", value: "24/7" }],
  },
  results: {
    title: "Mais controle. Mais produtividade. Mais crescimento.",
    stats: [
      { value: 42, prefix: "+", suffix: "%", label: "Produtividade" },
      { value: 58, prefix: "-", suffix: "%", label: "Tempo operacional" },
      { value: 31, prefix: "+", suffix: "%", label: "Eficiência" },
      { value: 24, suffix: "/7", label: "Disponibilidade" },
    ],
    disclaimer: "Números demonstrativos do modelo. Não representam resultados reais de clientes.",
  },
  pricing: {
    title: "Planos que crescem com a sua empresa.",
    subtitle: "Escolha o ponto de partida ideal para sua operação.",
    plans: [
      { id: "pl1", name: "Essencial", description: "Para equipes que estão começando a organizar a operação.", price: "R$ 149", period: "/mês", features: ["Até 5 usuários", "Gestão de tarefas", "Relatórios básicos", "Suporte por e-mail"], ctaLabel: "Começar agora" },
      { id: "pl2", name: "Profissional", description: "Para empresas em crescimento que precisam de automação.", price: "R$ 399", period: "/mês", features: ["Até 25 usuários", "Automação de processos", "Análise de dados avançada", "Integrações", "Suporte prioritário"], ctaLabel: "Começar agora", highlighted: true, badge: "Mais escolhido" },
      { id: "pl3", name: "Empresarial", description: "Para operações complexas com necessidades específicas.", price: "Sob consulta", period: "", features: ["Usuários ilimitados", "Personalização completa", "Controle de acesso avançado", "Gerente de conta dedicado"], ctaLabel: "Falar com vendas" },
    ],
    disclaimer: "Preços demonstrativos do modelo.",
  },
  testimonials: {
    title: "Empresas que transformaram sua operação.",
    items: [
      { id: "te1", name: "Nome Exemplo 1", role: "Diretora de operações", company: "Empresa Exemplo A", initials: "E1", text: "Saímos de cinco ferramentas diferentes para uma única plataforma. A equipe ganhou tempo e clareza." },
      { id: "te2", name: "Nome Exemplo 2", role: "CEO", company: "Empresa Exemplo B", initials: "E2", text: "Hoje acompanho os indicadores da empresa em tempo real e tomo decisões com muito mais segurança." },
      { id: "te3", name: "Nome Exemplo 3", role: "Gerente de projetos", company: "Empresa Exemplo C", initials: "E3", text: "As automações eliminaram tarefas que consumiam horas toda semana. A implantação foi simples." },
      { id: "te4", name: "Nome Exemplo 4", role: "Head de vendas", company: "Empresa Exemplo D", initials: "E4", text: "A integração com nossas ferramentas foi o diferencial. Os dados circulam sem retrabalho." },
    ],
    disclaimer: "Depoimentos ilustrativos do modelo. Serão substituídos por relatos reais.",
  },
  faq: {
    title: "Perguntas frequentes",
    items: [
      { id: "q1", question: "O que é a plataforma?", answer: "Uma solução que centraliza processos, equipes e indicadores em um só lugar, para tornar a operação mais simples e escalável." },
      { id: "q2", question: "Para quem ela é indicada?", answer: "Para empresas de diferentes portes que querem organizar a operação, ganhar visibilidade e crescer com eficiência." },
      { id: "q3", question: "É possível personalizar?", answer: "Sim. Campos, etapas, painéis e permissões podem ser ajustados ao jeito de trabalhar da sua empresa." },
      { id: "q4", question: "Posso integrar outras ferramentas?", answer: "Sim. A plataforma pode se conectar às ferramentas que sua equipe já utiliza, conforme o plano contratado." },
      { id: "q5", question: "Existe suporte?", answer: "Sim. Todos os planos contam com suporte, e os planos superiores têm atendimento prioritário." },
      { id: "q6", question: "Como começo?", answer: "Basta clicar em “Começar agora”. Nossa equipe orienta a configuração inicial passo a passo." },
    ],
  },
  cta: {
    title: "Pronto para transformar sua operação?",
    text: "Comece com uma tecnologia criada para acompanhar o próximo estágio da sua empresa.",
    buttonLabel: "Começar agora →",
  },
  footer: {
    description: "Tecnologia para empresas que pensam no próximo nível.",
    columns: [
      { title: "Produto", links: ["Visão geral", "Recursos", "Integrações", "Planos"] },
      { title: "Empresa", links: ["Sobre nós", "Carreiras", "Contato"] },
      { title: "Recursos", links: ["Central de ajuda", "Guias", "Novidades"] },
      { title: "Suporte", links: ["Atendimento", "Status da plataforma", "Segurança"] },
    ],
    socials: [],
    legal: "Todos os direitos reservados.",
  },
  sections: ["hero", "showcase", "problem", "solution", "features", "howItWorks", "product", "integrations", "security", "results", "pricing", "testimonials", "faq", "cta", "footer"],
};

type DeepPartial<T> = { [K in keyof T]?: T[K] extends (infer U)[] ? U[] : T[K] extends object ? DeepPartial<T[K]> : T[K] };

function deepMerge<T>(base: T, patch: any): T {
  if (patch === undefined || patch === null) return base;
  if (Array.isArray(base) || typeof base !== "object" || base === null) return patch as T;
  const out: any = { ...base };
  for (const k of Object.keys(patch)) out[k] = deepMerge((base as any)[k], patch[k]);
  return out;
}

/** Aplica os dados de um cliente sobre o conteúdo padrão (arrays são substituídos). */
export function mergeTecnologiaSaasContent(patch: DeepPartial<TecnologiaSaasContent> = {}): TecnologiaSaasContent {
  return deepMerge(TECNOLOGIA_SAAS_DEFAULT_CONTENT, patch);
}
