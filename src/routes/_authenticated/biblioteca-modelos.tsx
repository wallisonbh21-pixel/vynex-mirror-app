import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Eye, Globe, Loader2, PencilLine, Star } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { openTemplateProject } from "@/lib/templates/start-project";
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
  const navigate = useNavigate();
  const [opening, setOpening] = useState<string | null>(null);
  const openManual = async (id: string, publish: boolean) => {
    setOpening(id);
    try {
      const { projectId } = await openTemplateProject(id);
      await navigate({ to: "/studio/$projectId", params: { projectId }, search: publish ? { publicar: true } : {} });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Não foi possível abrir o modelo.");
    } finally {
      setOpening(null);
    }
  };
  const models = data
    .filter((m) => m.settings.status === "ativo" && m.settings.available_for_creators)
    .sort((a, b) => a.settings.display_order - b.settings.display_order);

  return (
    <AppShell title="Modelos de sites" description="Visualize, edite e publique um modelo oficial — sem depender da IA.">
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
                <div className="grid grid-cols-3 gap-2">
                  <Button asChild size="sm" variant="outline" className="gap-1">
                    <a href={m.previewRoute} target="_blank" rel="noreferrer"><Eye className="size-3" /> Visualizar</a>
                  </Button>
                  <Button size="sm" className="gap-1" disabled={opening !== null} onClick={() => openManual(m.id, false)}>
                    {opening === m.id ? <Loader2 className="size-3 animate-spin" /> : <PencilLine className="size-3" />} Editar site
                  </Button>
                  <Button size="sm" variant="secondary" className="gap-1" disabled={opening !== null} onClick={() => openManual(m.id, true)}>
                    <Globe className="size-3" /> Publicar site
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </AppShell>
  );
}
