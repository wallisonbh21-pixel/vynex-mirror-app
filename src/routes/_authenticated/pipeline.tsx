import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { requireVendedor } from "@/lib/guard";
import { useSession } from "@/lib/auth";
import { useChangeLeadStatus, type Lead } from "@/lib/crm";
import { useRows } from "@/lib/data";
import { currency, LEAD_STATUS, label, shortDate } from "@/lib/format";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/pipeline")({
  beforeLoad: () => requireVendedor(),
  head: () => ({
    meta: [
      { title: "Pipeline — VYNEXA" },
      {
        name: "description",
        content: "Funil visual das oportunidades: arraste os cards entre as etapas e acompanhe o fechamento.",
      },
      { property: "og:title", content: "Pipeline — VYNEXA" },
      { property: "og:description", content: "Kanban comercial do CRM VYNEXA." },
    ],
  }),
  component: PipelinePage,
});

const COLUMN_ACCENT: Record<string, string> = {
  novo: "bg-chart-3",
  contatado: "bg-chart-4",
  interessado: "bg-chart-1",
  proposta: "bg-chart-5",
  negociacao: "bg-chart-2",
  fechado: "bg-success",
  perdido: "bg-destructive",
};

function PipelinePage() {
  const { user } = useSession();
  const { data = [] } = useRows<Lead>("leads");
  const changeStatus = useChangeLeadStatus();
  const [dragging, setDragging] = useState<string | null>(null);
  const [over, setOver] = useState<string | null>(null);

  function drop(status: string) {
    const lead = data.find((item) => item.id === dragging);
    setDragging(null);
    setOver(null);
    if (!lead || !user || lead.status === status) return;
    changeStatus.mutate({ lead, status, userId: user.id });
  }

  return (
    <AppShell
      title="Pipeline"
      description="Arraste cada oportunidade para a etapa atual — o histórico é registrado automaticamente."
    >
      <div className="flex gap-4 overflow-x-auto pb-4">
        {LEAD_STATUS.map((status) => {
          const rows = data.filter((lead) => lead.status === status);
          const total = rows.reduce(
            (sum, lead) => sum + Number(lead.closed_value || lead.estimated_value),
            0,
          );
          return (
            <section
              key={status}
              onDragOver={(event) => {
                event.preventDefault();
                setOver(status);
              }}
              onDragLeave={() => setOver((value) => (value === status ? null : value))}
              onDrop={() => drop(status)}
              className={cn(
                "w-72 shrink-0 rounded-2xl border border-border bg-card/60 p-3 transition-colors",
                over === status && "border-primary bg-secondary/60",
              )}
            >
              <header className="flex items-center gap-2 px-1">
                <span className={cn("size-2.5 rounded-full", COLUMN_ACCENT[status])} />
                <h2 className="flex-1 text-sm font-semibold">{label(status)}</h2>
                <span className="text-xs text-muted-foreground">{rows.length}</span>
              </header>
              <p className="px-1 text-xs text-muted-foreground">{currency(total)}</p>

              <div className="mt-3 space-y-2">
                {rows.map((lead) => (
                  <article
                    key={lead.id}
                    draggable
                    onDragStart={() => setDragging(lead.id)}
                    onDragEnd={() => setDragging(null)}
                    className={cn(
                      "cursor-grab rounded-xl border border-border bg-card p-3 shadow-panel active:cursor-grabbing",
                      dragging === lead.id && "opacity-50",
                    )}
                  >
                    <Link
                      to="/leads/$leadId"
                      params={{ leadId: lead.id }}
                      className="text-sm font-medium hover:text-primary"
                    >
                      {lead.company || lead.name}
                    </Link>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {lead.name} · {lead.city || "—"}
                    </p>
                    <p className="mt-2 text-sm font-semibold">
                      {currency(lead.closed_value || lead.estimated_value)}
                    </p>
                    {lead.next_contact_at ? (
                      <p className="text-xs text-muted-foreground">
                        Próximo contato {shortDate(lead.next_contact_at)}
                      </p>
                    ) : null}
                  </article>
                ))}
                {rows.length === 0 ? (
                  <p className="py-6 text-center text-xs text-muted-foreground">Vazio</p>
                ) : null}
              </div>
            </section>
          );
        })}
      </div>

      {data.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
          Nenhuma oportunidade cadastrada ainda.
        </p>
      ) : null}
    </AppShell>
  );
}
