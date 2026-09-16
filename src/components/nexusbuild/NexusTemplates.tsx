import { LayoutGrid } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NEXUS_TEMPLATE_CATEGORIES } from "@/lib/nexus/catalog";

export function NexusTemplates({
  onUse,
  pending,
}: {
  onUse: (template: string, category: string) => void;
  pending: boolean;
}) {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <div className="flex items-center gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-primary/30 bg-primary/10">
          <LayoutGrid className="size-5 text-primary" />
        </div>
        <div className="min-w-0">
          <h2 className="text-lg font-semibold">Templates</h2>
          <p className="text-xs text-muted-foreground">
            Categorias iniciais do ScaleNexus. Ainda não há templates reais cadastrados — ao escolher
            um modelo, a NEXUSBUILD AI abre uma conversa com esse objetivo.
          </p>
        </div>
      </div>

      {NEXUS_TEMPLATE_CATEGORIES.map((category) => (
        <section key={category.label} className="min-w-0">
          <p className="pb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            {category.label}
          </p>
          <div className="grid gap-2 sm:grid-cols-2">
            {category.items.map((item) => (
              <div
                key={item}
                className="flex min-w-0 items-center justify-between gap-2 rounded-xl border border-border bg-card px-3 py-2"
              >
                <span className="truncate text-xs text-foreground/90">{item}</span>
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={pending}
                  className="h-7 shrink-0 rounded-lg px-2 text-[11px] text-primary hover:text-primary"
                  onClick={() => onUse(item, category.label)}
                >
                  Criar com este
                </Button>
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
