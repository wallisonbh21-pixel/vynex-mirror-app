/**
 * TEMPLATE 02 — IA & AUTOMAÇÃO EMPRESARIAL
 *
 * Dados do projeto separados da estrutura visual (mesmo padrão do Template 01).
 * O NexusBuild substitui apenas este objeto (via `mergeIaAutomacaoContent`).
 * Todo conteúdo abaixo é DEMONSTRATIVO ("VALORA AI" não é cliente real).
 */

export const IA_AUTOMACAO_TEMPLATE_ID = "tpl-ia-automacao";
export const IA_AUTOMACAO_TEMPLATE_VERSION = 1;

export type IaSectionKey =
  | "navbar" | "hero" | "problem" | "solutions" | "agents" | "automations"
  | "integrations" | "results" | "useCases" | "testimonials" | "cta" | "footer";

export type IaIcon =
  | "chat" | "target" | "workflow" | "chart" | "pen" | "lifebuoy" | "repeat" | "clock" | "layers"
  | "wallet" | "megaphone" | "settings" | "users" | "whatsapp" | "crm" | "mail" | "globe" | "search" | "sheet" | "code" | "webhook" | "bot";

export type IaCard = { id: string; icon: IaIcon; title: string; text: string };
export type IaAgent = { id: string; name: string; role: string; status: "online" | "processando" | "aguardando"; text: string; metric: string };
export type IaFlow = { id: string; title: string; steps: string[] };
export type IaIntegration = { id: string; icon: IaIcon; label: string };
export type IaStat = { value: number; prefix?: string; suffix?: string; label: string };
export type IaUseCase = { id: string; icon: IaIcon; title: string; text: string; steps: string[] };
export type IaTestimonial = { id: string; role: string; segment: string; text: string };

export type IaAutomacaoContent = {
  brand: { name: string; logoUrl?: string; tagline: string };
  theme: { background: string; surface: string; text: string; muted: string; accent: string; accent2: string; violet: string; accentText: string; headingFont: string; bodyFont: string };
  contact: { email: string; phone: string; whatsapp: string; city: string; hours: string };
  nav: { items: { label: string; target: IaSectionKey }[]; ctaLabel: string };
  hero: { eyebrow: string; title: string; text: string; primaryCta: string; secondaryCta: string; panel: { agentName: string; messages: { from: "cliente" | "ia"; text: string }[]; indicators: { label: string; value: string }[]; nodes: string[] } };
  problem: { title: string; items: IaCard[]; transformation: string };
  solutions: { title: string; subtitle: string; items: IaCard[] };
  agents: { title: string; subtitle: string; items: IaAgent[] };
  automations: { title: string; subtitle: string; flows: IaFlow[] };
  integrations: { title: string; subtitle: string; items: IaIntegration[]; disclaimer: string };
  results: { title: string; subtitle: string; stats: IaStat[]; disclaimer: string };
  useCases: { title: string; subtitle: string; items: IaUseCase[] };
  testimonials: { title: string; subtitle: string; items: IaTestimonial[]; disclaimer: string };
  cta: { title: string; text: string; buttonLabel: string };
  footer: { description: string; columns: { title: string; links: string[] }[]; socials: { label: string; url: string }[]; legal: string };
  sections: IaSectionKey[];
};

export const IA_AUTOMACAO_DEFAULT_CONTENT: IaAutomacaoContent = {
  brand: { name: "VALORA AI", tagline: "Inteligência artificial para empresas" },
  theme: {
    background: "#04070f", surface: "#0a1222", text: "#eef4ff", muted: "#8b9bb8",
    accent: "#2f7bff", accent2: "#22d3ee", violet: "#8b5cf6", accentText: "#ffffff",
    headingFont: "Space Grotesk", bodyFont: "DM Sans",
  },
  contact: { email: "contato@valora.ai", phone: "(11) 0000-0000", whatsapp: "(11) 90000-0000", city: "São Paulo — SP", hours: "Seg a sex, 9h às 18h" },
  nav: {
    items: [
      { label: "Soluções", target: "solutions" }, { label: "Agentes de IA", target: "agents" },
      { label: "Automações", target: "automations" }, { label: "Integrações", target: "integrations" },
      { label: "Resultados", target: "results" }, { label: "Contato", target: "footer" },
    ],
    ctaLabel: "Falar com especialista",
  },
  hero: {
    eyebrow: "Agentes de IA personalizados",
    title: "Inteligência artificial que trabalha para o seu negócio.",
    text: "Automatize processos, acelere resultados e transforme sua operação com agentes de IA personalizados.",
    primaryCta: "Conhecer soluções", secondaryCta: "Falar com especialista",
    panel: {
      agentName: "Agente de Atendimento",
      messages: [
        { from: "cliente", text: "Olá! Vocês atendem empresas do meu porte?" },
        { from: "ia", text: "Sim! Posso entender sua necessidade e agendar uma conversa com nosso time." },
      ],
      indicators: [
        { label: "Tarefas automatizadas hoje", value: "1.284" },
        { label: "Tempo médio de resposta", value: "8s" },
      ],
      nodes: ["WhatsApp", "Agente IA", "CRM", "Equipe"],
    },
  },
  problem: {
    title: "Enquanto sua equipe trabalha manualmente, sua empresa perde tempo.",
    items: [
      { id: "p1", icon: "repeat", title: "Processos repetitivos", text: "Horas gastas copiando dados, respondendo as mesmas perguntas e preenchendo planilhas." },
      { id: "p2", icon: "clock", title: "Atendimento lento", text: "Clientes esperam respostas enquanto oportunidades esfriam fora do horário comercial." },
      { id: "p3", icon: "layers", title: "Informações espalhadas", text: "Dados em sistemas diferentes dificultam decisões rápidas e visão do negócio." },
    ],
    transformation: "Automatize o que consome tempo e concentre sua equipe no que realmente importa.",
  },
  solutions: {
    title: "IA aplicada aos processos que movem sua empresa.",
    subtitle: "Soluções sob medida para cada área da operação.",
    items: [
      { id: "s1", icon: "chat", title: "Atendimento inteligente", text: "Respostas instantâneas e precisas em todos os canais, 24 horas por dia." },
      { id: "s2", icon: "target", title: "Agentes de vendas", text: "Qualificação de contatos e encaminhamento de oportunidades para o time comercial." },
      { id: "s3", icon: "workflow", title: "Automação de processos", text: "Fluxos que executam tarefas operacionais sem intervenção manual." },
      { id: "s4", icon: "chart", title: "Análise de dados", text: "Relatórios e insights gerados automaticamente a partir dos seus dados." },
      { id: "s5", icon: "pen", title: "Geração de conteúdo", text: "Textos, propostas e respostas com a linguagem da sua marca." },
      { id: "s6", icon: "lifebuoy", title: "Suporte operacional", text: "Agentes que apoiam a equipe interna com consultas e procedimentos." },
    ],
  },
  agents: {
    title: "Agentes de IA que trabalham 24 horas.",
    subtitle: "Cada agente tem uma função clara e trabalha integrado à sua equipe.",
    items: [
      { id: "a1", name: "Agente de Atendimento", role: "Atendimento ao cliente", status: "online", text: "Responde dúvidas, resolve solicitações simples e transfere casos complexos.", metric: "Responde em segundos" },
      { id: "a2", name: "Agente de Vendas", role: "Comercial", status: "processando", text: "Qualifica contatos, responde dúvidas e encaminha oportunidades para sua equipe.", metric: "Qualifica leads" },
      { id: "a3", name: "Agente Financeiro", role: "Financeiro", status: "online", text: "Envia lembretes, confere pagamentos e organiza cobranças.", metric: "Organiza cobranças" },
      { id: "a4", name: "Agente de Suporte", role: "Suporte técnico", status: "aguardando", text: "Consulta a base de conhecimento e orienta usuários passo a passo.", metric: "Base de conhecimento" },
      { id: "a5", name: "Agente de Operações", role: "Operações", status: "online", text: "Monitora rotinas, atualiza sistemas e avisa a equipe sobre exceções.", metric: "Monitora rotinas" },
    ],
  },
  automations: {
    title: "Automações que conectam cada etapa.",
    subtitle: "Fluxos inteligentes que movem informações entre pessoas, sistemas e agentes.",
    flows: [
      { id: "f1", title: "Captação e vendas", steps: ["Novo contato", "Agente de IA", "Qualificação", "CRM", "Vendedor"] },
      { id: "f2", title: "Atendimento", steps: ["Mensagem", "IA", "Análise", "Resposta", "Cliente"] },
    ],
  },
  integrations: {
    title: "Conecte a IA ao seu ecossistema.",
    subtitle: "Os agentes trabalham junto com as ferramentas que sua empresa já usa.",
    items: [
      { id: "i1", icon: "whatsapp", label: "WhatsApp" }, { id: "i2", icon: "crm", label: "CRM" },
      { id: "i3", icon: "mail", label: "E-mail" }, { id: "i4", icon: "globe", label: "Site" },
      { id: "i5", icon: "search", label: "Google" }, { id: "i6", icon: "sheet", label: "Planilhas" },
      { id: "i7", icon: "code", label: "API" }, { id: "i8", icon: "webhook", label: "Webhook" },
    ],
    disclaimer: "Integrações ilustrativas. As conexões são definidas em cada projeto.",
  },
  results: {
    title: "Resultados que a automação pode gerar.",
    subtitle: "Ganhos típicos de operações que adotam agentes de IA.",
    stats: [
      { value: 40, prefix: "+", suffix: "%", label: "Produtividade" },
      { value: 65, prefix: "-", suffix: "%", label: "Tempo operacional" },
      { value: 24, suffix: "/7", label: "Disponibilidade" },
      { value: 32, prefix: "+", suffix: "%", label: "Conversão" },
    ],
    disclaimer: "Números demonstrativos do modelo. Não representam resultados reais de clientes.",
  },
  useCases: {
    title: "Automação para diferentes áreas da empresa.",
    subtitle: "Do primeiro contato ao pós-venda, a IA apoia cada setor.",
    items: [
      { id: "u1", icon: "target", title: "Vendas", text: "Leads qualificados chegam prontos para o vendedor.", steps: ["Lead", "IA", "Proposta"] },
      { id: "u2", icon: "chat", title: "Atendimento", text: "Respostas rápidas em todos os canais.", steps: ["Pergunta", "IA", "Resposta"] },
      { id: "u3", icon: "wallet", title: "Financeiro", text: "Cobranças e conciliações automáticas.", steps: ["Fatura", "IA", "Baixa"] },
      { id: "u4", icon: "megaphone", title: "Marketing", text: "Conteúdo e campanhas personalizadas.", steps: ["Briefing", "IA", "Conteúdo"] },
      { id: "u5", icon: "settings", title: "Operações", text: "Rotinas monitoradas sem esforço manual.", steps: ["Evento", "IA", "Ação"] },
      { id: "u6", icon: "users", title: "Recursos humanos", text: "Triagem de currículos e integração de novos colaboradores.", steps: ["Currículo", "IA", "Entrevista"] },
    ],
  },
  testimonials: {
    title: "Empresas que automatizaram sua operação",
    subtitle: "Exemplos de como a automação muda a rotina das equipes.",
    items: [
      { id: "t1", role: "Diretor comercial", segment: "Distribuidora", text: "O agente de vendas passou a qualificar os contatos e nossa equipe só conversa com quem está pronto para comprar." },
      { id: "t2", role: "Gerente de atendimento", segment: "Clínica", text: "Os pacientes recebem resposta imediata a qualquer hora, e a recepção ficou livre para o atendimento presencial." },
      { id: "t3", role: "Sócia-fundadora", segment: "Escritório contábil", text: "Rotinas que levavam dias agora rodam sozinhas. Ganhamos tempo para atender melhor nossos clientes." },
    ],
    disclaimer: "Depoimentos ilustrativos do modelo. Serão substituídos por relatos reais.",
  },
  cta: {
    title: "Seu próximo funcionário pode ser uma IA.",
    text: "Descubra quais processos da sua empresa podem ser automatizados.",
    buttonLabel: "Falar com especialista →",
  },
  footer: {
    description: "Agentes de IA e automações sob medida para empresas que querem crescer com eficiência.",
    columns: [
      { title: "Soluções", links: ["Atendimento inteligente", "Agentes de vendas", "Automação de processos", "Análise de dados"] },
      { title: "Empresa", links: ["Sobre nós", "Como trabalhamos", "Carreiras"] },
      { title: "Recursos", links: ["Casos de uso", "Integrações", "Perguntas frequentes"] },
    ],
    socials: [],
    legal: "Todos os direitos reservados.",
  },
  sections: ["hero", "problem", "solutions", "agents", "automations", "integrations", "results", "useCases", "testimonials", "cta", "footer"],
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
export function mergeIaAutomacaoContent(patch: DeepPartial<IaAutomacaoContent> = {}): IaAutomacaoContent {
  return deepMerge(IA_AUTOMACAO_DEFAULT_CONTENT, patch);
}
