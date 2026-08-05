import { createFileRoute, Link } from "@tanstack/react-router";
import { 
  Search, 
  Filter, 
  ExternalLink, 
  Calendar, 
  Layout, 
  Clock,
  CircleDollarSign,
  ArrowRight
} from "lucide-react";
import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { requireCriador } from "@/lib/guard";
import { useMyCreatorProjects, creatorEarnings } from "@/lib/creator";
import { useRows } from "@/lib/data";
import { currency, shortDate, label } from "@/lib/format";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/meus-projetos")({
  beforeLoad: () => requireCriador(),
  head: () => ({
    meta: [{ title: "Meus Projetos — VYNEXA" }],
  }),
  component: MeusProjetosPage,
});

function MeusProjetosPage() {
  const { data: projects = [], isLoading } = useMyCreatorProjects();
  const { data: withdrawals = [] } = useRows<any>("withdrawals");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<string>("all");

  const earnings = creatorEarnings(projects, withdrawals);

  const filtered = projects.filter((p) => {
    const matchesSearch = p.title.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === "all" || p.status === filter;
    return matchesSearch && matchesFilter;
  });

  const statuses = Array.from(new Set(projects.map((p) => p.status)));

  return (
    <AppShell
      title="Meus Projetos"
      description="Gerencie suas entregas e acompanhe o status de cada site."
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar projeto..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0 no-scrollbar">
          <Button
            variant={filter === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("all")}
            className="whitespace-nowrap"
          >
            Todos
          </Button>
          {statuses.map((s) => (
            <Button
              key={s}
              variant={filter === s ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter(s)}
              className="whitespace-nowrap"
            >
              {label(s)}
            </Button>
          ))}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((project) => (
          <div
            key={project.id}
            className="group relative flex flex-col rounded-2xl border border-border bg-card p-5 shadow-panel transition-all hover:shadow-md"
          >
            <div className="mb-4 flex items-start justify-between">
              <div className="space-y-1">
                <h3 className="font-bold leading-tight group-hover:text-primary transition-colors">
                  {project.title}
                </h3>
                <div className="flex items-center gap-2 text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
                  <Layout className="size-3" /> {project.site_type || "Site Profissional"}
                </div>
              </div>
              <StatusBadge status={project.status} />
            </div>

            <div className="mb-6 grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground uppercase font-bold">
                  <Calendar className="size-3" /> Início
                </div>
                <div className="text-xs font-medium">{shortDate(project.assigned_at || project.created_at)}</div>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground uppercase font-bold">
                  <Clock className="size-3" /> Prazo
                </div>
                <div className={cn(
                  "text-xs font-medium",
                  project.due_date && new Date(project.due_date) < new Date() && project.status !== 'entregue' && "text-destructive font-bold"
                )}>
                  {shortDate(project.due_date)}
                </div>
              </div>
            </div>

            <div className="mt-auto border-t border-border pt-4 flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="flex items-center gap-1 text-[10px] text-muted-foreground uppercase font-bold">
                  <CircleDollarSign className="size-3" /> Comissão
                </div>
                <div className="text-sm font-bold text-primary">
                  {currency(earnings.commissionOf(project))}
                </div>
              </div>
              <div className="flex gap-2">
                {project.delivery_link && (
                  <Button asChild variant="ghost" size="icon" className="size-8 rounded-full" title="Ver site">
                    <a href={project.delivery_link} target="_blank" rel="noreferrer">
                      <ExternalLink className="size-4" />
                    </a>
                  </Button>
                )}
                <Button asChild size="sm" className="h-8 gap-1.5 rounded-full px-4">
                  <Link to="/projetos/$projectId" params={{ projectId: project.id }}>
                    Ver <ArrowRight className="size-3.5" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {!isLoading && filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="mb-4 flex size-16 items-center justify-center rounded-full bg-muted/50">
            <Search className="size-8 text-muted-foreground/30" />
          </div>
          <h3 className="text-lg font-semibold">Nenhum projeto encontrado</h3>
          <p className="text-sm text-muted-foreground">Tente ajustar seus filtros ou busca.</p>
        </div>
      )}
    </AppShell>
  );
}
