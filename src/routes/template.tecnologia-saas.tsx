import { createFileRoute } from "@tanstack/react-router";
import { TecnologiaSaasSite } from "@/components/templates/tecnologia-saas/TecnologiaSaasSite";
import { TECNOLOGIA_SAAS_DEFAULT_CONTENT } from "@/lib/templates/tecnologia-saas/content";

const c = TECNOLOGIA_SAAS_DEFAULT_CONTENT;

export const Route = createFileRoute("/template/tecnologia-saas")({
  head: () => ({
    meta: [
      { title: "Tecnologia & SaaS Premium — Modelo de site ScaleNexus" },
      { name: "description", content: "Template 03 da ScaleNexus: site completo para empresas de tecnologia, SaaS, plataformas digitais e softwares B2B." },
      { property: "og:title", content: "Tecnologia & SaaS Premium — Modelo de site ScaleNexus" },
      { property: "og:description", content: "Produto em destaque, recursos, integrações, segurança, planos e FAQ em um site SaaS premium." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600&family=Manrope:wght@400;500;600&display=swap" },
    ],
  }),
  component: () => <TecnologiaSaasSite content={c} />,
});
