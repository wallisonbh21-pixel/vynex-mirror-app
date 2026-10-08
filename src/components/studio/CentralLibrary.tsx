import { useState } from "react";
import { CheckCircle2, Eye, Lock } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import type { StudioData } from "@/types/studio";
import {
  getLibraryItem, isTemplateLocked, useProjectTemplate, useSelectProjectTemplate, useTemplateLibrary, type LibraryModel,
} from "@/lib/templates/library";

export function CentralLibrary({ projectId, onApplyTemplate, hasContent }: {
  projectId: string; onApplyTemplate: (d: StudioData) => void; hasContent: boolean;
}) {
  const { data: models = [] } = useTemplateLibrary();
  const { data: project } = useProjectTemplate(projectId);
  const select = useSelectProjectTemplate(projectId);
  const [pending, setPending] = useState<LibraryModel | null>(null);
  const locked = isTemplateLocked(project?.status);
  const current = getLibraryItem(project?.template_id);
  const available = models.filter(
    (m) => (m.settings.status === "ativo" && m.settings.available_for_creators) || m.id === project?.template_id,
  );

  const confirm = (m: LibraryModel) => {
    select.mutate(m.id, {
      onSuccess: () => { onApplyTemplate(structuredClone(m.item.structure as StudioData)); toast.success(`Modelo "${m.name}" associado ao projeto`); },
      onError: (e) => toast.error(e.message),
    });
    setPending(null);
  };

  return (
    <div className="mb-6 space-y-3">
      <div className="rounded-lg border border-slate-800 bg-slate-900 p-3 text-[11px]">
        <p className="font-bold uppercase tracking-widest text-slate-500">Modelo do projeto</p>
        <p className="mt-1 text-slate-200">{current ? current.name : "Não definido"}</p>
        {locked && (
          <p className="mt-2 flex items-start gap-1.5 text-amber-400">
            <Lock className="mt-0.5 size-3 shrink-0" />
            <span><b>Modelo bloqueado.</b> Este projeto já iniciou a produção. O modelo não pode mais ser alterado.</span>
          </p>
        )}
      </div>
      <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-600">Biblioteca ScaleNexus</h4>
      {available.map((m) => {
        const isCurrent = m.id === project?.template_id;
        return (
          <div key={m.id} className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900">
            <p className="px-3 pt-2 text-[10px] font-bold uppercase text-primary">{m.category}</p>
            <img src={m.preview} alt={m.name} className="mt-2 aspect-[16/10] w-full object-cover" />
            <div className="space-y-2 p-3">
              <p className="text-xs font-bold text-slate-200">{m.name}</p>
              <p className="text-[10px] leading-tight text-slate-500">{m.description}</p>
              <div className="flex gap-2">
                <Button asChild size="sm" variant="secondary" className="h-7 flex-1 gap-1 text-[11px]">
                  <a href={m.previewRoute} target="_blank" rel="noreferrer"><Eye className="size-3" /> Visualizar</a>
                </Button>
                <Button size="sm" className="h-7 flex-1 gap-1 text-[11px]" disabled={locked || isCurrent || select.isPending}
                  onClick={() => (hasContent ? setPending(m) : confirm(m))}>
                  {locked ? <Lock className="size-3" /> : <CheckCircle2 className="size-3" />}
                  {isCurrent ? "Em uso" : "Usar modelo"}
                </Button>
              </div>
            </div>
          </div>
        );
      })}
      <Dialog open={!!pending} onOpenChange={(o) => !o && setPending(null)}>
        <DialogContent className="border-slate-800 bg-slate-900 text-white">
          <DialogHeader>
            <DialogTitle>Usar este modelo?</DialogTitle>
            <DialogDescription className="text-slate-400">
              O modelo será associado ao projeto e substituirá o conteúdo atual do canvas.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="ghost" onClick={() => setPending(null)}>Cancelar</Button>
            <Button variant="destructive" onClick={() => pending && confirm(pending)}>Usar modelo</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <h4 className="pt-2 text-[10px] font-bold uppercase tracking-widest text-slate-600">Outros templates</h4>
    </div>
  );
}
