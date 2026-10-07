/**
 * Catálogo oficial de modelos de sites do ScaleNexus (vitrine).
 *
 * Cada modelo tem identificação estável (`id`/`slug`) e uma estrutura de seções
 * (`structure`) pensada para ser conectada futuramente ao NexusBuild/Studio.
 * Nesta fase o catálogo só alimenta a vitrine — nenhuma criação automática.
 * Capacidade planejada: 20 modelos (MAX_SHOWCASE_MODELS).
 */

export const MAX_SHOWCASE_MODELS = 20;

export type ShowcaseSectionKind =
  | "header"
  | "hero"
  | "highlights"
  | "listing"
  | "product_grid"
  | "dashboard"
  | "gallery"
  | "menu"
  | "booking"
  | "testimonials"
  | "cta"
  | "footer";

export type ShowcaseModelStatus = "ativo" | "em_breve";

export type ShowcasePreviewKind =
  | "real_estate"
  | "ai_automation"
  | "saas"
  | "store"
  | "hotel"
  | "restaurant";

export type ShowcaseModel = {
  /** Identificador estável — usado futuramente pelo NexusBuild. */
  id: string;
  slug: string;
  name: string;
  description: string;
  category: string;
  status: ShowcaseModelStatus;
  /** Exibido entre os principais na página inicial. */
  featured: boolean;
  order: number;
  preview: ShowcasePreviewKind;
  palette: { background: string; surface: string; accent: string; text: string };
  /** Estrutura de seções do site (ordem de renderização futura). */
  structure: ShowcaseSectionKind[];
  /** Nome da marca fictícia exibida na prévia. */
  sampleBrand: string;
  heroImage: string;
};

const img = (id: string, w = 1200) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=75`;

export const SHOWCASE_MODELS: ShowcaseModel[] = [
  {
    id: "tpl-imobiliaria-premium",
    slug: "imobiliaria-premium",
    name: "Imobiliária Premium",
    description: "Experiência sofisticada para empresas do mercado imobiliário.",
    category: "Imóveis",
    status: "ativo",
    featured: true,
    order: 1,
    preview: "real_estate",
    palette: { background: "#0c0f14", surface: "#151a22", accent: "#c9a84c", text: "#f5f0e0" },
    structure: ["header", "hero", "listing", "highlights", "testimonials", "cta", "footer"],
    sampleBrand: "Prime Residence",
    heroImage: img("photo-1613490493576-7fde63acd811"),
  },
  {
    id: "tpl-ia-automacao",
    slug: "ia-automacao",
    name: "IA & Automação",
    description: "Presença futurista para empresas de inteligência artificial e automação.",
    category: "Tecnologia",
    status: "ativo",
    featured: true,
    order: 2,
    preview: "ai_automation",
    palette: { background: "#070712", surface: "#11112a", accent: "#8b5cf6", text: "#ede9fe" },
    structure: ["header", "hero", "highlights", "dashboard", "testimonials", "cta", "footer"],
    sampleBrand: "Neuralis",
    heroImage: img("photo-1677442136019-21780ecad995"),
  },
  {
    id: "tpl-tecnologia-saas",
    slug: "tecnologia-saas",
    name: "Tecnologia & SaaS",
    description: "Apresente seu produto digital com painéis, métricas e planos.",
    category: "Tecnologia",
    status: "ativo",
    featured: true,
    order: 3,
    preview: "saas",
    palette: { background: "#060b14", surface: "#0f172a", accent: "#22d3ee", text: "#e2e8f0" },
    structure: ["header", "hero", "dashboard", "highlights", "testimonials", "cta", "footer"],
    sampleBrand: "Fluxo",
    heroImage: img("photo-1551288049-bebda4e38f71"),
  },
  {
    id: "tpl-loja-premium",
    slug: "loja-premium",
    name: "Loja Premium",
    description: "Vitrine elegante com destaque de produtos, categorias e carrinho.",
    category: "Varejo",
    status: "ativo",
    featured: true,
    order: 4,
    preview: "store",
    palette: { background: "#f6f3ee", surface: "#ffffff", accent: "#111111", text: "#111111" },
    structure: ["header", "hero", "product_grid", "highlights", "cta", "footer"],
    sampleBrand: "Maison Lume",
    heroImage: img("photo-1490481651871-ab68de25d43d"),
  },
  {
    id: "tpl-hotel-resort",
    slug: "hotel-resort",
    name: "Hotel & Resort",
    description: "Imagens cinematográficas, quartos, experiências e reservas.",
    category: "Hotelaria",
    status: "ativo",
    featured: true,
    order: 5,
    preview: "hotel",
    palette: { background: "#0b1210", surface: "#13201c", accent: "#d6b47a", text: "#f3efe6" },
    structure: ["header", "hero", "booking", "gallery", "highlights", "cta", "footer"],
    sampleBrand: "Costa Serena",
    heroImage: img("photo-1566073771259-6a8506099945"),
  },
  {
    id: "tpl-restaurante-premium",
    slug: "restaurante-premium",
    name: "Restaurante Premium",
    description: "Gastronomia, ambiente, cardápio e reservas com visual sofisticado.",
    category: "Gastronomia",
    status: "ativo",
    featured: true,
    order: 6,
    preview: "restaurant",
    palette: { background: "#120c0a", surface: "#1d1411", accent: "#e0a46a", text: "#f7ede4" },
    structure: ["header", "hero", "menu", "gallery", "booking", "footer"],
    sampleBrand: "Brasa & Vinho",
    heroImage: img("photo-1414235077428-338989a2e8c0"),
  },
];

export const FEATURED_SHOWCASE_MODELS = SHOWCASE_MODELS
  .filter((m) => m.featured && m.status === "ativo")
  .sort((a, b) => a.order - b.order)
  .slice(0, 6);

export function getShowcaseModel(idOrSlug: string) {
  return SHOWCASE_MODELS.find((m) => m.id === idOrSlug || m.slug === idOrSlug);
}
