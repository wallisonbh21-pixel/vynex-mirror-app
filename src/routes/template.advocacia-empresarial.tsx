import { createFileRoute } from "@tanstack/react-router";
import { AdvocaciaEmpresarialSite } from "@/components/templates/advocacia-empresarial/AdvocaciaEmpresarialSite";
import { ADVOCACIA_DEFAULT_CONTENT } from "@/lib/templates/advocacia-empresarial/content";

const c = ADVOCACIA_DEFAULT_CONTENT;

export const Route = createFileRoute("/template/advocacia-empresarial")({
  head: () => ({
    meta: [
      { title: "Advocacia Empresarial Premium — Modelo de site ScaleNexus" },
      { name: "description", content: "Template 05 da ScaleNexus: site sóbrio e completo para escritórios de advocacia empresarial." },
      { property: "og:title", content: "Advocacia Empresarial Premium — Modelo de site ScaleNexus" },
      { property: "og:description", content: "Áreas de atuação, metodologia, equipe, conteúdos jurídicos e contato em um site institucional premium." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500;600;700&family=Manrope:wght@400;500;600;700&display=swap" },
    ],
  }),
  component: () => <AdvocaciaEmpresarialSite content={c} />,
});
