import { createFileRoute } from "@tanstack/react-router";
import { MotorsContact } from "@/components/templates/scalenexus-motors/MotorsSite";
import { MOTORS_DEFAULT_CONTENT } from "@/lib/templates/scalenexus-motors/content";
import { motorsHead } from "@/lib/templates/scalenexus-motors/head";

export const Route = createFileRoute("/template/scalenexus-motors/contato")({
  validateSearch: (s: Record<string, unknown>): { tipo?: "contato" | "avaliacao" | undefined } => ({ tipo: s["tipo"] === "avaliacao" ? "avaliacao" : s["tipo"] === "contato" ? "contato" : undefined }),
  head: () => motorsHead("Contato e avaliação de usado — ScaleNexus Motors", "Fale com a loja ou solicite a avaliação do seu veículo usado."),
  component: ContactPage,
});

function ContactPage() {
  const { tipo } = Route.useSearch();
  return <MotorsContact content={MOTORS_DEFAULT_CONTENT} kind={tipo ?? "contato"} />;
}
