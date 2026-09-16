/**
 * NEXUSBUILD AI — catálogo de fluxos e templates da sidebar interna.
 * Estruturas apenas; nenhum template real cadastrado ainda. Quando o
 * Website Builder / App Builder / Template Engine existirem, basta ligar
 * `objective` e `template` às ferramentas reais.
 */

export type NexusObjective = "CRIAR_SITE" | "CRIAR_APLICATIVO" | "CRIAR_COM_TEMPLATE";

export interface NexusTemplateCategory {
  label: string;
  items: string[];
}

export const NEXUS_TEMPLATE_CATEGORIES: NexusTemplateCategory[] = [
  {
    label: "Sites",
    items: [
      "Landing Page",
      "Site institucional",
      "Loja virtual",
      "Portfólio",
      "Blog",
      "Página de vendas",
    ],
  },
  {
    label: "Negócios",
    items: [
      "Imobiliária",
      "Restaurante",
      "Loja de roupas",
      "Loja de tênis",
      "Academia",
      "Clínica",
      "Escritório",
      "Agência",
    ],
  },
  {
    label: "Sistemas",
    items: ["SaaS", "Dashboard", "CRM", "Sistema administrativo", "Área do cliente"],
  },
  {
    label: "Aplicativos",
    items: ["App de serviços", "App de vendas", "App de delivery", "App empresarial"],
  },
];

export function siteFlowPrompt() {
  return [
    "MODE: website_creation.",
    "OBJETIVO DESTA CONVERSA: criar um site.",
    "Conduza o levantamento fazendo apenas as perguntas indispensáveis (marca, tipo de negócio,",
    "objetivo do site, público, estilo visual, cores, referências, páginas e funcionalidades).",
    "Siga o fluxo oficial: descoberta → referências → create_project → project_forge → apresentação",
    "do plano → confirmação → website_builder → validação → project_analysis.",
    "Nunca finja ter construído algo: informe com clareza o que o construtor ainda não faz.",
  ].join(" ");
}

export function appFlowPrompt() {
  return [
    "OBJETIVO DESTA CONVERSA: criar um aplicativo.",
    "Levante apenas o indispensável (tipo de app, plataforma — Android, iOS, Web ou PWA —,",
    "objetivo, público, funcionalidades, login, banco de dados, pagamentos, notificações,",
    "integrações e requisitos de publicação).",
    "Se a ferramenta de construção de aplicativo ainda não estiver disponível, diga isso com",
    "clareza e siga organizando o planejamento.",
  ].join(" ");
}

export function templateFlowPrompt(template: string, category: string) {
  return [
    `OBJETIVO DESTA CONVERSA: criar um projeto usando o template "${template}" (categoria ${category}).`,
    "Ainda não há template real cadastrado no ScaleNexus: trate isso como ponto de partida",
    "estrutural, confirme com o usuário o que ele espera desse modelo e levante apenas as",
    "informações indispensáveis antes de planejar.",
  ].join(" ");
}
