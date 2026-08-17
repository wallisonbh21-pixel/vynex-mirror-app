import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Building2, Layers, Search, Sparkles } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { StatCard } from "@/components/StatCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { requireCriador } from "@/lib/guard";
import { useRows } from "@/lib/data";
import { useAvailableProjetos, useClaimProjeto, type CreatorProjeto } from "@/lib/creator";
import { currency, shortDate } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/disponiveis")({
  beforeLoad: () => requireCriador(),
  head: () => ({
    meta: [
      { title: "Projetos disponíveis — ScaleNexus" },
      {
        name: "description",
        content: "Vitrine de projetos de sites disponíveis para criadores assumirem na ScaleNexus.",
      },
      { property: "og:title", content: "Projetos disponíveis — ScaleNexus" },
      { property: "og:description", content: "Assuma um projeto e comece a produzir." },
    ],
  }),
  component: DisponiveisPage,
});

type Cliente = { id: string; company: string; contact_name: string | null };

function DisponiveisPage() {
  const { data: projects = [], isLoading } = useAvailableProjetos();
  const { data: clients = [] } = useRows<Cliente>("clients");
  const claim = useClaimProjeto();
  const [search, setSearch] = useState("");

  const clientOf = useMemo(() => {
    const map = new Map(clients.map((c) => [c.id, c]));
    return (id: string | null) => (id ? map.get(id) : undefined);
  }, [clients]);

  const rows = projects.filter((project) => {
    const term = search.trim().toLowerCase();
    if (!term) return true;
    const client = clientOf(project.client_id);
    return [project.title, project.site_type, project.description, client?.company]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(term));
  });

  const commissionOf = (p: CreatorProjeto) =>
    Number(p.commission) > 0 ? Number(p.commission) : (Number(p.value) * Number(p.commission_rate)) / 100;

  return (
    <AppShell
      title="Projetos disponíveis"
      description="O primeiro criador que assumir fica responsável pela entrega."
      actions={
        <Button asChild variant="secondary">
          <Link to="/meus-projetos">Meus projetos</Link>
        </Button>
      }
    >
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Disponíveis agora" value={String(projects.length)} hint="Aguardando um criador" icon={Layers} />
        <StatCard
          label="Valor total em vitrine"
          value={currency(projects.reduce((s, p) => s + Number(p.value), 0))}
          hint="Somatório dos projetos"
          icon={Sparkles}
        />
        <StatCard
          label="Comissão potencial"
          value={currency(projects.reduce((s, p) => s + commissionOf(p), 0))}
          hint="Se você assumir todos"
          icon={Building2}
        />
      </div>

      <div className="mt-6 flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2">
        <Search className="size-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por projeto, empresa ou tipo de site"
          className="border-0 bg-transparent px-0 focus-visible:ring-0"
        />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
        {rows.map((project) => {
          const client = clientOf(project.client_id);
          return (
            <article key={project.id} className="flex flex-col rounded-2xl border border-border bg-card p-5 shadow-panel">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="truncate text-base font-semibold">{project.title}</h2>
                  <p className="text-xs text-muted-foreground">
                    {client?.company ?? "Clientee interno"}
                    {client?.contact_name ? ` · ${client.contact_name}` : ""}
                  </p>
                </div>
                <span className="rounded-full border border-primary/30 bg-primary/10 px-2.5 py-0.5 text-xs text-primary">
                  {project.site_type ?? "Site"}
                </span>
              </div>

              <p className="mt-3 line-clamp-4 min-h-16 text-sm text-muted-foreground">
                {project.description || "Sem descrição informada."}
              </p>

              <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <div>
                  <dt className="text-xs text-muted-foreground">Valor do projeto</dt>
                  <dd className="font-semibold">{currency(project.value)}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">Sua comissão</dt>
                  <dd className="font-semibold text-primary">
                    {currency(commissionOf(project))}
                    <span className="ml-1 text-xs font-normal text-muted-foreground">
                      ({Number(project.commission_rate)}%)
                    </span>
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">Prazo</dt>
                  <dd>{shortDate(project.due_date)}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">Criado em</dt>
                  <dd>{shortDate(project.created_at)}</dd>
                </div>
              </dl>

              <Button
                className="mt-5"
                disabled={claim.isPending}
                onClick={() => claim.mutate(project.id)}
              >
                Assumir projeto
              </Button>
            </article>
          );
        })}
      </div>

      {!isLoading && rows.length === 0 ? (
        <p className="mt-10 text-center text-sm text-muted-foreground">
          Nenhum projeto disponível no momento.
        </p>
      ) : null}
    </AppShell>
  );
}
