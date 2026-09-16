/** Núcleo visual (ATA #020) — regras compartilhadas entre interface e servidor. */

export const VISUAL_MODEL = "google/gemini-2.5-flash-image";
export const VISUAL_PROVIDER = "lovable-ai-gateway";

/** Limites de uso (preparados para virar cotas por plano no futuro). */
export const VISUAL_LIMITS = {
  perRequest: 2,
  perUserPerDay: 30,
  perProjectTotal: 300,
  maxPromptChars: 1200,
} as const;

export const VISUAL_PURPOSES = [
  "logo",
  "identidade_visual",
  "banner",
  "imagem_produto",
  "imagem_site",
  "ilustracao",
  "social_media",
  "conceito_visual",
  "variacao",
] as const;

export type VisualPurpose = (typeof VISUAL_PURPOSES)[number];

export const PURPOSE_LABEL: Record<string, string> = {
  logo: "Logo",
  identidade_visual: "Identidade visual",
  banner: "Banner",
  imagem_produto: "Imagem de produto",
  imagem_site: "Imagem para site",
  ilustracao: "Ilustração",
  social_media: "Social media",
  conceito_visual: "Conceito visual",
  variacao: "Variação",
  referencia: "Referência",
};

export const VISUAL_ASPECTS = ["1:1", "16:9", "4:3", "3:4", "9:16"] as const;
export type VisualAspect = (typeof VISUAL_ASPECTS)[number];

export const ASPECT_HINT: Record<string, string> = {
  "1:1": "formato quadrado (1:1)",
  "16:9": "formato panorâmico (16:9)",
  "4:3": "formato paisagem (4:3)",
  "3:4": "formato retrato (3:4)",
  "9:16": "formato vertical para redes sociais (9:16)",
};

export type VisualStatus = "gerada" | "em_analise" | "aprovada" | "rejeitada";

export const STATUS_LABEL: Record<string, string> = {
  gerada: "Gerada",
  em_analise: "Em análise",
  aprovada: "Aprovada",
  rejeitada: "Rejeitada",
};

/** Filtros da Central Visual. */
export const GALLERY_FILTERS = [
  { id: "todas", label: "Todas", purposes: [] as string[] },
  { id: "logos", label: "Logos", purposes: ["logo"] },
  { id: "banners", label: "Banners", purposes: ["banner"] },
  { id: "produtos", label: "Produtos", purposes: ["imagem_produto"] },
  { id: "identidade", label: "Identidade Visual", purposes: ["identidade_visual", "conceito_visual"] },
  { id: "referencias", label: "Referências", purposes: [] },
] as const;

export function purposeLabel(purpose: string): string {
  return PURPOSE_LABEL[purpose] ?? purpose;
}
