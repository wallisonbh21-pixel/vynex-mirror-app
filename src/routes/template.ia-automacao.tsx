import { createFileRoute } from "@tanstack/react-router";
import { IaAutomacaoSite } from "@/components/templates/ia-automacao/IaAutomacaoSite";
import { IA_AUTOMACAO_DEFAULT_CONTENT } from "@/lib/templates/ia-automacao/content";

const c = IA_AUTOMACAO_DEFAULT_CONTENT;

export const Route = createFileRoute("/template/ia-automacao")({
  head: () => ({
    meta: [
      { title: "IA & Automação Empresarial — Modelo de site ScaleNexus" },
      { name: "description", content: "Template 02 da ScaleNexus: site completo para empresas de inteligência artificial, agentes de IA e automação." },
      { property: "og:title", content: "IA & Automação Empresarial — Modelo de site ScaleNexus" },
      { property: "og:description", content: "Soluções, agentes de IA, fluxos de automação e integrações em um site tecnológico premium." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600&family=DM+Sans:wght@400;500;600&display=swap" },
    ],
  }),
  component: () => <IaAutomacaoSite content={c} />,
});
