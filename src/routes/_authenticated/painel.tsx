import { createFileRoute } from "@tanstack/react-router";
import { Building2, Palette, Target, Wallet } from "lucide-react";
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
import { useRows } from "@/lib/data";
import { currency, shortDate } from "@/lib/format";
import { useProfile, useRoles } from "@/lib/auth";

export const Route = createFileRoute("/_authenticated/painel")({
  head: () => ({
    meta: [
      { title: "Visão geral — VYNEXA" },
      {
        name: "description",
        content: "Indicadores de receita, recorrência, leads e projetos do seu time na VYNEXA.",
      },
      { property: "og:title", content: "Visão geral — VYNEXA" },
      { property: "og:description", content: "Indicadores do seu painel VYNEXA." },
    ],
  }),
  component: Painel,
});

type Lead = { id: string; name: string; company: string | null; status: string; estimated_value: number; created_at: string };
type Client = { id: string; company: string; monthly_fee: number; status: string };
type Project = { id: string; title: string; status: string; due_date: string | null; commission: number };
type Transaction = { id: string; amount: number; type: string; occurred_at: string; description: string | null };

function Painel() {
  const { data: profile } = useProfile();
  const { isAdmin, isCriador } = useRoles();
  const leads = useRows<Lead>("leads");
  const clients = useRows<Client>("clients");
  const projects = useRows<Project>("projects");
  const transactions = useRows<Transaction>("transactions", { column: "occurred_at" });

  const leadRows = leads.data ?? [];
  const clientRows = clients.data ?? [];
  const projectRows = projects.data ?? [];
  const transactionRows = transactions.data ?? [];

  const recurring = clientRows
    .filter((c) => c.status === "ativo")
    .reduce((sum, c) => sum + Number(c.monthly_fee), 0);
  const balance = transactionRows.reduce((sum, t) => sum + Number(t.amount), 0);
  const openProjects = projectRows.filter((p) => p.status !== "entregue").length;
  const wonLeads = leadRows.filter((l) => l.status === "ganho").length;

  const byMonth = new Map<string, number>();
  transactionRows.forEach((t) => {
    const key = t.occurred_at.slice(0, 7);
    byMonth.set(key, (byMonth.get(key) ?? 0) + Number(t.amount));
  });
  const chart = [...byMonth.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-6)
    .map(([month, total]) => ({ month: month.split("-").reverse().join("/"), total }));

  return (
    <AppShell
      title={`Olá, ${profile?.full_name?.split(" ")[0] || "bem-vindo"}`}
      description={
        isAdmin
          ? "Você está vendo os dados de toda a operação."
          : isCriador
            ? "Sua fila de produção e comissões por projeto."
            : "Seus leads, clientes, comissões e metas."
      }
    >
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Receita recorrente"
          value={currency(recurring)}
          hint={`${clientRows.filter((c) => c.status === "ativo").length} clientes ativos`}
          icon={Building2}
        />
        <StatCard label="Saldo em comissões" value={currency(balance)} hint="Transações registradas" icon={Wallet} />
        <StatCard label="Projetos em aberto" value={String(openProjects)} hint={`${projectRows.length} no total`} icon={Palette} />
        <StatCard label="Leads ganhos" value={String(wonLeads)} hint={`${leadRows.length} leads no funil`} icon={Target} />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <section className="rounded-2xl border border-border bg-card p-5 shadow-panel lg:col-span-2">
          <h2 className="text-sm font-semibold">Receita dos últimos meses</h2>
          <div className="mt-4 h-64">
            {chart.length === 0 ? (
              <p className="pt-16 text-center text-sm text-muted-foreground">
                Nenhuma transação registrada ainda.
              </p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chart}>
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
          <h2 className="text-sm font-semibold">Funil de leads</h2>
          <ul className="mt-4 space-y-3">
            {["novo", "contato", "proposta", "ganho", "perdido"].map((status) => {
              const rows = leadRows.filter((l) => l.status === status);
              return (
                <li key={status} className="flex items-center justify-between text-sm">
                  <StatusBadge status={status} />
                  <span className="text-muted-foreground">
                    {rows.length} · {currency(rows.reduce((s, r) => s + Number(r.estimated_value), 0))}
                  </span>
                </li>
              );
            })}
          </ul>
        </section>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <section className="rounded-2xl border border-border bg-card p-5 shadow-panel">
          <h2 className="text-sm font-semibold">Projetos recentes</h2>
          <ul className="mt-4 space-y-3">
            {projectRows.slice(0, 5).map((project) => (
              <li key={project.id} className="flex items-center justify-between gap-3 text-sm">
                <span className="min-w-0">
                  <span className="block truncate">{project.title}</span>
                  <span className="text-xs text-muted-foreground">
                    Prazo {shortDate(project.due_date)} · {currency(project.commission)}
                  </span>
                </span>
                <StatusBadge status={project.status} />
              </li>
            ))}
            {projectRows.length === 0 ? (
              <li className="text-sm text-muted-foreground">Nenhum projeto cadastrado.</li>
            ) : null}
          </ul>
        </section>

        <section className="rounded-2xl border border-border bg-card p-5 shadow-panel">
          <h2 className="text-sm font-semibold">Últimas transações</h2>
          <ul className="mt-4 space-y-3">
            {transactionRows.slice(0, 5).map((t) => (
              <li key={t.id} className="flex items-center justify-between gap-3 text-sm">
                <span className="min-w-0">
                  <span className="block truncate">{t.description || "Sem descrição"}</span>
                  <span className="text-xs text-muted-foreground">{shortDate(t.occurred_at)}</span>
                </span>
                <span className={Number(t.amount) < 0 ? "text-destructive" : "text-success"}>
                  {currency(t.amount)}
                </span>
              </li>
            ))}
            {transactionRows.length === 0 ? (
              <li className="text-sm text-muted-foreground">Nenhuma transação registrada.</li>
            ) : null}
          </ul>
        </section>
      </div>
    </AppShell>
  );
}
