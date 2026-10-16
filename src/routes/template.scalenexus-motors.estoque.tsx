import { createFileRoute } from "@tanstack/react-router";
import { MotorsStock } from "@/components/templates/scalenexus-motors/MotorsSite";
import { MOTORS_DEFAULT_CONTENT } from "@/lib/templates/scalenexus-motors/content";
import { motorsHead } from "@/lib/templates/scalenexus-motors/head";

type Search = { brand?: string | undefined; type?: string | undefined; priceMax?: number | undefined };

export const Route = createFileRoute("/template/scalenexus-motors/estoque")({
  validateSearch: (s: Record<string, unknown>): Search => ({
    brand: typeof s["brand"] === "string" && s["brand"] ? s["brand"] : undefined,
    type: typeof s["type"] === "string" && s["type"] ? s["type"] : undefined,
    priceMax: Number(s["priceMax"]) > 0 ? Number(s["priceMax"]) : undefined,
  }),
  head: () => motorsHead("Estoque de veículos — ScaleNexus Motors", "Estoque com filtros por marca, modelo, tipo, ano, preço, quilometragem, combustível e câmbio."),
  component: StockPage,
});

function StockPage() {
  const search = Route.useSearch();
  return <MotorsStock content={MOTORS_DEFAULT_CONTENT} initial={search} />;
}
