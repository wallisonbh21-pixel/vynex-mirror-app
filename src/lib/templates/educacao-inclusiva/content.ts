/**
 * TEMPLATE 04 — EDUCAÇÃO INCLUSIVA & APOIO EDUCACIONAL
 *
 * Dados separados do visual (mesmo padrão dos Templates 01–03).
 * O NexusBuild substitui apenas este objeto (via `mergeEducacaoContent`).
 * Todo conteúdo é DEMONSTRATIVO: "Professora Marina" e "Aprender com Acolhimento" são fictícios.
 * Sem diagnóstico, sem promessa de tratamento e sem rótulos para a criança.
 */

export const EDUCACAO_TEMPLATE_ID = "tpl-educacao-inclusiva";
export const EDUCACAO_TEMPLATE_VERSION = 1;

export type EduSectionKey =
  | "hero" | "about" | "process" | "areas" | "approach" | "journal"
  | "resources" | "partnership" | "testimonials" | "faq" | "cta" | "footer";

export type EduIcon =
  | "book" | "puzzle" | "calendar" | "compass" | "lightbulb" | "palette" | "user" | "heart"
  | "eye" | "clipboard" | "target" | "trend" | "image" | "list" | "dice" | "tablet" | "folder" | "chat" | "school" | "home";

export type EduItem = { id: string; icon: EduIcon; title: string; text: string };
export type EduStep = { id: string; number: string; title: string; text: string };
export type EduTestimonial = { id: string; name: string; relation: string; text: string };
export type EduFaq = { id: string; question: string; answer: string };

export type EducacaoContent = {
  brand: { name: string; logoUrl?: string; tagline: string };
  professional: {
    name: string; photoUrl: string; photoAlt: string; role: string;
    education: string; experience: string; specializations: string[]; bio: string; quote: string;
  };
  theme: {
    background: string; surface: string; surfaceAlt: string; text: string; muted: string;
    primary: string; primaryText: string; sage: string; accent: string; line: string;
    headingFont: string; bodyFont: string;
  };
  contact: { email: string; phone: string; whatsapp: string; city: string; hours: string };
  nav: { items: { label: string; target: EduSectionKey }[]; ctaLabel: string };
  hero: { eyebrow: string; title: string; text: string; primaryCta: string; secondaryCta: string; imageUrl: string; imageAlt: string; cards: { label: string; value: string }[] };
  about: { title: string; text: string };
  process: { title: string; subtitle: string; steps: EduStep[] };
  areas: { title: string; subtitle: string; items: EduItem[] };
  approach: { title: string; subtitle: string; flow: string[]; elements: EduItem[] };
  journal: { title: string; subtitle: string; studentLabel: string; week: string; entries: { label: string; text: string; icon: EduIcon }[]; progress: { label: string; value: number }[]; disclaimer: string };
  resources: { title: string; subtitle: string; items: EduItem[]; imageUrl: string; imageAlt: string };
  partnership: { title: string; subtitle: string; actors: { label: string; icon: EduIcon }[]; pillars: EduItem[]; disclaimer: string };
  testimonials: { title: string; subtitle: string; items: EduTestimonial[]; disclaimer: string };
  faq: { title: string; items: EduFaq[] };
  cta: { title: string; text: string; buttonLabel: string };
  footer: { description: string; columns: { title: string; links: string[] }[]; socials: { label: string; url: string }[]; legal: string };
  sections: EduSectionKey[];
};

export const EDUCACAO_DEFAULT_CONTENT: EducacaoContent = {
  brand: { name: "Aprender com Acolhimento", tagline: "Educação individualizada com acolhimento, respeito e propósito." },
  professional: {
    name: "Professora Marina",
    photoUrl: "https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=900&q=80",
    photoAlt: "Foto demonstrativa da profissional em ambiente de estudo",
    role: "Profissional de apoio educacional",
    education: "[Formação da profissional — editar]",
    experience: "[Tempo e área de experiência — editar]",
    specializations: ["[Especialização 1 — editar]", "[Especialização 2 — editar]", "[Área de interesse — editar]"],
    bio: "Meu trabalho é acompanhar cada aluno respeitando seu ritmo, suas características e suas formas de aprender.",
    quote: "Aprender é um caminho — e cada caminho merece atenção.",
  },
  theme: {
    background: "#f8f5ef", surface: "#ffffff", surfaceAlt: "#eef2ef", text: "#1f2d33", muted: "#55656b",
    primary: "#1f5f6b", primaryText: "#ffffff", sage: "#8aa892", accent: "#d9826a", line: "#dde3df",
    headingFont: "Fraunces", bodyFont: "Nunito Sans",
  },
  contact: { email: "contato@aprendercomacolhimento.com.br", phone: "(00) 0000-0000", whatsapp: "(00) 90000-0000", city: "Sua cidade — UF", hours: "Seg a sex, 8h às 18h" },
  nav: {
    items: [
      { label: "Início", target: "hero" }, { label: "Sobre", target: "about" },
      { label: "Acompanhamento", target: "areas" }, { label: "Como funciona", target: "process" },
      { label: "Para famílias", target: "partnership" }, { label: "Dúvidas", target: "faq" },
    ],
    ctaLabel: "Conversar",
  },
  hero: {
    eyebrow: "Apoio educacional individualizado",
    title: "Cada aluno aprende de um jeito. O acompanhamento também pode ser.",
    text: "Um trabalho individualizado, construído com acolhimento, respeito e atenção às necessidades de cada aluno.",
    primaryCta: "Conhecer o trabalho", secondaryCta: "Conversar",
    imageUrl: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&w=1000&q=80",
    imageAlt: "Mesa de estudo com cadernos, lápis e materiais pedagógicos",
    cards: [
      { label: "Objetivo da semana", value: "Organizar a rotina de estudos" },
      { label: "Pequena conquista", value: "Leitura com mais autonomia" },
    ],
  },
  about: { title: "Um acompanhamento que começa conhecendo cada aluno.", text: "Antes de qualquer planejamento, existe escuta: conhecer a rotina, os interesses e a forma como cada aluno se relaciona com o aprender." },
  process: {
    title: "Um processo pensado para cada realidade.", subtitle: "Quatro etapas que se repetem e se ajustam ao longo do caminho.",
    steps: [
      { id: "s1", number: "01", title: "Conhecer", text: "Entender a rotina, os interesses e as necessidades do aluno." },
      { id: "s2", number: "02", title: "Planejar", text: "Definir objetivos educacionais adequados ao momento do aluno." },
      { id: "s3", number: "03", title: "Acompanhar", text: "Registrar avanços, dificuldades e estratégias utilizadas." },
      { id: "s4", number: "04", title: "Ajustar", text: "Adaptar o acompanhamento conforme a evolução observada." },
    ],
  },
  areas: {
    title: "Em quais momentos posso ajudar?", subtitle: "Áreas de apoio que podem ser combinadas conforme cada realidade.",
    items: [
      { id: "a1", icon: "book", title: "Acompanhamento pedagógico", text: "Apoio contínuo nas atividades e conteúdos escolares." },
      { id: "a2", icon: "lightbulb", title: "Apoio à aprendizagem", text: "Estratégias para tornar o aprender mais acessível." },
      { id: "a3", icon: "calendar", title: "Organização da rotina escolar", text: "Rotinas visuais e combinados que trazem previsibilidade." },
      { id: "a4", icon: "compass", title: "Desenvolvimento de autonomia", text: "Pequenos passos para fazer cada vez mais por si." },
      { id: "a5", icon: "list", title: "Estratégias de estudo", text: "Formas de estudar que respeitam o jeito de cada aluno." },
      { id: "a6", icon: "puzzle", title: "Atividades adaptadas", text: "Materiais ajustados aos objetivos e interesses." },
      { id: "a7", icon: "user", title: "Acompanhamento individualizado", text: "Atenção dedicada, no ritmo do aluno." },
      { id: "a8", icon: "heart", title: "Orientação à família", text: "Conversas e sugestões para o dia a dia em casa." },
    ],
  },
  approach: {
    title: "Não existe uma única forma de aprender.", subtitle: "O método parte do aluno e volta para ele — em ciclos de observação e ajuste.",
    flow: ["Aluno", "Observação", "Planejamento", "Estratégias", "Acompanhamento", "Evolução"],
    elements: [
      { id: "e1", icon: "clipboard", title: "Planejamento", text: "Objetivos claros e possíveis para o momento." },
      { id: "e2", icon: "puzzle", title: "Atividades", text: "Propostas pensadas a partir dos interesses." },
      { id: "e3", icon: "eye", title: "Observações", text: "Registro atento do que funciona e do que não funciona." },
      { id: "e4", icon: "target", title: "Objetivos", text: "Metas revisadas junto com a família." },
      { id: "e5", icon: "trend", title: "Evolução", text: "Cada avanço é notado e valorizado." },
    ],
  },
  journal: {
    title: "Acompanhar também é observar pequenas conquistas.", subtitle: "Exemplo visual de um diário de acompanhamento.",
    studentLabel: "Aluno A. (fictício)", week: "Semana 12",
    entries: [
      { label: "Objetivo da semana", text: "Ler pequenos textos com mais segurança.", icon: "target" },
      { label: "Atividade realizada", text: "Leitura compartilhada com cartões de apoio visual.", icon: "book" },
      { label: "Observação", text: "Demonstrou mais interesse quando o tema envolvia animais.", icon: "eye" },
      { label: "Evolução", text: "Leu duas frases completas sem pausa longa.", icon: "trend" },
      { label: "Próximo passo", text: "Introduzir textos curtos sobre temas de interesse.", icon: "compass" },
    ],
    progress: [{ label: "Leitura", value: 64 }, { label: "Rotina", value: 78 }, { label: "Autonomia", value: 52 }],
    disclaimer: "Exemplo demonstrativo com dados fictícios. Nenhuma informação real de aluno é exibida.",
  },
  resources: {
    title: "Recursos que tornam a aprendizagem mais significativa.", subtitle: "Materiais escolhidos e adaptados para cada objetivo.",
    imageUrl: "https://images.unsplash.com/photo-1588072432836-e10032774350?auto=format&fit=crop&w=1000&q=80",
    imageAlt: "Materiais educacionais organizados sobre uma mesa",
    items: [
      { id: "r1", icon: "palette", title: "Atividades personalizadas", text: "Criadas a partir dos interesses do aluno." },
      { id: "r2", icon: "image", title: "Materiais visuais", text: "Apoios visuais que facilitam a compreensão." },
      { id: "r3", icon: "calendar", title: "Rotinas estruturadas", text: "Sequências previsíveis que trazem segurança." },
      { id: "r4", icon: "dice", title: "Jogos pedagógicos", text: "Aprender também com o brincar orientado." },
      { id: "r5", icon: "tablet", title: "Recursos digitais", text: "Ferramentas digitais usadas com propósito." },
      { id: "r6", icon: "folder", title: "Estratégias de organização", text: "Formas de organizar materiais e tarefas." },
    ],
  },
  partnership: {
    title: "Quando todos caminham juntos, o acompanhamento ganha força.", subtitle: "Profissional, família e escola em diálogo constante.",
    actors: [{ label: "Profissional", icon: "user" }, { label: "Família", icon: "home" }, { label: "Escola", icon: "school" }],
    pillars: [
      { id: "p1", icon: "chat", title: "Comunicação", text: "Conversas regulares e transparentes." },
      { id: "p2", icon: "clipboard", title: "Planejamento", text: "Objetivos alinhados entre todos." },
      { id: "p3", icon: "eye", title: "Acompanhamento", text: "Registros compartilhados quando combinado." },
      { id: "p4", icon: "folder", title: "Troca de informações", text: "Informações tratadas com cuidado e respeito." },
    ],
    disclaimer: "O acompanhamento educacional não substitui o trabalho de profissionais de saúde ou de outros especialistas — ele caminha ao lado deles.",
  },
  testimonials: {
    title: "Experiências que fazem parte dessa jornada.", subtitle: "Relatos de responsáveis.",
    items: [
      { id: "t1", name: "Responsável A.", relation: "Mãe de aluno do Ensino Fundamental", text: "Sentimos que nosso filho foi realmente ouvido. A rotina em casa ficou mais leve." },
      { id: "t2", name: "Responsável B.", relation: "Pai de aluna", text: "A comunicação com a escola melhorou muito. Todos passaram a falar a mesma língua." },
      { id: "t3", name: "Responsável C.", relation: "Avó e responsável", text: "Cada pequena conquista é compartilhada com carinho. Isso faz diferença." },
    ],
    disclaimer: "Depoimentos demonstrativos e fictícios — serão substituídos por relatos reais autorizados.",
  },
  faq: {
    title: "Dúvidas frequentes",
    items: [
      { id: "f1", question: "Como funciona o acompanhamento?", answer: "Começa com uma conversa para conhecer o aluno e a família. Depois, definimos objetivos e um plano de acompanhamento que é revisado periodicamente." },
      { id: "f2", question: "Para qual faixa etária?", answer: "[Informe aqui a faixa etária atendida pela profissional.]" },
      { id: "f3", question: "Como são definidas as atividades?", answer: "A partir da observação, dos interesses do aluno e dos objetivos combinados com a família e a escola." },
      { id: "f4", question: "A família participa do processo?", answer: "Sim. A família é parte essencial: participa das conversas, do planejamento e recebe retornos regulares." },
      { id: "f5", question: "O acompanhamento pode ser personalizado?", answer: "Sim. Cada plano é construído para a realidade de cada aluno, e ajustado conforme a evolução observada." },
      { id: "f6", question: "Como acontece o primeiro contato?", answer: "Por mensagem ou telefone. Marcamos uma conversa inicial, sem compromisso, para entender o momento do aluno." },
      { id: "f7", question: "Como agendar uma conversa?", answer: "Pelo botão “Conversar” ou pelos contatos no fim da página." },
    ],
  },
  cta: {
    title: "Vamos conversar sobre o melhor caminho para este momento?",
    text: "Cada história é diferente. O primeiro passo é conhecer a realidade e entender como podemos construir um acompanhamento adequado.",
    buttonLabel: "Conversar sobre o acompanhamento →",
  },
  footer: {
    description: "Educação com respeito, atenção e propósito.",
    columns: [
      { title: "Sobre", links: ["A profissional", "Abordagem"] },
      { title: "Acompanhamento", links: ["Como funciona", "Áreas de apoio", "Recursos"] },
      { title: "Famílias", links: ["Parceria", "Dúvidas"] },
    ],
    socials: [],
    legal: "Conteúdo demonstrativo · Modelo de site ScaleNexus",
  },
  sections: ["hero", "about", "process", "areas", "approach", "journal", "resources", "partnership", "testimonials", "faq", "cta", "footer"],
};

type DeepPartial<T> = { [K in keyof T]?: T[K] extends (infer U)[] ? U[] : T[K] extends object ? DeepPartial<T[K]> : T[K] };

/** Merge profundo: arrays substituem, objetos se mesclam. */
export function mergeEducacaoContent(over: DeepPartial<EducacaoContent> = {}, base: EducacaoContent = EDUCACAO_DEFAULT_CONTENT): EducacaoContent {
  const merge = (a: any, b: any): any => {
    if (b === undefined) return a;
    if (Array.isArray(b) || typeof b !== "object" || b === null) return b;
    const out: any = { ...a };
    for (const k of Object.keys(b)) out[k] = merge(a?.[k], b[k]);
    return out;
  };
  return merge(base, over);
}
