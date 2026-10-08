import { createFileRoute } from "@tanstack/react-router";
import { Eye, Star } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { requireAdmin } from "@/lib/guard";
import { useTemplateLibrary, useUpdateTemplateSettings, type LibraryModel, type TemplateSettings } from "@/lib/templates/library";

export const Route = createFileRoute("/_authenticated/admin/modelos")({
  beforeLoad: () => requireAdmin(),
  head: () => ({ meta: [{ title: "Biblioteca de modelos — ScaleNexus" }] }),
  component: ModelosAdmin,
});

function ModelosAdmin() {
  const { data = [], isLoading } = useTemplateLibrary();
  return (
    <AppShell title="Biblioteca de modelos" description="Catálogo central de modelos de sites usado pelo Studio.">
      {isLoading ? (
        <p className="text-sm text-muted-foreground">Carregando…</p>
      ) : (
        <div className="grid gap-4">
          {data.map((m) => <ModelRow key={m.id} m={m} />)}
        </div>
      )}
    </AppShell>
  );
}

function ModelRow({ m }: { m: LibraryModel }) {
  const update = useUpdateTemplateSettings();
  const save = (patch: Partial<TemplateSettings>) =>
    update.mutate({ ...m.settings, ...patch }, {
      onSuccess: () => toast.success("Modelo atualizado"),
      onError: (e) => toast.error(e.message),
    });
  const active = m.settings.status === "ativo";
  return (
    <div className="premium-card flex flex-col gap-4 p-4 md:flex-row" data-testid={`model-${m.id}`}>
      <img src={m.preview} alt={m.name} className="h-32 w-full rounded-lg object-cover md:w-52" />
      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-mono text-muted-foreground">#{m.settings.display_order}</span>
          <h3 className="font-semibold">{m.name}</h3>
          {m.settings.featured && <Star className="size-4 fill-warning text-warning" />}
          <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${active ? "bg-success/15 text-success" : "bg-muted text-muted-foreground"}`}>
            {active ? "Ativo" : "Inativo"}
          </span>
        </div>
        <p className="text-xs text-muted-foreground">{m.category} · <span className="font-mono">{m.id}</span></p>
        <p className="text-sm text-muted-foreground">{m.description}</p>
        <p className="text-xs text-muted-foreground">Prévia: {m.previewRoute}</p>
      </div>
      <div className="grid shrink-0 grid-cols-2 gap-x-4 gap-y-2 text-xs md:w-72">
        <label className="flex items-center justify-between gap-2">Ativo
          <Switch checked={active} disabled={update.isPending} onCheckedChange={(v) => save({ status: v ? "ativo" : "inativo" })} /></label>
        <label className="flex items-center justify-between gap-2">Destaque
          <Switch checked={m.settings.featured} disabled={update.isPending} onCheckedChange={(v) => save({ featured: v })} /></label>
        <label className="flex items-center justify-between gap-2">Criadores
          <Switch checked={m.settings.available_for_creators} disabled={update.isPending} onCheckedChange={(v) => save({ available_for_creators: v })} /></label>
        <label className="flex items-center justify-between gap-2">Clientes
          <Switch checked={m.settings.available_for_clients} disabled={update.isPending} onCheckedChange={(v) => save({ available_for_clients: v })} /></label>
        <label className="col-span-2 flex items-center justify-between gap-2">Ordem
          <Input type="number" min={1} max={9999} defaultValue={m.settings.display_order} className="h-8 w-24"
            onBlur={(e) => { const n = Number(e.target.value); if (n >= 1 && n !== m.settings.display_order) save({ display_order: n }); }} /></label>
        <Button asChild size="sm" variant="outline" className="col-span-2 gap-2">
          <a href={m.previewRoute} target="_blank" rel="noreferrer"><Eye className="size-3" /> Visualizar modelo</a>
        </Button>
      </div>
    </div>
  );
}
