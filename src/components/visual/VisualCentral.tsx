import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { ImagePlus, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import {
  GALLERY_FILTERS,
  PURPOSE_LABEL,
  VISUAL_ASPECTS,
  VISUAL_LIMITS,
  VISUAL_PURPOSES,
} from "@/lib/visual/constants";
import { generateVisualAsset, listVisualAssets } from "@/lib/visual.functions";
import { VisualAssetCard, type VisualAsset } from "./VisualAssetCard";

interface ProjectOption {
  id: string;
  title: string;
}

/**
 * Central Visual do projeto: geração, versões, aprovação e referências.
 * Todas as imagens continuam privadas; a exibição usa links temporários.
 */
export function VisualCentral({
  projects,
  initialProjectId,
  emptyHint,
  canGenerate = true,
  canDelete = true,
}: {
  projects: ProjectOption[];
  initialProjectId?: string | undefined;
  emptyHint?: string;
  canGenerate?: boolean;
  canDelete?: boolean;
}) {
  const queryClient = useQueryClient();
  const fetchAssets = useServerFn(listVisualAssets);
  const generate = useServerFn(generateVisualAsset);

  const [projectId, setProjectId] = useState<string>(initialProjectId ?? projects[0]?.id ?? "");
  const [filter, setFilter] = useState<string>("todas");
  const [prompt, setPrompt] = useState("");
  const [purpose, setPurpose] = useState<string>("imagem_site");
  const [aspect, setAspect] = useState<string>("1:1");
  const [parentAssetId, setParentAssetId] = useState<string | null>(null);

  useEffect(() => {
    if (!projectId && projects[0]) setProjectId(projects[0].id);
  }, [projects, projectId]);

  const { data, isLoading } = useQuery({
    queryKey: ["visual-assets", projectId],
    queryFn: () => fetchAssets({ data: { projectId } }),
    enabled: Boolean(projectId),
  });

  const assets = (data?.assets ?? []) as VisualAsset[];

  const visible = useMemo(() => {
    if (filter === "todas") return assets;
    if (filter === "referencias") return assets.filter((a) => a.kind === "referencia");
    const config = GALLERY_FILTERS.find((f) => f.id === filter);
    const purposes = (config?.purposes ?? []) as readonly string[];
    return assets.filter((a) => a.kind !== "referencia" && purposes.includes(a.purpose ?? ""));
  }, [assets, filter]);

  const run = useMutation({
    mutationFn: () =>
      generate({
        data: {
          projectId,
          prompt: prompt.trim(),
          purpose: purpose as (typeof VISUAL_PURPOSES)[number],
          aspect: aspect as (typeof VISUAL_ASPECTS)[number],
          count: 1,
          parentAssetId,
        },
      }),
    onSuccess: (result) => {
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success(parentAssetId ? "Nova versão criada." : "Imagem criada.");
      setPrompt("");
      setParentAssetId(null);
      queryClient.invalidateQueries({ queryKey: ["visual-assets", projectId] });
    },
    onError: () => toast.error("Não foi possível gerar a imagem agora."),
  });

  if (projects.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
        {emptyHint ?? "Nenhum projeto disponível."}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="w-full sm:max-w-sm">
          <Label className="mb-1.5 block text-xs uppercase text-muted-foreground">Projeto</Label>
          <Select value={projectId} onValueChange={setProjectId}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione um projeto" />
            </SelectTrigger>
            <SelectContent>
              {projects.map((project) => (
                <SelectItem key={project.id} value={project.id}>
                  {project.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className={cn("space-y-4 rounded-2xl border border-border bg-card p-5", !canGenerate && "hidden")}>
        <div className="flex items-center gap-2">
          <ImagePlus className="size-4 text-primary" />
          <h3 className="text-sm font-semibold">
            {parentAssetId ? "Criar nova versão" : "Criar imagem"}
          </h3>
          {parentAssetId && (
            <Button size="sm" variant="ghost" onClick={() => setParentAssetId(null)}>
              cancelar versão
            </Button>
          )}
        </div>

        <Textarea
          value={prompt}
          onChange={(event) => setPrompt(event.target.value.slice(0, VISUAL_LIMITS.maxPromptChars))}
          placeholder="Descreva a imagem: estilo, cores, elementos, clima e uso pretendido."
          rows={3}
        />

        <div className="flex flex-wrap gap-3">
          <Select value={purpose} onValueChange={setPurpose}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {VISUAL_PURPOSES.map((item) => (
                <SelectItem key={item} value={item}>
                  {PURPOSE_LABEL[item] ?? item}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={aspect} onValueChange={setAspect}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {VISUAL_ASPECTS.map((item) => (
                <SelectItem key={item} value={item}>
                  {item}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            onClick={() => run.mutate()}
            disabled={run.isPending || prompt.trim().length < 8 || !projectId}
          >
            {run.isPending ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
            {run.isPending ? "Gerando..." : "Gerar imagem"}
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {GALLERY_FILTERS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setFilter(item.id)}
            className={cn(
              "rounded-full border px-3 py-1.5 text-xs transition-colors",
              filter === item.id
                ? "border-primary/40 bg-primary/10 text-primary"
                : "border-border text-muted-foreground hover:text-foreground",
            )}
          >
            {item.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-72 w-full rounded-2xl" />
          ))}
        </div>
      ) : visible.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
          Nenhuma imagem nesta categoria ainda.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((asset) => (
            <VisualAssetCard
              key={asset.id}
              asset={asset}
              allowDelete={canDelete}
              showGalleryLink={false}
              {...(canGenerate
                ? {
                    onVariation: (item: VisualAsset) => {
                      setParentAssetId(item.id);
                      setPurpose(item.purpose ?? "imagem_site");
                      setPrompt(item.prompt ?? "");
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    },
                    onNew: () => {
                      setParentAssetId(null);
                      setPrompt("");
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    },
                  }
                : {})}
            />
          ))}
        </div>
      )}
    </div>
  );
}
