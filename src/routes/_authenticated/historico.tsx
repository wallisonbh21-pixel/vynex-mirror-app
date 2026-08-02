import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Search } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useActivities, type Lead } from "@/lib/crm";
import { useRows } from "@/lib/data";
import { ACTIVITY_TYPES, label, shortDate } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/historico")({
  head: () => ({
    meta: [
      { title: "Histórico — VYNEXA" },
      {
        name: "description",
        content: "Todas as interações comerciais registradas: ligações, mensagens, reuniões e mudanças de status.",
      },
      { property: "og:title", content: "Histórico — VYNEXA" },
      { property: "og:description", content: "Registro de atividades comerciais da VYNEXA." },
    ],
  }),
  component: HistoricoPage,
});

const PAGE_SIZE = 15;

function HistoricoPage() {
  const { data: activities = [] } = useActivities();
  const { data: leads = [] } = useRows<Lead>("leads");
  const [term, setTerm] = useState("");
  const [type, setType] = useState("todos");
  const [page, setPage] = useState(0);

  const leadName = (id: string) => {
    const lead = leads.find((item) => item.id === id);
    return lead ? lead.company || lead.name : "Lead removido";
  };

  const filtered = useMemo(() => {
    const q = term.trim().toLowerCase();
    return activities.filter((activity) => {
      const matchType = type === "todos" || activity.type === type;
      const matchTerm =
        !q ||
        activity.description.toLowerCase().includes(q) ||
        leadName(activity.lead_id).toLowerCase().includes(q);
      return matchType && matchTerm;
    });
  }, [activities, leads, term, type]);

  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const current = Math.min(page, pages - 1);
  const rows = filtered.slice(current * PAGE_SIZE, current * PAGE_SIZE + PAGE_SIZE);

  return (
    <AppShell title="Histórico" description="Tudo o que aconteceu em cada oportunidade, em ordem cronológica.">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-56 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={term}
            onChange={(e) => {
              setTerm(e.target.value);
              setPage(0);
            }}
            placeholder="Buscar por empresa ou descrição"
            className="pl-9"
          />
        </div>
        <Select
          value={type}
          onValueChange={(value) => {
            setType(value);
            setPage(0);
          }}
        >
          <SelectTrigger className="w-52">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os tipos</SelectItem>
            {ACTIVITY_TYPES.map((item) => (
              <SelectItem key={item} value={item}>
                {label(item)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <ul className="mt-4 divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card shadow-panel">
        {rows.map((activity) => (
          <li key={activity.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-sm">
            <span className="min-w-0">
              <span className="block">{activity.description}</span>
              <span className="text-xs text-muted-foreground">
                {leadName(activity.lead_id)} · {label(activity.type)} · {shortDate(activity.happened_at)}
              </span>
            </span>
            <Button asChild variant="ghost" size="sm">
              <Link to="/leads/$leadId" params={{ leadId: activity.lead_id }}>
                Abrir lead
              </Link>
            </Button>
          </li>
        ))}
        {rows.length === 0 ? (
          <li className="px-4 py-12 text-center text-sm text-muted-foreground">
            Nenhuma atividade registrada ainda.
          </li>
        ) : null}
      </ul>

      <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
        <span>
          {filtered.length} registro{filtered.length === 1 ? "" : "s"} · página {current + 1} de {pages}
        </span>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" disabled={current === 0} onClick={() => setPage(current - 1)}>
            Anterior
          </Button>
          <Button variant="ghost" size="sm" disabled={current >= pages - 1} onClick={() => setPage(current + 1)}>
            Próxima
          </Button>
        </div>
      </div>
    </AppShell>
  );
}
