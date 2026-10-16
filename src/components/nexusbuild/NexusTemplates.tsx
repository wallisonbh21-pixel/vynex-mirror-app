import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, Eye, LayoutGrid, Loader2, Monitor, Search, Smartphone, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { useTemplateLibrary, type LibraryModel } from "@/lib/templates/library";

export interface SelectedTemplate {
  id: string;
  name: string;
  category: string;
}

/** Prévia real do modelo: renderiza a rota oficial do template em escala reduzida. */
function LivePreview({ route, title }: { route: string; title: string }) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [visible, setVisible] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setVisible(true);
          io.disconnect();
        }
      },
      { rootMargin: "200px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!visible || loaded) return;
    const t = setTimeout(() => !loaded && setFailed(true), 20000);
    return () => clearTimeout(t);
  }, [visible, loaded]);

  return (
    <div ref={ref} className="relative aspect-[16/10] overflow-hidden bg-muted">
      {visible && !failed && (
        <iframe
          src={route}
          title={`Prévia de ${title}`}
          loading="lazy"
          tabIndex={-1}
          aria-hidden
          sandbox="allow-same-origin allow-scripts"
          onLoad={() => setLoaded(true)}
          className={cn(
            "pointer-events-none absolute left-0 top-0 h-[400%] w-[400%] origin-top-left scale-25 border-0 transition-opacity duration-500",
            loaded ? "opacity-100" : "opacity-0",
          )}
        />
      )}
      {!loaded && !failed && (
        <div className="absolute inset-0 flex items-center justify-center text-xs text-muted-foreground">
          <Loader2 className="mr-2 size-4 animate-spin" /> Carregando prévia…
        </div>
      )}
      {failed && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 px-4 text-center text-xs text-muted-foreground">
          <LayoutGrid className="size-5" />
          Prévia provisória indisponível no momento
        </div>
      )}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-card to-transparent" />
    </div>
  );
}

function PreviewDialog({
  model,
  onClose,
  onUse,
  pending,
}: {
  model: LibraryModel | null;
  onClose: () => void;
  onUse: (m: LibraryModel) => void;
  pending: boolean;
}) {
  const [device, setDevice] = useState<"desktop" | "mobile">("desktop");
  const [loaded, setLoaded] = useState(false);
  useEffect(() => setLoaded(false), [model?.id, device]);

  return (
    <Dialog open={Boolean(model)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="flex h-[92vh] max-w-[min(1400px,96vw)] flex-col gap-0 overflow-hidden p-0">
        {model && (
          <>
            <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-b border-border px-4 py-3">
              <div className="flex min-w-0 items-center gap-2">
                <Button variant="ghost" size="sm" onClick={onClose} className="shrink-0">
                  <ArrowLeft className="mr-1 size-4" /> Voltar aos modelos
                </Button>
                <div className="min-w-0">
                  <DialogTitle className="truncate text-sm font-semibold">{model.name}</DialogTitle>
                  <p className="truncate text-[11px] text-muted-foreground">{model.category}</p>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <div className="hidden rounded-lg border border-border p-0.5 sm:flex">
                  {(["desktop", "mobile"] as const).map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setDevice(d)}
                      aria-label={d === "desktop" ? "Ver no computador" : "Ver no celular"}
                      className={cn(
                        "rounded-md p-1.5 text-muted-foreground transition-colors",
                        device === d && "bg-primary/15 text-primary",
                      )}
                    >
                      {d === "desktop" ? <Monitor className="size-4" /> : <Smartphone className="size-4" />}
                    </button>
                  ))}
                </div>
                <Button size="sm" disabled={pending} onClick={() => onUse(model)}>
                  <Sparkles className="mr-1 size-4" /> Usar este template
                </Button>
              </div>
            </div>
            <div className="relative flex min-h-0 flex-1 justify-center overflow-hidden bg-muted/40 p-3">
              {!loaded && (
                <div className="absolute inset-0 flex items-center justify-center text-sm text-muted-foreground">
                  <Loader2 className="mr-2 size-4 animate-spin" /> Carregando o site do modelo…
                </div>
              )}
              <iframe
                key={`${model.id}-${device}`}
                src={model.previewRoute}
                title={`Prévia completa de ${model.name}`}
                sandbox="allow-same-origin allow-scripts"
                onLoad={() => setLoaded(true)}
                className={cn(
                  "h-full rounded-lg border border-border bg-background transition-all duration-300",
                  device === "desktop" ? "w-full" : "w-[390px] max-w-full",
                )}
              />
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

export function NexusTemplates({
  onUse,
  pending,
}: {
  onUse: (template: SelectedTemplate) => void;
  pending: boolean;
}) {
  const library = useTemplateLibrary();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("Todos");
  const [previewing, setPreviewing] = useState<LibraryModel | null>(null);

  const models = useMemo(
    () => (library.data ?? []).filter((m) => m.settings.status === "ativo" && m.settings.available_for_creators),
    [library.data],
  );
  const categories = useMemo(() => ["Todos", ...Array.from(new Set(models.map((m) => m.category)))], [models]);
  const filtered = models.filter((m) => {
    const q = query.trim().toLowerCase();
    const matchQ = !q || `${m.name} ${m.category} ${m.description}`.toLowerCase().includes(q);
    return matchQ && (category === "Todos" || m.category === category);
  });

  const use = (m: LibraryModel) => {
    setPreviewing(null);
    onUse({ id: m.id, name: m.name, category: m.category });
  };

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-primary/30 bg-primary/10">
            <LayoutGrid className="size-5 text-primary" />
          </div>
          <div className="min-w-0">
            <h2 className="text-lg font-semibold">Modelos de sites</h2>
            <p className="text-xs text-muted-foreground">
              Veja como cada modelo oficial fica antes de escolher. A NEXUSBUILD AI personaliza o conteúdo mantendo a estrutura.
            </p>
          </div>
        </div>
        <div className="relative w-full sm:w-64">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por nome ou categoria"
            className="pl-9"
          />
        </div>
      </div>

      {categories.length > 1 && (
        <div className="flex flex-wrap gap-2">
          {categories.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCategory(c)}
              className={cn(
                "rounded-full border px-3 py-1 text-xs transition-colors",
                category === c
                  ? "border-primary/50 bg-primary/15 text-primary"
                  : "border-border text-muted-foreground hover:text-foreground",
              )}
            >
              {c}
            </button>
          ))}
        </div>
      )}

      {library.isLoading ? (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-80 animate-pulse rounded-2xl border border-border bg-card" />
          ))}
        </div>
      ) : library.isError ? (
        <div className="rounded-2xl border border-destructive/40 bg-destructive/10 p-6 text-center text-sm">
          Não foi possível carregar os modelos.
          <Button variant="outline" size="sm" className="ml-3" onClick={() => library.refetch()}>
            Tentar novamente
          </Button>
        </div>
      ) : filtered.length === 0 ? (
        <p className="rounded-2xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">
          Nenhum modelo encontrado para essa busca.
        </p>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((m) => (
            <article
              key={m.id}
              data-template-id={m.id}
              className="group flex min-w-0 flex-col overflow-hidden rounded-2xl border border-border bg-card transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lg"
            >
              <button type="button" onClick={() => setPreviewing(m)} className="block text-left" aria-label={`Visualizar ${m.name}`}>
                <LivePreview route={m.previewRoute} title={m.name} />
              </button>
              <div className="flex flex-1 flex-col gap-2 p-4">
                <span className="w-fit rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-primary">
                  {m.category}
                </span>
                <h3 className="text-sm font-semibold">{m.name}</h3>
                <p className="line-clamp-2 text-xs text-muted-foreground">{m.description}</p>
                <div className="mt-auto flex gap-2 pt-2">
                  <Button variant="outline" size="sm" className="flex-1" onClick={() => setPreviewing(m)}>
                    <Eye className="mr-1 size-4" /> Visualizar
                  </Button>
                  <Button size="sm" className="flex-1" disabled={pending} onClick={() => use(m)}>
                    Usar este template
                  </Button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      <PreviewDialog model={previewing} onClose={() => setPreviewing(null)} onUse={use} pending={pending} />
    </div>
  );
}
