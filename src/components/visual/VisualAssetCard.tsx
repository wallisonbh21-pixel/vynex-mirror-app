import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import {
  Check,
  GalleryVerticalEnd,
  ImageOff,
  Layers,
  Loader2,
  Sparkles,
  Trash2,
  Wand2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { PURPOSE_LABEL, STATUS_LABEL } from "@/lib/visual/constants";
import {
  deleteVisualAsset,
  getVisualAssetUrl,
  setVisualAssetStatus,
  setVisualAssetUse,
} from "@/lib/visual.functions";

export interface VisualAsset {
  id: string;
  project_id: string;
  title?: string | null;
  purpose?: string | null;
  kind?: string | null;
  version?: number | null;
  status?: string | null;
  use_in_builder?: boolean | null;
  parent_asset_id?: string | null;
  prompt?: string | null;
  created_at?: string | null;
}

const STATUS_TONE: Record<string, string> = {
  gerada: "border-border bg-muted text-muted-foreground",
  em_analise: "border-amber-500/40 bg-amber-500/10 text-amber-500",
  aprovada: "border-emerald-500/40 bg-emerald-500/10 text-emerald-500",
  rejeitada: "border-destructive/40 bg-destructive/10 text-destructive",
};

/** Miniatura privada carregada por link temporário assinado. */
export function VisualAssetImage({ assetId, alt, className }: { assetId: string; alt: string; className?: string }) {
  const fetchUrl = useServerFn(getVisualAssetUrl);
  const [url, setUrl] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let active = true;
    setUrl(null);
    setFailed(false);
    fetchUrl({ data: { assetId } })
      .then((result) => {
        if (!active) return;
        if (result.ok) setUrl(result.url);
        else setFailed(true);
      })
      .catch(() => active && setFailed(true));
    return () => {
      active = false;
    };
  }, [assetId, fetchUrl]);

  if (failed) {
    return (
      <div className={cn("flex items-center justify-center bg-muted text-muted-foreground", className)}>
        <ImageOff className="size-5" />
      </div>
    );
  }
  if (!url) {
    return (
      <div className={cn("flex items-center justify-center bg-muted", className)}>
        <Loader2 className="size-5 animate-spin text-muted-foreground" />
      </div>
    );
  }
  return <img src={url} alt={alt} loading="lazy" className={cn("object-cover", className)} />;
}

interface Props {
  asset: VisualAsset;
  /** Pedir variação / nova versão a partir desta imagem. */
  onVariation?: (asset: VisualAsset) => void;
  /** Pedir uma imagem totalmente nova. */
  onNew?: (asset: VisualAsset) => void;
  showGalleryLink?: boolean;
  allowDelete?: boolean;
}

export function VisualAssetCard({ asset, onVariation, onNew, showGalleryLink = true, allowDelete = false }: Props) {
  const queryClient = useQueryClient();
  const approveFn = useServerFn(setVisualAssetStatus);
  const useFn = useServerFn(setVisualAssetUse);
  const deleteFn = useServerFn(deleteVisualAsset);

  const refresh = () => queryClient.invalidateQueries({ queryKey: ["visual-assets", asset.project_id] });

  const approve = useMutation({
    mutationFn: (status: "aprovada" | "em_analise" | "rejeitada") =>
      approveFn({ data: { assetId: asset.id, status } }),
    onSuccess: (result) => {
      if (!result.ok) return toast.error(result.error);
      toast.success("Status atualizado.");
      refresh();
    },
    onError: () => toast.error("Não foi possível atualizar o status."),
  });

  const useInProject = useMutation({
    mutationFn: (value: boolean) => useFn({ data: { assetId: asset.id, use: value } }),
    onSuccess: (result) => {
      if (!result.ok) return toast.error(result.error);
      toast.success("Imagem liberada para o projeto.");
      refresh();
    },
    onError: () => toast.error("Não foi possível liberar a imagem."),
  });

  const remove = useMutation({
    mutationFn: () => deleteFn({ data: { assetId: asset.id } }),
    onSuccess: (result) => {
      if (!result.ok) return toast.error(result.error);
      toast.success("Imagem excluída.");
      refresh();
    },
    onError: () => toast.error("Não foi possível excluir a imagem."),
  });

  const status = asset.status ?? "gerada";
  const isReference = asset.kind === "referencia";
  const busy = approve.isPending || useInProject.isPending || remove.isPending;

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card">
      <VisualAssetImage assetId={asset.id} alt={asset.title ?? "Imagem do projeto"} className="h-48 w-full" />

      <div className="space-y-3 p-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="truncate text-sm font-semibold text-foreground">{asset.title ?? "Imagem"}</span>
          <Badge variant="outline" className="text-[10px]">
            {PURPOSE_LABEL[asset.purpose ?? ""] ?? asset.purpose ?? "Imagem"}
          </Badge>
          {!isReference && (
            <Badge variant="outline" className="text-[10px]">
              v{asset.version ?? 1}
            </Badge>
          )}
          <Badge variant="outline" className={cn("text-[10px]", STATUS_TONE[status])}>
            {isReference ? "Referência" : (STATUS_LABEL[status] ?? status)}
          </Badge>
          {asset.use_in_builder && (
            <Badge variant="outline" className="border-primary/40 bg-primary/10 text-[10px] text-primary">
              No projeto
            </Badge>
          )}
        </div>

        {asset.parent_asset_id && (
          <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <Layers className="size-3" /> Nova versão de uma imagem anterior
          </p>
        )}

        {!isReference && (
          <div className="flex flex-wrap gap-2">
            {status !== "aprovada" && (
              <Button size="sm" disabled={busy} onClick={() => approve.mutate("aprovada")}>
                <Check className="size-3.5" /> Aprovar
              </Button>
            )}
            {onVariation && (
              <Button size="sm" variant="outline" disabled={busy} onClick={() => onVariation(asset)}>
                <Wand2 className="size-3.5" /> Criar variação
              </Button>
            )}
            {onNew && (
              <Button size="sm" variant="outline" disabled={busy} onClick={() => onNew(asset)}>
                <Sparkles className="size-3.5" /> Criar nova
              </Button>
            )}
            {status === "aprovada" && !asset.use_in_builder && (
              <Button size="sm" variant="outline" disabled={busy} onClick={() => useInProject.mutate(true)}>
                Usar no projeto
              </Button>
            )}
            {showGalleryLink && (
              <Button asChild size="sm" variant="ghost">
                <Link to="/central-visual" search={{ projeto: asset.project_id }}>
                  <GalleryVerticalEnd className="size-3.5" /> Ver galeria
                </Link>
              </Button>
            )}
            {allowDelete && (
              <Button
                size="sm"
                variant="ghost"
                className="text-destructive hover:text-destructive"
                disabled={busy}
                onClick={() => remove.mutate()}
              >
                <Trash2 className="size-3.5" />
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
