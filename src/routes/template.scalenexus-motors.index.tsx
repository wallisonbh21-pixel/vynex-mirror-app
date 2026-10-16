import { createFileRoute } from "@tanstack/react-router";
import { MotorsHome } from "@/components/templates/scalenexus-motors/MotorsSite";
import { MOTORS_DEFAULT_CONTENT } from "@/lib/templates/scalenexus-motors/content";

export const motorsHead = (title: string, description: string) => ({
  meta: [
    { title },
    { name: "description", content: description },
    { property: "og:title", content: title },
    { property: "og:description", content: description },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ],
  links: [
    { rel: "preconnect", href: "https://fonts.googleapis.com" },
    { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Sora:wght@600;700;800&family=Manrope:wght@400;500;600;700&display=swap" },
  ],
});

export const Route = createFileRoute("/template/scalenexus-motors/")({
  head: () => motorsHead("ScaleNexus Motors — Modelo de site para concessionárias", "Template 06 da ScaleNexus: site premium para concessionárias, revendas de carros e lojas de motos, com estoque e filtros."),
  component: () => <MotorsHome content={MOTORS_DEFAULT_CONTENT} />,
});
