import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { useClientePortalData } from "@/lib/client";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ImageOff } from "lucide-react";
import { VisualCentral } from "@/components/visual/VisualCentral";

export const Route = createFileRoute("/_authenticated/cliente/central-visual")({
  component: ClientVisualCenter,
  head: () => ({
    meta: [
      { title: "Central Visual do Projeto | ScaleNexus" },
      {
        name: "description",
        content: "Acompanhe e aprove as imagens criadas para os seus projetos no portal ScaleNexus.",
      },
      { property: "og:title", content: "Central Visual do Projeto | ScaleNexus" },
      {
        property: "og:description",
        content: "Acompanhe e aprove as imagens criadas para os seus projetos no portal ScaleNexus.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});

function ClientVisualCenter() {
  const { data: clientData, isLoading } = useClientePortalData();
  const projects = (clientData?.projects ?? []).map((p: any) => ({ id: p.id, title: p.title }));

  if (isLoading) {
    return (
      <AppShell title="Central Visual">
        <Skeleton className="h-72 w-full rounded-2xl" />
      </AppShell>
    );
  }

  if (projects.length === 0) {
    return (
      <AppShell title="Central Visual">
        <Card className="border-dashed p-12 text-center">
          <ImageOff className="mx-auto mb-4 size-12 text-muted-foreground/20" />
          <p className="text-muted-foreground">Nenhum projeto encontrado para exibir imagens.</p>
        </Card>
      </AppShell>
    );
  }

  return (
    <AppShell title="Central Visual">
      <div className="space-y-6">
        <div className="flex flex-col gap-2">
          <h2 className="text-2xl font-bold">Central Visual</h2>
          <p className="text-muted-foreground">
            Veja as imagens criadas para os seus projetos, as versões e o que já foi aprovado.
          </p>
        </div>
        <VisualCentral projects={projects} canGenerate={false} canDelete={false} />
      </div>
    </AppShell>
  );
}
