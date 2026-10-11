/**
 * TEMPLATE 05 — ADVOCACIA EMPRESARIAL PREMIUM
 *
 * Dados separados do visual (mesmo padrão dos Templates 01–04).
 * O NexusBuild substitui apenas este objeto (via `mergeAdvocaciaContent`).
 * Todo conteúdo é DEMONSTRATIVO: "Vértice Advocacia Empresarial" é fictício.
 * Sem números de OAB, resultados, prêmios, clientes reais ou promessas de êxito.
 */

export const ADVOCACIA_TEMPLATE_ID = "tpl-advocacia-empresarial";
export const ADVOCACIA_TEMPLATE_VERSION = 1;

export type AdvIcon = "briefcase" | "file" | "users" | "shield" | "lock" | "hard-hat" | "receipt" | "scale" | "compass" | "eye" | "message" | "target";

export type AdvItem = { id: string; icon: AdvIcon; title: string; text: string };
export type AdvStep = { id: string; number: string; title: string; text: string };
export type AdvMember = { id: string; name: string; photoUrl: string; education: string; specialty: string; oab: string };
export type AdvArticle = { id: string; category: string; title: string; excerpt: string; date: string };
export type AdvFaq = { id: string; question: string; answer: string };

export type AdvocaciaContent = {
  brand: { name: string; shortName: string; tagline: string };
  nav: { label: string; href: string }[];
  hero: { eyebrow: string; title: string; text: string; primaryCta: string; secondaryCta: string; imageUrl: string; imageAlt: string; notes: string[] };
  about: { eyebrow: string; title: string; history: string; positioning: string; values: { title: string; text: string }[]; imageUrl: string };
  areas: { eyebrow: string; title: string; text: string; items: AdvItem[] };
  advisory: { eyebrow: string; title: string; text: string; points: { title: string; text: string }[]; note: string };
  solutions: { eyebrow: string; title: string; items: { id: string; title: string; audience: string; text: string; topics: string[] }[] };
  method: { eyebrow: string; title: string; text: string; steps: AdvStep[] };
  differentials: { eyebrow: string; title: string; items: AdvItem[] };
  team: { eyebrow: string; title: string; text: string; members: AdvMember[]; disclaimer: string };
  insights: { eyebrow: string; title: string; categories: string[]; articles: AdvArticle[]; disclaimer: string };
  faq: { eyebrow: string; title: string; items: AdvFaq[]; disclaimer: string };
  contact: {
    eyebrow: string; title: string; text: string; email: string; phone: string; address: string; hours: string;
    /** Endpoint para envio real do formulário. Vazio = integração não configurada (nada é simulado). */
    formEndpoint: string;
    privacyNotice: string; privacyLinks: { label: string; href: string }[];
  };
  cta: { title: string; text: string; buttonLabel: string };
  footer: { description: string; professionalInfo: string; legal: string };
  theme: {
    navy: string; navyDeep: string; gold: string; ink: string; muted: string; paper: string; surface: string; line: string;
    headingFont: string; bodyFont: string;
  };
};

const img = (id: string, w = 1600) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=80`;

export const ADVOCACIA_DEFAULT_CONTENT: AdvocaciaContent = {
  brand: { name: "Vértice Advocacia Empresarial", shortName: "Vértice", tagline: "Assessoria jurídica estratégica para empresas" },
  nav: [
    { label: "O escritório", href: "#escritorio" },
    { label: "Áreas de atuação", href: "#areas" },
    { label: "Metodologia", href: "#metodologia" },
    { label: "Equipe", href: "#equipe" },
    { label: "Conteúdos", href: "#conteudos" },
    { label: "Contato", href: "#contato" },
  ],
  hero: {
    eyebrow: "Advocacia empresarial",
    title: "Assessoria jurídica estratégica para decisões empresariais seguras",
    text: "Atuamos ao lado de empresas na organização jurídica, na prevenção de riscos e na condução de questões complexas, com análise técnica individualizada e comunicação clara.",
    primaryCta: "Fale com o escritório",
    secondaryCta: "Conheça as áreas de atuação",
    imageUrl: img("photo-1497366216548-37526070297c"),
    imageAlt: "Sala de reuniões corporativa com mesa de madeira e luz natural",
    notes: ["Atuação consultiva e contenciosa", "Atendimento a empresas de diferentes portes", "Confidencialidade em todas as etapas"],
  },
  about: {
    eyebrow: "O escritório",
    title: "Técnica jurídica a serviço da estratégia do negócio",
    history: "A Vértice nasceu do propósito de aproximar o Direito da rotina das empresas. Nossa atuação parte do entendimento do negócio, de seus objetivos e de seus riscos, para que cada orientação jurídica seja aplicável e coerente com a realidade de quem decide.",
    positioning: "Trabalhamos de forma próxima, com equipes dedicadas e comunicação objetiva, apoiando sócios, gestores e departamentos jurídicos internos em demandas consultivas e contenciosas.",
    values: [
      { title: "Ética", text: "Atuação pautada pelo Código de Ética e Disciplina da OAB." },
      { title: "Discrição", text: "Sigilo profissional como compromisso permanente." },
      { title: "Clareza", text: "Orientações compreensíveis, sem jargão desnecessário." },
      { title: "Rigor técnico", text: "Estudo cuidadoso de cada situação concreta." },
    ],
    imageUrl: img("photo-1589829545856-d10d557cf95f", 1200),
  },
  areas: {
    eyebrow: "Áreas de atuação",
    title: "Atuação integrada nas principais frentes jurídicas da empresa",
    text: "Cada área conta com profissionais dedicados e trabalha de forma integrada às demais.",
    items: [
      { id: "empresarial", icon: "briefcase", title: "Direito Empresarial", text: "Estruturação jurídica de operações, relações comerciais e decisões estratégicas da empresa." },
      { id: "contratos", icon: "file", title: "Contratos", text: "Elaboração, revisão e negociação de contratos civis e empresariais, com foco em equilíbrio e segurança." },
      { id: "societario", icon: "users", title: "Societário", text: "Constituição, reorganizações, acordos de sócios, governança e operações societárias." },
      { id: "compliance", icon: "shield", title: "Compliance", text: "Programas de integridade, políticas internas, treinamentos e canais de denúncia." },
      { id: "lgpd", icon: "lock", title: "Proteção de Dados", text: "Adequação à LGPD, mapeamento de dados, contratos e resposta a incidentes." },
      { id: "trabalhista", icon: "hard-hat", title: "Trabalhista Empresarial", text: "Consultoria preventiva, relações sindicais e defesa em demandas trabalhistas." },
      { id: "tributario", icon: "receipt", title: "Tributário", text: "Planejamento tributário lícito, consultoria fiscal e contencioso administrativo e judicial." },
      { id: "contencioso", icon: "scale", title: "Contencioso Estratégico", text: "Condução de litígios cíveis e empresariais com análise prévia de riscos e alternativas." },
    ],
  },
  advisory: {
    eyebrow: "Atuação consultiva",
    title: "Prevenção e organização jurídica como parte da gestão",
    text: "Grande parte dos conflitos empresariais pode ser evitada ou reduzida com orientação adequada no momento certo. Nossa atuação consultiva apoia a tomada de decisão antes que os riscos se materializem.",
    points: [
      { title: "Prevenção de riscos", text: "Identificação de pontos sensíveis em contratos, operações e rotinas." },
      { title: "Organização jurídica", text: "Documentos, políticas e estruturas societárias revisados e atualizados." },
      { title: "Suporte às decisões", text: "Pareceres e reuniões de alinhamento para escolhas estratégicas." },
    ],
    note: "A atuação consultiva não elimina todos os riscos do negócio; ela oferece informação qualificada para decisões mais conscientes.",
  },
  solutions: {
    eyebrow: "Soluções para empresas",
    title: "Atendimento ajustado ao momento de cada empresa",
    items: [
      { id: "pequenas", title: "Pequenas empresas", audience: "Estruturação", text: "Base jurídica sólida para quem está organizando contratos, sociedade e relações de trabalho.", topics: ["Contrato social e acordo de sócios", "Modelos de contratos", "Orientação trabalhista"] },
      { id: "expansao", title: "Empresas em expansão", audience: "Crescimento", text: "Apoio jurídico para novos mercados, investimentos, parcerias e aumento da equipe.", topics: ["Entrada de investidores", "Contratos com parceiros", "Adequação à LGPD"] },
      { id: "consolidadas", title: "Organizações consolidadas", audience: "Governança", text: "Suporte contínuo a departamentos jurídicos, conselhos e diretorias.", topics: ["Programas de compliance", "Reorganizações societárias", "Contencioso estratégico"] },
    ],
  },
  method: {
    eyebrow: "Metodologia",
    title: "Um processo de trabalho claro, do primeiro contato ao acompanhamento",
    text: "As etapas são ajustadas à natureza de cada demanda.",
    steps: [
      { id: "s1", number: "01", title: "Entendimento da demanda", text: "Reunião inicial para compreender o contexto, os objetivos e a urgência." },
      { id: "s2", number: "02", title: "Análise", text: "Estudo dos documentos, da legislação e da jurisprudência aplicáveis." },
      { id: "s3", number: "03", title: "Orientação", text: "Apresentação de cenários, alternativas e recomendações fundamentadas." },
      { id: "s4", number: "04", title: "Execução", text: "Elaboração de documentos, negociações ou atuação perante órgãos e tribunais." },
      { id: "s5", number: "05", title: "Acompanhamento", text: "Relatórios periódicos e revisão das medidas adotadas." },
    ],
  },
  differentials: {
    eyebrow: "Como trabalhamos",
    title: "Compromissos que orientam nossa atuação",
    items: [
      { id: "d1", icon: "message", title: "Comunicação transparente", text: "Informações claras sobre andamento, cenários e honorários." },
      { id: "d2", icon: "eye", title: "Análise individualizada", text: "Cada caso é estudado a partir de seus fatos e documentos." },
      { id: "d3", icon: "lock", title: "Confidencialidade", text: "Sigilo profissional e cuidado no tratamento de informações." },
      { id: "d4", icon: "compass", title: "Abordagem estratégica", text: "Soluções jurídicas alinhadas aos objetivos do negócio." },
    ],
  },
  team: {
    eyebrow: "Equipe jurídica",
    title: "Profissionais dedicados às demandas empresariais",
    text: "Substitua os perfis abaixo pelos dados reais da equipe.",
    members: [
      { id: "m1", name: "Nome do(a) sócio(a)", photoUrl: img("photo-1560250097-0b93528c311a", 800), education: "Formação acadêmica a informar", specialty: "Direito Empresarial e Societário", oab: "OAB/UF nº a informar" },
      { id: "m2", name: "Nome do(a) sócio(a)", photoUrl: img("photo-1573496359142-b8d87734a5a2", 800), education: "Formação acadêmica a informar", specialty: "Contratos e Proteção de Dados", oab: "OAB/UF nº a informar" },
      { id: "m3", name: "Nome do(a) advogado(a)", photoUrl: img("photo-1519085360753-af0119f7cbe7", 800), education: "Formação acadêmica a informar", specialty: "Tributário", oab: "OAB/UF nº a informar" },
      { id: "m4", name: "Nome do(a) advogado(a)", photoUrl: img("photo-1580489944761-15a19d654956", 800), education: "Formação acadêmica a informar", specialty: "Trabalhista Empresarial", oab: "OAB/UF nº a informar" },
    ],
    disclaimer: "Perfis demonstrativos. Nomes, fotos, formação e inscrições na OAB devem ser preenchidos com os dados reais.",
  },
  insights: {
    eyebrow: "Conteúdo jurídico",
    title: "Análises e atualizações para empresários",
    categories: ["Todos", "Contratos", "LGPD", "Tributário", "Societário"],
    articles: [
      { id: "a1", category: "Contratos", title: "Cláusulas essenciais em contratos de prestação de serviços", excerpt: "Pontos de atenção na definição de escopo, prazos, responsabilidades e rescisão.", date: "02/09/2026" },
      { id: "a2", category: "LGPD", title: "Primeiros passos para a adequação à Lei Geral de Proteção de Dados", excerpt: "Como iniciar o mapeamento de dados pessoais tratados pela empresa.", date: "18/08/2026" },
      { id: "a3", category: "Societário", title: "Acordo de sócios: por que formalizar desde o início", excerpt: "Regras de entrada, saída e tomada de decisão que evitam conflitos futuros.", date: "05/08/2026" },
      { id: "a4", category: "Tributário", title: "Reforma tributária: pontos de atenção para o planejamento", excerpt: "Aspectos gerais que merecem acompanhamento pelas empresas.", date: "22/07/2026" },
    ],
    disclaimer: "Artigos demonstrativos, apenas como exemplo de conteúdo. Não constituem orientação jurídica.",
  },
  faq: {
    eyebrow: "Perguntas frequentes",
    title: "Dúvidas comuns sobre o atendimento",
    items: [
      { id: "f1", question: "Como funciona o primeiro contato com o escritório?", answer: "Após o envio da mensagem, nossa equipe retorna para entender a demanda e, se for o caso, agendar uma reunião inicial." },
      { id: "f2", question: "O escritório atende empresas de todos os portes?", answer: "Sim. Atendemos desde pequenas empresas até organizações consolidadas, ajustando o formato de trabalho a cada realidade." },
      { id: "f3", question: "Como são definidos os honorários?", answer: "Os honorários são apresentados em proposta formal, conforme a natureza e a complexidade do trabalho, observada a tabela da OAB." },
      { id: "f4", question: "É possível contratar uma assessoria contínua?", answer: "Sim. Oferecemos acompanhamento consultivo recorrente, com escopo definido em contrato." },
      { id: "f5", question: "As informações enviadas são tratadas com sigilo?", answer: "Sim. O sigilo profissional é dever do advogado. Ainda assim, recomendamos não enviar documentos sigilosos pelo formulário inicial." },
    ],
    disclaimer: "As respostas têm caráter informativo e não substituem a orientação jurídica individual.",
  },
  contact: {
    eyebrow: "Contato",
    title: "Conte-nos sobre a sua demanda",
    text: "Preencha o formulário e nossa equipe retornará pelo canal informado.",
    email: "contato@exemplo.com.br",
    phone: "(11) 0000-0000",
    address: "Endereço do escritório a informar — São Paulo/SP",
    hours: "Segunda a sexta, das 9h às 18h",
    formEndpoint: "",
    privacyNotice: "Para sua segurança, não envie documentos sigilosos, dados sensíveis ou informações protegidas neste formulário inicial. Essas informações serão solicitadas por canal adequado, se necessário.",
    privacyLinks: [
      { label: "Política de privacidade", href: "#" },
      { label: "Termos de uso", href: "#" },
    ],
  },
  cta: {
    title: "Vamos conversar sobre os desafios jurídicos da sua empresa?",
    text: "Nossa equipe está à disposição para compreender sua demanda e apresentar a forma de atuação mais adequada.",
    buttonLabel: "Entrar em contato",
  },
  footer: {
    description: "Assessoria jurídica empresarial com atuação consultiva e contenciosa.",
    professionalInfo: "Sociedade de advogados — registro na OAB/UF a informar · CNPJ a informar",
    legal: "Conteúdo demonstrativo. Dados profissionais devem ser substituídos pelos dados reais do escritório.",
  },
  theme: {
    navy: "#14213D", navyDeep: "#0B1428", gold: "#B08D57", ink: "#2B2F36", muted: "#5F6672", paper: "#FAF8F4", surface: "#FFFFFF", line: "#E4DFD5",
    headingFont: "Cormorant Garamond", bodyFont: "Manrope",
  },
};

type Plain = Record<string, unknown>;
const isObj = (v: unknown): v is Plain => !!v && typeof v === "object" && !Array.isArray(v);
function deepMerge<T>(base: T, patch: unknown): T {
  if (!isObj(base) || !isObj(patch)) return (patch === undefined ? base : (patch as T));
  const out: Plain = { ...base };
  for (const [k, v] of Object.entries(patch)) out[k] = isObj(v) && isObj(out[k]) ? deepMerge(out[k], v) : v;
  return out as T;
}

/** Aplica dados personalizados (do NexusBuild ou do Criador) sobre o conteúdo padrão, sem alterar o original. */
export function mergeAdvocaciaContent(patch: Partial<AdvocaciaContent> | Record<string, unknown> = {}): AdvocaciaContent {
  return deepMerge(structuredClone(ADVOCACIA_DEFAULT_CONTENT), patch);
}
