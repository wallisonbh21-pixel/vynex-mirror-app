import { createFileRoute } from "@tanstack/react-router";
import { MotorsVehicle } from "@/components/templates/scalenexus-motors/MotorsSite";
import { findVehicle, MOTORS_DEFAULT_CONTENT, vehicleTitle } from "@/lib/templates/scalenexus-motors/content";
import { motorsHead } from "@/lib/templates/scalenexus-motors/head";

export const Route = createFileRoute("/template/scalenexus-motors/veiculo/$vehicleId")({
  head: ({ params }) => {
    const v = findVehicle(MOTORS_DEFAULT_CONTENT.vehicles, params.vehicleId);
    return v
      ? motorsHead(`${vehicleTitle(v)} ${v.year} — ScaleNexus Motors`, `${vehicleTitle(v)} ${v.version}: fotos, especificações e contato pelo WhatsApp.`)
      : { ...motorsHead("Veículo não encontrado — ScaleNexus Motors", "Este veículo não está disponível."), meta: [{ title: "Veículo não encontrado — ScaleNexus Motors" }, { name: "robots", content: "noindex" }] };
  },
  component: VehiclePage,
});

function VehiclePage() {
  const { vehicleId } = Route.useParams();
  return <MotorsVehicle content={MOTORS_DEFAULT_CONTENT} vehicleId={vehicleId} />;
}
