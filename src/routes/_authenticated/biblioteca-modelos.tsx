import { createFileRoute } from "@tanstack/react-router";
import { Eye, Star } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { requireCriadorOuAdmin } from "@/lib/guard";
import { useTemplateLibrary } from "@/lib/templates/library";

export const Route = createFileRoute("/_authenticated/biblioteca-modelos")({
  beforeLoad: () => requireCriadorOuAdmin(),
  head: () => ({
    meta: [
      { title: "Modelos de sites — ScaleNexus" },
      { name: "description", content: "Modelos de sites disponíveis para o Criador usar nos projetos." },
    ],
  }),
  component: BibliotecaCriador,
});

/** Visualização somente leitura da biblioteca central (mesma fonte do Admin e do Studio). */
function BibliotecaCriador() {
  const { data = [], isLoading } = useTemplateLibrary();
  const models = data
    .filter((m) => m.settings.status === "ativo" && m.settings.available_for_creators)
    .sort((a, b) => a.settings.display_order - b.settings.display_order);

  return (
    <AppShell title="Modelos de sites" description="Veja os modelos disponíveis. Para usar um modelo, abra o Studio do projeto e vá em Templates.">
      {isLoading ? (
        <p className="text-sm text-muted-foreground">Carregando…</p>
      ) : models.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nenhum modelo disponível no momento.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {models.map((m) => (
            <div key={m.id} className="premium-card flex flex-col overflow-hidden" data-testid={`model-${m.id}`}>
              <img src={m.preview} alt={m.name} className="aspect-[16/10] w-full object-cover" />
              <div className="flex flex-1 flex-col gap-2 p-4">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold">{m.name}</h3>
                  {m.settings.featured && <Star className="size-4 fill-warning text-warning" />}
                </div>
                <p className="text-xs text-muted-foreground">{m.category}</p>
                <p className="flex-1 text-sm text-muted-foreground">{m.description}</p>
                <Button asChild size="sm" variant="outline" className="gap-2">
                  <a href={m.previewRoute} target="_blank" rel="noreferrer"><Eye className="size-3" /> Ver prévia</a>
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </AppShell>
  );
}
