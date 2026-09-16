import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { AppShell } from "@/components/AppShell";
import { Skeleton } from "@/components/ui/skeleton";
import { VisualCentral } from "@/components/visual/VisualCentral";
import { listDocumentProjects } from "@/lib/documents.functions";

export const Route = createFileRoute("/_authenticated/central-visual")({
  validateSearch: z.object({ projeto: z.string().uuid().optional() }),
  component: CentralVisualPage,
  head: () => ({
    meta: [
      { title: "Central Visual | ScaleNexus" },
      {
        name: "description",
        content: "Gere, versione e aprove as imagens dos seus projetos com a NexusBuild AI da ScaleNexus.",
      },
      { property: "og:title", content: "Central Visual | ScaleNexus" },
      {
        property: "og:description",
        content: "Gere, versione e aprove as imagens dos seus projetos com a NexusBuild AI da ScaleNexus.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});

function CentralVisualPage() {
  const { projeto } = Route.useSearch();
  const listProjects = useServerFn(listDocumentProjects);
  const { data, isLoading } = useQuery({
    queryKey: ["document-projects"],
    queryFn: () => listProjects(),
  });

  return (
    <AppShell title="Central Visual">
      <div className="space-y-6">
        <div className="flex flex-col gap-2">
          <h2 className="text-2xl font-bold">Central Visual</h2>
          <p className="text-muted-foreground">
            Imagens criadas pela NexusBuild AI, referências enviadas, versões e aprovações de cada projeto.
          </p>
        </div>
        {isLoading ? (
          <Skeleton className="h-72 w-full rounded-2xl" />
        ) : (
          <VisualCentral
            projects={data?.projects ?? []}
            initialProjectId={projeto}
            emptyHint="Você ainda não tem projetos com acesso à Central Visual."
          />
        )}
      </div>
    </AppShell>
  );
}
