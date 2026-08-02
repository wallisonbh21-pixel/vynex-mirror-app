import { createFileRoute, Link } from "@tanstack/react-router";
import {
  CheckCircle2,
  Hammer,
  Layers,
  PackageCheck,
  Wallet,
  Clock,
  TrendingUp,
  Banknote,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AppShell } from "@/components/AppShell";
import { StatCard } from "@/components/StatCard";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { requireCriador } from "@/lib/guard";
import { useRows } from "@/lib/data";
import {
  creatorEarnings,
  monthlySeries,
  useAvailableProjects,
  useMyCreatorProjects,
} from "@/lib/creator";
import { currency, shortDate } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/criacao")({
  beforeLoad: () => requireCriador(),
  head: () => ({
    meta: [
      { title: "Painel do criador — VYNEXA" },
      {
        name: "description",
        content: "Projetos disponíveis, produção, entregas e comissões do criador VYNEXA.",
      },
      { property: "og:title", content: "Painel do criador — VYNEXA" },
      { property: "og:description", content: "Acompanhe produção e ganhos na VYNEXA." },
    ],
  }),
  component: PainelCriador,
});

type Withdrawal = { id: string; amount: number; status: string; created_at: string };

function PainelCriador() {
  const { data: available = [] } = useAvailableProjects();
  const { data: mine = [] } = useMyCreatorProjects();
  const { data: withdrawals = [] } = useRows<Withdrawal>("withdrawals");

  const earnings = creatorEarnings(mine, withdrawals);
  const series = monthlySeries(mine, earnings.commissionOf);

  const inProduction = mine.filter((p) => p.status === "em_producao");
  const delivered = mine.filter((p) => p.status === "entregue");
  const active = mine.filter((p) => !["entregue", "cancelado"].includes(p.status));
  const paidWithdrawals = withdrawals.filter((w) => w.status === "pago");

  return (
    <AppShell
      title="Painel do criador"
      description="Sua produção, entregas e ganhos em tempo real."
      actions={
        <div className="flex gap-2">
          <Button asChild variant="secondary">
            <Link to="/disponiveis">Projetos disponíveis</Link>
          </Button>
          <Button asChild>
            <Link to="/meus-projetos">Meus projetos</Link>
          </Button>
        </div>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Projetos disponíveis" value={String(available.length)} hint="Prontos para assumir" icon={Layers} />
        <StatCard label="Meus projetos ativos" value={String(active.length)} hint="Em andamento" icon={Hammer} />
        <StatCard label="Projetos entregues" value={String(delivered.length)} hint="Histórico total" icon={PackageCheck} />
        <StatCard label="Em produção" value={String(inProduction.length)} hint="Sendo desenvolvidos" icon={Clock} />
        <StatCard label="Comissão pendente" value={currency(earnings.pending)} hint="Libera na entrega" icon={TrendingUp} />
        <StatCard label="Comissão disponível" value={currency(earnings.released)} hint="Pode ser sacada" icon={CheckCircle2} />
        <StatCard label="Total recebido" value={currency(earnings.withdrawn)} hint="Saques pagos" icon={Banknote} />
        <StatCard
          label="Saques realizados"
          value={String(paidWithdrawals.length)}
          hint={`${withdrawals.filter((w) => w.status === "pendente").length} pendentes`}
          icon={Wallet}
        />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <section className="rounded-2xl border border-border bg-card p-5 shadow-panel">
          <h2 className="text-sm font-semibold">Projetos por mês</h2>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={series}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" vertical={false} />
                <XAxis dataKey="label" tickLine={false} axisLine={false} className="text-xs" />
                <YAxis allowDecimals={false} tickLine={false} axisLine={false} className="text-xs" width={30} />
                <Tooltip cursor={{ opacity: 0.1 }} />
                <Bar dataKey="projetos" radius={[6, 6, 0, 0]} fill="var(--primary)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-card p-5 shadow-panel">
          <h2 className="text-sm font-semibold">Ganhos por mês</h2>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={series}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" vertical={false} />
                <XAxis dataKey="label" tickLine={false} axisLine={false} className="text-xs" />
                <YAxis tickLine={false} axisLine={false} className="text-xs" width={50} />
                <Tooltip formatter={(v: number) => currency(v)} />
                <Line type="monotone" dataKey="ganhos" strokeWidth={2} stroke="var(--accent)" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>

      <section className="mt-6 overflow-hidden rounded-2xl border border-border bg-card shadow-panel">
        <h2 className="border-b border-border px-4 py-3 text-sm font-semibold">Projetos em andamento</h2>
        <ul className="divide-y divide-border">
          {active.map((project) => (
            <li key={project.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-sm">
              <span className="min-w-0">
                <span className="block truncate font-medium">{project.title}</span>
                <span className="block text-xs text-muted-foreground">
                  {project.site_type ?? "Site"} · prazo {shortDate(project.due_date)}
                </span>
              </span>
              <span className="flex items-center gap-3">
                <span className="text-sm font-semibold">{currency(earnings.commissionOf(project))}</span>
                <StatusBadge status={project.status} />
              </span>
            </li>
          ))}
          {active.length === 0 ? (
            <li className="px-4 py-10 text-center text-sm text-muted-foreground">
              Nenhum projeto ativo. Veja a vitrine de{" "}
              <Link to="/disponiveis" className="text-primary underline">
                projetos disponíveis
              </Link>
              .
            </li>
          ) : null}
        </ul>
      </section>
    </AppShell>
  );
}
