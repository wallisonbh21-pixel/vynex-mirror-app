import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { useClientePortalData } from "@/lib/client";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { File } from "lucide-react";
import { DocumentManager } from "@/components/documents/DocumentManager";

export const Route = createFileRoute("/_authenticated/cliente/documentos")({
  component: MyDocuments,
  head: () => ({
    meta: [
      { title: "Documentos do Projeto | ScaleNexus" },
      {
        name: "description",
        content: "Envie, acompanhe e baixe os documentos dos seus projetos no portal ScaleNexus.",
      },
      { property: "og:title", content: "Documentos do Projeto | ScaleNexus" },
      {
        property: "og:description",
        content: "Envie, acompanhe e baixe os documentos dos seus projetos no portal ScaleNexus.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});

function MyDocuments() {
  const { data: clientData, isLoading } = useClientePortalData();
  const projects = (clientData?.projects ?? []).map((p: any) => ({ id: p.id, title: p.title }));

  if (isLoading) {
    return (
      <AppShell title="Documentos">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-48 w-full" />
          ))}
        </div>
      </AppShell>
    );
  }

  if (projects.length === 0) {
    return (
      <AppShell title="Documentos">
        <Card className="border-dashed p-12 text-center">
          <File className="mx-auto mb-4 size-12 text-muted-foreground/20" />
          <p className="text-muted-foreground">Nenhum projeto encontrado para listar documentos.</p>
        </Card>
      </AppShell>
    );
  }

  return (
    <AppShell title="Documentos">
      <div className="space-y-6">
        <div className="flex flex-col gap-2">
          <h2 className="text-2xl font-bold">Central de Documentos</h2>
          <p className="text-muted-foreground">
            Selecione um projeto para enviar, acompanhar e baixar os seus arquivos.
          </p>
        </div>
        <DocumentManager projects={projects} canDelete={false} />
      </div>
    </AppShell>
  );
}
