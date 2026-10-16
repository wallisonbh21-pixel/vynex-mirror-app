import { createFileRoute } from "@tanstack/react-router";
import { MotorsHome } from "@/components/templates/scalenexus-motors/MotorsSite";
import { MOTORS_DEFAULT_CONTENT } from "@/lib/templates/scalenexus-motors/content";
import { motorsHead } from "@/lib/templates/scalenexus-motors/head";

export const Route = createFileRoute("/template/scalenexus-motors/")({
  head: () => motorsHead("ScaleNexus Motors — Modelo de site para concessionárias", "Template 06 da ScaleNexus: site premium para concessionárias, revendas de carros e lojas de motos, com estoque e filtros."),
  component: () => <MotorsHome content={MOTORS_DEFAULT_CONTENT} />,
});
