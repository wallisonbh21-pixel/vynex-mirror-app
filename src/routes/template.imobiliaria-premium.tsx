import { createFileRoute } from "@tanstack/react-router";
import { ImobiliariaPremiumSite } from "@/components/templates/imobiliaria-premium/ImobiliariaPremiumSite";
import { IMOBILIARIA_DEFAULT_CONTENT } from "@/lib/templates/imobiliaria-premium/content";

const c = IMOBILIARIA_DEFAULT_CONTENT;

export const Route = createFileRoute("/template/imobiliaria-premium")({
  head: () => ({
    meta: [
      { title: "Imobiliária Premium — Modelo de site ScaleNexus" },
      { name: "description", content: "Template 01 da ScaleNexus: site completo para imobiliárias, corretores e empreendimentos de alto padrão." },
      { property: "og:title", content: "Imobiliária Premium — Modelo de site ScaleNexus" },
      { property: "og:description", content: "Busca de imóveis, destaques, empreendimentos e atendimento em um site imobiliário premium." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:image", content: c.hero.image },
      { name: "twitter:image", content: c.hero.image },
    ],
    links: [
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Jost:wght@300;400;500&family=Manrope:wght@400;500;600&display=swap" },
    ],
  }),
  component: () => <ImobiliariaPremiumSite content={c} />,
});
