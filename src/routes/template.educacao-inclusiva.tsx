import { createFileRoute } from "@tanstack/react-router";
import { EducacaoInclusivaSite } from "@/components/templates/educacao-inclusiva/EducacaoInclusivaSite";
import { EDUCACAO_DEFAULT_CONTENT } from "@/lib/templates/educacao-inclusiva/content";

const c = EDUCACAO_DEFAULT_CONTENT;

export const Route = createFileRoute("/template/educacao-inclusiva")({
  head: () => ({
    meta: [
      { title: "Educação Inclusiva & Apoio Educacional — Modelo de site ScaleNexus" },
      { name: "description", content: "Template 04 da ScaleNexus: site acolhedor para professoras e profissionais de apoio educacional e educação inclusiva." },
      { property: "og:title", content: "Educação Inclusiva & Apoio Educacional — Modelo de site ScaleNexus" },
      { property: "og:description", content: "Acompanhamento individualizado, parceria com a família e a escola, em um site sensível e profissional." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600&family=Nunito+Sans:wght@400;600;700&display=swap" },
    ],
  }),
  component: () => <EducacaoInclusivaSite content={c} />,
});
