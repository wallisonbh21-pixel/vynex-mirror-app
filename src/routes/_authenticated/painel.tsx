import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Handshake,
  Percent,
  Phone,
  Target,
  TrendingUp,
  Wallet,
  FileText,
  Trophy,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AppShell } from "@/components/AppShell";
import { StatCard } from "@/components/StatCard";
import { StatusBadge } from "@/components/StatusBadge";
import { SalesFunnel } from "@/components/SalesFunnel";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useProfile, useRoles, useSession } from "@/lib/auth";
import { useActivities, type Contract, type Lead, type Proposal } from "@/lib/crm";
import { useRows } from "@/lib/data";
import { currency, label, LEAD_STATUS, shortDate } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/painel")({
  head: () => ({
    meta: [
      { title: "Visão geral — VYNEXA" },
      {
        name: "description",
        content: "Indicadores do vendedor: leads ativos, propostas, contratos, conversão, comissão e meta do mês.",
      },
      { property: "og:title", content: "Visão geral — VYNEXA" },
      { property: "og:description", content: "Dashboard comercial da VYNEXA." },
    ],
  }),
  component: Painel,
});

type Goal = { id: string; user_id: string; month: string; sales_target: number; revenue_target: number };

function Painel() {
  const { user } = useSession();
  const { data: profile } = useProfile();
  const { isAdmin, isCriador } = useRoles();
  const { data: leads = [] } = useRows<Lead>("leads");
  const { data: proposals = [] } = useRows<Proposal>("proposals");
  const { data: contracts = [] } = useRows<Contract>("contracts", { column: "signed_at" });
  const { data: goals = [] } = useRows<Goal>("goals", { column: "month" });
  const { data: activities = [] } = useActivities();

  const monthKey = new Date().toISOString().slice(0, 7);
  const activeLeads = leads.filter((lead) => !["fechado", "perdido"].includes(lead.status));
  const closed = leads.filter((lead) => lead.status === "fechado");
  const contacts = activities.filter((activity) => activity.type !== "observacao" && activity.type !== "status");
  const sentProposals = proposals.filter((proposal) => proposal.status !== "rascunho");
  const monthContracts = contracts.filter((contract) => contract.signed_at.slice(0, 7) === monthKey);
  const monthRevenue = monthContracts.reduce((sum, contract) => sum + Number(contract.amount), 0);
  const conversion = leads.length ? Math.round((closed.length / leads.length) * 100) : 0;
  const rate = Number(profile?.commission_rate ?? 0);
  const commission = (monthRevenue * rate) / 100;
  const goal = goals.find((item) => item.month.slice(0, 7) === monthKey);
  const goalPercent = goal?.revenue_target
    ? Math.min(100, Math.round((monthRevenue / Number(goal.revenue_target)) * 100))
    : 0;

  const evolution = (() => {
    const byMonth = new Map<string, number>();
    contracts.forEach((contract) => {
      const key = contract.signed_at.slice(0, 7);
      byMonth.set(key, (byMonth.get(key) ?? 0) + Number(contract.amount));
    });
    return [...byMonth.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-6)
      .map(([month, total]) => ({
        month: month.split("-").reverse().join("/"),
        total,
      }));
  })();

  return (
    <AppShell
      title={`Olá, ${profile?.full_name?.split(" ")[0] || "bem-vindo"}`}
      description={
        isAdmin
          ? "Você está vendo os dados de toda a operação."
          : isCriador
            ? "Sua fila de produção e comissões por projeto."
            : "Seu funil comercial, metas e comissões previstas."
      }
      actions={
        <Button asChild>
          <Link to="/pipeline">Abrir pipeline</Link>
        </Button>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Leads ativos" value={String(activeLeads.length)} hint={`${leads.length} no funil`} icon={Target} />
        <StatCard label="Contatos realizados" value={String(contacts.length)} hint="Ligações, WhatsApp, reuniões" icon={Phone} />
        <StatCard label="Propostas enviadas" value={String(sentProposals.length)} hint={`${proposals.length} criadas`} icon={FileText} />
        <StatCard label="Contratos fechados" value={String(contracts.length)} hint={`${monthContracts.length} neste mês`} icon={Handshake} />
        <StatCard label="Taxa de conversão" value={`${conversion}%`} hint={`${closed.length} leads convertidos`} icon={Percent} />
        <StatCard label="Vendido no mês" value={currency(monthRevenue)} hint={shortDate(`${monthKey}-01`)} icon={TrendingUp} />
        <StatCard label="Comissão prevista" value={currency(commission)} hint={`${rate}% sobre o mês`} icon={Wallet} />
        <StatCard
          label="Melhor Meta do Mês"
          value={goal ? currency(goal.revenue_target) : "Sem meta"}
          hint={goal ? `${goalPercent}% alcançado` : "Cadastre em Metas"}
          icon={Trophy}
        />
      </div>

      {goal ? (
        <div className="mt-4 rounded-2xl border border-border bg-card p-5 shadow-panel">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <Trophy className="size-4 text-warning" />
              <span className="font-semibold text-primary">Conquistas & Troféus: Meta Batida</span>
            </div>
            <span className="text-muted-foreground">
              {currency(monthRevenue)} de {currency(goal.revenue_target)}
            </span>
          </div>
          <Progress value={goalPercent} className="mt-3 h-3 shadow-inner" />
          {goalPercent >= 100 && (
            <p className="mt-2 text-center text-xs font-bold animate-bounce text-success">
              🏆 META BATIDA! VOCÊ É UM CAMPEÃO! 🏆
            </p>
          )}
        </div>
      ) : null}

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <section className="rounded-2xl border border-border bg-card p-5 shadow-panel lg:col-span-2">
          <h2 className="text-sm font-semibold">Evolução de vendas</h2>
          <div className="mt-4 h-64">
            {evolution.length === 0 ? (
              <p className="pt-16 text-center text-sm text-muted-foreground">
                Nenhum contrato fechado ainda.
              </p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={evolution}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="month" stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip
                    cursor={{ fill: "var(--muted)" }}
                    contentStyle={{
                      background: "var(--popover)",
                      border: "1px solid var(--border)",
                      borderRadius: 12,
                      color: "var(--popover-foreground)",
                    }}
                    formatter={(value: number) => currency(value)}
                  />
                  <Bar dataKey="total" fill="var(--chart-1)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-card p-5 shadow-panel">
          <h2 className="text-sm font-semibold mb-6">Funil Comercial (Visual)</h2>
          <SalesFunnel leads={leads} />
        </section>
      </div>

      <section className="mt-6 overflow-hidden rounded-2xl border border-border bg-card shadow-panel">
        <h2 className="border-b border-border px-4 py-3 text-sm font-semibold">
          Minhas oportunidades recentes
        </h2>
        <ul className="divide-y divide-border">
          {leads.slice(0, 6).map((lead) => (
            <li key={lead.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-sm">
              <span className="min-w-0">
                <Link
                  to="/leads/$leadId"
                  params={{ leadId: lead.id }}
                  className="block truncate font-medium hover:text-primary"
                >
                  {lead.company || lead.name}
                </Link>
                <span className="text-xs text-muted-foreground">
                  {currency(lead.closed_value || lead.estimated_value)} · próximo contato{" "}
                  {shortDate(lead.next_contact_at)}
                </span>
              </span>
              <StatusBadge status={lead.status} />
            </li>
          ))}
          {leads.length === 0 ? (
            <li className="px-4 py-12 text-center text-sm text-muted-foreground">
              Nenhuma oportunidade cadastrada ainda.
            </li>
          ) : null}
        </ul>
      </section>
    </AppShell>
  );
}
