/**
 * TEMPLATE 01 — IMOBILIÁRIA PREMIUM
 *
 * Conteúdo (dados do projeto) separado da estrutura visual.
 * O NexusBuild deve substituir apenas este objeto (via `mergeImobiliariaContent`)
 * para gerar o site de um cliente — a estrutura visual não é reconstruída.
 * Todo conteúdo abaixo é DEMONSTRATIVO.
 */

export const IMOBILIARIA_TEMPLATE_ID = "tpl-imobiliaria-premium";
export const IMOBILIARIA_TEMPLATE_VERSION = 1;

export type ImobiliariaSectionKey =
  | "navbar" | "hero" | "search" | "featured" | "types" | "developments"
  | "differentials" | "about" | "testimonials" | "cta" | "footer";

export type Property = {
  id: string; title: string; price: string; location: string; type: string; deal: "comprar" | "alugar";
  bedrooms: number; bathrooms: number; parking: number; area: number; image: string; tag?: string;
};
export type Development = { id: string; name: string; status: string; location: string; priceRange: string; image: string; ctaLabel: string };
export type PropertyCategory = { id: string; label: string; count: string; image: string };
export type Differential = { id: string; icon: "user" | "search" | "map" | "shield"; title: string; text: string };
export type Testimonial = { id: string; name: string; location: string; text: string; avatar: string };
export type Stat = { value: number; prefix?: string; suffix?: string; label: string };

export type ImobiliariaContent = {
  brand: { name: string; logoUrl?: string; tagline: string };
  theme: { background: string; surface: string; text: string; muted: string; accent: string; accentText: string; headingFont: string; bodyFont: string };
  contact: { city: string; address: string; phone: string; whatsapp: string; email: string; hours: string };
  nav: { items: { label: string; target: ImobiliariaSectionKey }[]; ctaLabel: string };
  hero: { eyebrow: string; title: string; text: string; primaryCta: string; secondaryCta: string; image: string };
  search: { dealOptions: string[]; typeOptions: string[]; priceOptions: string[]; cityPlaceholder: string; buttonLabel: string };
  featured: { title: string; subtitle: string; properties: Property[] };
  types: { title: string; subtitle: string; categories: PropertyCategory[] };
  developments: { title: string; subtitle: string; items: Development[] };
  differentials: { title: string; subtitle: string; items: Differential[] };
  about: { eyebrow: string; title: string; paragraphs: string[]; image: string; secondaryImage: string; stats: Stat[]; disclaimer: string };
  testimonials: { title: string; subtitle: string; items: Testimonial[]; disclaimer: string };
  cta: { title: string; text: string; buttonLabel: string; image: string };
  footer: { description: string; columns: { title: string; links: string[] }[]; socials: string[]; legal: string };
  /** Ordem das seções — permite reorganização futura. */
  sections: ImobiliariaSectionKey[];
};

const u = (id: string, w = 1600) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=75`;

export const IMOBILIARIA_DEFAULT_CONTENT: ImobiliariaContent = {
  brand: { name: "Prime Residence", tagline: "Imóveis de alto padrão" },
  theme: {
    background: "#0e0d0b", surface: "#171511", text: "#f4efe6", muted: "#a59d8f",
    accent: "#c8a467", accentText: "#14110c", headingFont: "Jost", bodyFont: "Manrope",
  },
  contact: {
    city: "Belo Horizonte — MG", address: "Av. do Contorno, 0000 — Lourdes, Belo Horizonte — MG",
    phone: "(31) 0000-0000", whatsapp: "(31) 90000-0000", email: "contato@primeresidence.com.br",
    hours: "Seg a sex, 9h às 18h · Sáb, 9h às 13h",
  },
  nav: {
    items: [
      { label: "Início", target: "hero" }, { label: "Imóveis", target: "featured" },
      { label: "Bairros", target: "types" }, { label: "Empreendimentos", target: "developments" },
      { label: "Sobre", target: "about" }, { label: "Contato", target: "footer" },
    ],
    ctaLabel: "Fale conosco",
  },
  hero: {
    eyebrow: "Imóveis exclusivos",
    title: "Encontre o imóvel que combina com sua história.",
    text: "Casas, apartamentos e imóveis exclusivos nos melhores endereços.",
    primaryCta: "Encontrar meu imóvel", secondaryCta: "Conhecer empreendimentos",
    image: u("photo-1613490493576-7fde63acd811", 2200),
  },
  search: {
    dealOptions: ["Comprar", "Alugar"],
    typeOptions: ["Todos os tipos", "Casa", "Apartamento", "Cobertura", "Condomínio", "Comercial"],
    priceOptions: ["Qualquer valor", "Até R$ 1 milhão", "R$ 1 a 2 milhões", "Acima de R$ 2 milhões"],
    cityPlaceholder: "Cidade ou bairro", buttonLabel: "Buscar imóvel",
  },
  featured: {
    title: "Imóveis selecionados para você",
    subtitle: "Encontre espaços que combinam com seu estilo de vida.",
    properties: [
      { id: "p1", title: "Casa Alto Padrão", price: "R$ 1.850.000", location: "Nova Lima — MG", type: "Casa", deal: "comprar", bedrooms: 4, bathrooms: 5, parking: 4, area: 420, image: u("photo-1600596542815-ffad4c1539a9", 1000), tag: "Exclusivo" },
      { id: "p2", title: "Apartamento Vista Parque", price: "R$ 890.000", location: "Belo Horizonte — MG", type: "Apartamento", deal: "comprar", bedrooms: 3, bathrooms: 2, parking: 2, area: 128, image: u("photo-1600607687939-ce8a6c25118c", 1000), tag: "Novo" },
      { id: "p3", title: "Casa Contemporânea", price: "R$ 2.400.000", location: "Lagoa Santa — MG", type: "Casa", deal: "comprar", bedrooms: 5, bathrooms: 6, parking: 4, area: 560, image: u("photo-1600585154340-be6161a56a0c", 1000) },
      { id: "p4", title: "Cobertura Duplex Lourdes", price: "R$ 3.100.000", location: "Belo Horizonte — MG", type: "Cobertura", deal: "comprar", bedrooms: 4, bathrooms: 4, parking: 3, area: 310, image: u("photo-1600566753190-17f0baa2a6c3", 1000), tag: "Vista panorâmica" },
      { id: "p5", title: "Casa em Condomínio", price: "R$ 1.290.000", location: "Nova Lima — MG", type: "Condomínio", deal: "comprar", bedrooms: 3, bathrooms: 4, parking: 2, area: 280, image: u("photo-1605276374104-dee2a0ed3cd6", 1000) },
      { id: "p6", title: "Apartamento Mobiliado", price: "R$ 6.500/mês", location: "Belo Horizonte — MG", type: "Apartamento", deal: "alugar", bedrooms: 2, bathrooms: 2, parking: 1, area: 84, image: u("photo-1600210492486-724fe5c67fb0", 1000) },
    ],
  },
  types: {
    title: "Encontre o espaço ideal",
    subtitle: "Categorias pensadas para cada momento da sua vida.",
    categories: [
      { id: "c1", label: "Casas", count: "128 imóveis", image: u("photo-1564013799919-ab600027ffc6", 900) },
      { id: "c2", label: "Apartamentos", count: "214 imóveis", image: u("photo-1545324418-cc1a3fa10c00", 900) },
      { id: "c3", label: "Coberturas", count: "36 imóveis", image: u("photo-1512917774080-9991f1c4c750", 900) },
      { id: "c4", label: "Condomínios", count: "72 imóveis", image: u("photo-1580587771525-78b9dba3b914", 900) },
      { id: "c5", label: "Lançamentos", count: "9 projetos", image: u("photo-1486406146926-c627a92ad1ab", 900) },
      { id: "c6", label: "Comerciais", count: "41 imóveis", image: u("photo-1497366216548-37526070297c", 900) },
    ],
  },
  developments: {
    title: "Novos empreendimentos",
    subtitle: "Projetos assinados, em localizações que valorizam com o tempo.",
    items: [
      { id: "d1", name: "Reserva das Montanhas", status: "Lançamento", location: "Nova Lima — MG", priceRange: "A partir de R$ 1.200.000", image: u("photo-1600047509807-ba8f99d2cdde", 1400), ctaLabel: "Conhecer empreendimento" },
      { id: "d2", name: "Terraço Savassi", status: "Em obras", location: "Belo Horizonte — MG", priceRange: "R$ 780.000 a R$ 1.650.000", image: u("photo-1460317442991-0ec209397118", 1400), ctaLabel: "Conhecer empreendimento" },
    ],
  },
  differentials: {
    title: "Mais do que imóveis. Novas possibilidades.",
    subtitle: "Cuidamos de cada etapa para que a escolha seja leve e segura.",
    items: [
      { id: "f1", icon: "user", title: "Atendimento personalizado", text: "Um consultor dedicado entende o seu momento e acompanha cada visita." },
      { id: "f2", icon: "search", title: "Curadoria de imóveis", text: "Selecionamos apenas imóveis avaliados, documentados e alinhados ao seu perfil." },
      { id: "f3", icon: "map", title: "Especialistas da região", text: "Conhecemos cada bairro, condomínio e tendência de valorização local." },
      { id: "f4", icon: "shield", title: "Negociação segura", text: "Assessoria jurídica e documental do primeiro contato até as chaves." },
    ],
  },
  about: {
    eyebrow: "Sobre a Prime Residence",
    title: "Experiência para encontrar o lugar certo.",
    paragraphs: [
      "Somos uma imobiliária boutique dedicada a imóveis de alto padrão. Acreditamos que cada endereço guarda uma história — e que encontrar o lugar certo exige escuta, conhecimento e cuidado.",
      "Nossa equipe combina conhecimento de mercado com atendimento próximo para apresentar opções que fazem sentido de verdade para você e sua família.",
    ],
    image: u("photo-1600607687644-c7171b42498f", 1200),
    secondaryImage: u("photo-1600566753086-00f18fb6b3ea", 800),
    stats: [
      { value: 15, prefix: "+", label: "anos de experiência" },
      { value: 500, prefix: "+", label: "imóveis negociados" },
      { value: 98, prefix: "+", suffix: "%", label: "de clientes satisfeitos" },
    ],
    disclaimer: "Números demonstrativos do modelo — serão substituídos pelos dados reais da empresa.",
  },
  testimonials: {
    title: "O que nossos clientes dizem",
    subtitle: "Histórias de quem encontrou o novo endereço com a gente.",
    disclaimer: "Depoimentos demonstrativos do modelo — serão substituídos por relatos reais de clientes.",
    items: [
      { id: "t1", name: "Mariana A.", location: "Nova Lima — MG", text: "Atendimento atencioso do início ao fim. Visitamos apenas imóveis que realmente faziam sentido para a nossa família.", avatar: u("photo-1494790108377-be9c29b29330", 200) },
      { id: "t2", name: "Ricardo M.", location: "Belo Horizonte — MG", text: "A negociação foi transparente e segura. Recebi todo o suporte com a documentação e fechei com tranquilidade.", avatar: u("photo-1507003211169-0a1dd7228f2d", 200) },
      { id: "t3", name: "Fernanda e Paulo", location: "Lagoa Santa — MG", text: "Conheciam cada detalhe da região. Encontramos a casa dos nossos sonhos em poucas semanas.", avatar: u("photo-1438761681033-6461ffad8d80", 200) },
    ],
  },
  cta: {
    title: "Seu próximo endereço pode estar aqui.",
    text: "Conte o que você procura e nossa equipe encontra as melhores opções para você.",
    buttonLabel: "Encontrar meu imóvel",
    image: u("photo-1600585154526-990dced4db0d", 2000),
  },
  footer: {
    description: "Imobiliária boutique especializada em imóveis de alto padrão e novos empreendimentos.",
    columns: [
      { title: "Imóveis", links: ["Casas", "Apartamentos", "Coberturas", "Lançamentos"] },
      { title: "Empresa", links: ["Sobre nós", "Empreendimentos", "Trabalhe conosco", "Anuncie seu imóvel"] },
      { title: "Atendimento", links: ["Fale conosco", "Agendar visita", "Perguntas frequentes", "Política de privacidade"] },
    ],
    socials: ["Instagram", "Facebook", "LinkedIn", "YouTube"],
    legal: "Conteúdo demonstrativo — Template Imobiliária Premium · ScaleNexus",
  },
  sections: ["navbar", "hero", "search", "featured", "types", "developments", "differentials", "about", "testimonials", "cta", "footer"],
};

type DeepPartial<T> = { [K in keyof T]?: T[K] extends (infer U)[] ? U[] : T[K] extends object ? DeepPartial<T[K]> : T[K] };

/** Mescla os dados de um projeto sobre o conteúdo padrão (arrays substituem por inteiro). */
export function mergeImobiliariaContent(overrides: DeepPartial<ImobiliariaContent> = {}): ImobiliariaContent {
  const merge = (base: any, over: any): any => {
    if (over === undefined) return base;
    if (Array.isArray(base) || typeof base !== "object" || base === null) return over;
    const out: any = { ...base };
    for (const k of Object.keys(over)) out[k] = merge(base[k], over[k]);
    return out;
  };
  return merge(IMOBILIARIA_DEFAULT_CONTENT, overrides);
}
