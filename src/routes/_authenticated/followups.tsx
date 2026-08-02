import { createFileRoute, Link } from "@tanstack/react-router";
import { AlertTriangle, CalendarClock, CalendarDays } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { StatCard } from "@/components/StatCard";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import type { Lead } from "@/lib/crm";
import { useRows } from "@/lib/data";
import { currency, shortDate, today } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/followups")({
  head: () => ({
    meta: [
      { title: "Follow-ups — VYNEXA" },
      {
        name: "description",
        content: "Contatos de hoje, follow-ups atrasados e próximos retornos das suas oportunidades.",
      },
      { property: "og:title", content: "Follow-ups — VYNEXA" },
      { property: "og:description", content: "Agenda comercial do CRM VYNEXA." },
    ],
  }),
  component: FollowUpsPage,
});

function FollowUpsPage() {
  const { data = [] } = useRows<Lead>("leads");
  const now = today();
  const scheduled = data.filter(
    (lead) => lead.next_contact_at && !["fechado", "perdido"].includes(lead.status),
  );

  const late = scheduled.filter((lead) => lead.next_contact_at! < now);
  const todayList = scheduled.filter((lead) => lead.next_contact_at === now);
  const next = scheduled
    .filter((lead) => lead.next_contact_at! > now)
    .sort((a, b) => a.next_contact_at!.localeCompare(b.next_contact_at!));

  return (
    <AppShell title="Follow-ups" description="Nenhum contato esquecido: acompanhe cada retorno combinado.">
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Atrasados" value={String(late.length)} hint="Precisam de contato imediato" icon={AlertTriangle} />
        <StatCard label="Para hoje" value={String(todayList.length)} hint={shortDate(now)} icon={CalendarClock} />
        <StatCard label="Próximos" value={String(next.length)} hint="Agendados para os próximos dias" icon={CalendarDays} />
      </div>

      <div className="mt-6 space-y-6">
        <Group title="Follow-up atrasado" rows={late} tone="danger" />
        <Group title="Contatos para hoje" rows={todayList} tone="warning" />
        <Group title="Próximos contatos" rows={next} tone="neutral" />
      </div>
    </AppShell>
  );
}

function Group({
  title,
  rows,
  tone,
}: {
  title: string;
  rows: Lead[];
  tone: "danger" | "warning" | "neutral";
}) {
  return (
    <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-panel">
      <header className="flex items-center justify-between border-b border-border px-4 py-3">
        <h2 className="text-sm font-semibold">{title}</h2>
        <span
          className={
            tone === "danger"
              ? "text-xs text-destructive"
              : tone === "warning"
                ? "text-xs text-warning"
                : "text-xs text-muted-foreground"
          }
        >
          {rows.length}
        </span>
      </header>
      <ul className="divide-y divide-border">
        {rows.map((lead) => (
          <li key={lead.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-sm">
            <span className="min-w-0">
              <span className="block font-medium">{lead.company || lead.name}</span>
              <span className="text-xs text-muted-foreground">
                Próximo contato {shortDate(lead.next_contact_at)} ·{" "}
                {lead.whatsapp || lead.phone || lead.email || "sem contato"} ·{" "}
                {currency(lead.estimated_value)}
              </span>
            </span>
            <span className="flex items-center gap-2">
              <StatusBadge status={lead.status} />
              <Button asChild variant="ghost" size="sm">
                <Link to="/leads/$leadId" params={{ leadId: lead.id }}>
                  Abrir
                </Link>
              </Button>
            </span>
          </li>
        ))}
        {rows.length === 0 ? (
          <li className="px-4 py-8 text-center text-sm text-muted-foreground">
            Nenhum contato nesta faixa.
          </li>
        ) : null}
      </ul>
    </section>
  );
}
