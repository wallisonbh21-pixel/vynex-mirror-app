import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { AppShell } from "@/components/AppShell";
import { Skeleton } from "@/components/ui/skeleton";
import { DocumentManager } from "@/components/documents/DocumentManager";
import { listDocumentProjects } from "@/lib/documents.functions";

export const Route = createFileRoute("/_authenticated/documentos")({
  component: TeamDocuments,
  head: () => ({
    meta: [
      { title: "Documentos dos Projetos | ScaleNexus" },
      {
        name: "description",
        content: "Gerencie os documentos dos projetos que você tem autorização para acessar na ScaleNexus.",
      },
      { property: "og:title", content: "Documentos dos Projetos | ScaleNexus" },
      {
        property: "og:description",
        content: "Gerencie os documentos dos projetos que você tem autorização para acessar na ScaleNexus.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});

function TeamDocuments() {
  const listProjects = useServerFn(listDocumentProjects);
  const { data, isLoading } = useQuery({
    queryKey: ["document-projects"],
    queryFn: () => listProjects(),
  });

  return (
    <AppShell title="Documentos">
      <div className="space-y-6">
        <div className="flex flex-col gap-2">
          <h2 className="text-2xl font-bold">Documentos dos Projetos</h2>
          <p className="text-muted-foreground">
            Envie e organize os arquivos dos projetos que você pode gerenciar.
          </p>
        </div>
        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-44 w-full" />
            ))}
          </div>
        ) : (
          <DocumentManager
            projects={data?.projects ?? []}
            canDelete
            emptyHint="Você ainda não tem projetos autorizados para gerenciar documentos."
          />
        )}
      </div>
    </AppShell>
  );
}
