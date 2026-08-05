import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  Banknote,
  CalendarDays,
  Clock,
  Layers,
  Package,
  Search,
  Target,
  Wallet,
} from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { StatCard } from "@/components/StatCard";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRoles } from "@/lib/auth";
import { currency, shortDate } from "@/lib/format";
import {
  inPeriod,
  summarize,
  useCreatorCommissions,
  useCurrentGoal,
  useMyWithdrawals,
  useSellerCommissions,
  type CommissionRow,
  type PeriodKey,
} from "@/lib/commissions";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/comissoes")({
  head: () => ({
    meta: [
      { title: "Minhas comissões — ScaleNexus" },
      {
        name: "description",
        content: "Acompanhe comissões, bônus, saldo disponível e histórico financeiro pessoal na ScaleNexus.",
      },
      { property: "og:title", content: "Minhas comissões — ScaleNexus" },
      { property: "og:description", content: "Ganhos, bônus e saques da sua operação ScaleNexus." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ComissoesPage,
});

const STATUS_FILTERS = [
  { value: "todos", label: "Todos" },
  { value: "pendente", label: "Pendentes" },
  { value: "disponivel", label: "Disponíveis" },
  { value: "pago", label: "Pagos" },
] as const;

const PERIOD_FILTERS: { value: PeriodKey; label: string }[] = [
  { value: "mes", label: "Este mês" },
  { value: "3meses", label: "Últimos 3 meses" },
  { value: "ano", label: "Este ano" },
  { value: "todos", label: "Todos" },
  { value: "personalizado", label: "Personalizado" },
];

function ComissoesPage() {
  const { isCriador, isAdmin } = useRoles();
  const creatorView = isCriador && !isAdmin;

  const seller = useSellerCommissions();
  const creator = useCreatorCommissions();
  const { data: withdrawals = [] } = useMyWithdrawals();
  const { data: goal } = useCurrentGoal();

  const rows: CommissionRow[] = creatorView ? (creator.data?.rows ?? []) : (seller.data ?? []);
  const totals = summarize(rows, withdrawals);

  const [status, setStatus] = useState<string>("todos");
  const [period, setPeriod] = useState<PeriodKey>("todos");
  const [custom, setCustom] = useState({ from: "", to: "" });
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return rows.filter((row) => {
      if (status !== "todos" && row.status !== status) return false;
      if (!inPeriod(row.date, period, custom)) return false;
      if (term && !`${row.client} ${row.reference} ${row.type}`.toLowerCase().includes(term)) return false;
      return true;
    });
  }, [rows, status, period, custom, search]);

  const filteredTotal = filtered.reduce((total, row) => total + row.amount, 0);
  const saqueLink = creatorView ? "/meus-saques" : "/financeiro";

  return (
    <AppShell
      title="Minhas comissões"
      description={
        creatorView
          ? "Comissões dos seus projetos de criação — percentuais definidos pela administração."
          : "Seus bônus de venda — percentuais definidos pela administração."
      }
      actions={
        <Button asChild>
          <Link to={saqueLink}>
            <Wallet className="size-4" /> Solicitar saque
          </Link>
        </Button>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard label="Total recebido" value={currency(totals.paid)} hint="Comissões já pagas" icon={Banknote} />
        <StatCard
          label={creatorView ? "Comissão pendente" : "Valores pendentes"}
          value={currency(totals.pending)}
          hint="Aguardando liberação"
          icon={Clock}
        />
        <StatCard
          label="Disponível para saque"
          value={currency(totals.balance)}
          hint={totals.requested > 0 ? `${currency(totals.requested)} em análise` : "Livre para solicitar"}
          icon={Wallet}
        />
        {creatorView ? (
          <>
            <StatCard
              label="Projetos entregues"
              value={String(creator.data?.delivered ?? 0)}
              hint="Entregas concluídas"
              icon={Package}
            />
            <StatCard
              label="Projetos em andamento"
              value={String(creator.data?.inProgress ?? 0)}
              hint="Em produção ou aprovação"
              icon={Layers}
            />
          </>
        ) : (
          <>
            <StatCard
              label="Bônus do mês"
              value={currency(totals.currentMonth)}
              hint="Referente ao mês atual"
              icon={CalendarDays}
            />
            <StatCard
              label="Meta atual"
              value={goal ? currency(goal.revenue_target) : "—"}
              hint={goal ? `${goal.sales_target} vendas no mês` : "Nenhuma meta definida"}
              icon={Target}
            />
          </>
        )}
      </div>

      <section className="mt-6 overflow-hidden rounded-2xl border border-border bg-card shadow-panel">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3">
          <h2 className="text-sm font-semibold">Histórico financeiro</h2>
          <span className="text-xs text-muted-foreground">
            {filtered.length} registro(s) · {currency(filteredTotal)}
          </span>
        </div>

        <div className="flex flex-col gap-3 border-b border-border px-4 py-3">
          <div className="flex flex-wrap gap-2">
            {STATUS_FILTERS.map((item) => (
              <FilterChip
                key={item.value}
                active={status === item.value}
                onClick={() => setStatus(item.value)}
                label={item.label}
              />
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            {PERIOD_FILTERS.map((item) => (
              <FilterChip
                key={item.value}
                active={period === item.value}
                onClick={() => setPeriod(item.value)}
                label={item.label}
              />
            ))}
          </div>
          {period === "personalizado" ? (
            <div className="flex flex-wrap items-center gap-2">
              <Input
                type="date"
                className="w-auto"
                value={custom.from}
                onChange={(event) => setCustom((prev) => ({ ...prev, from: event.target.value }))}
                aria-label="Data inicial"
              />
              <span className="text-xs text-muted-foreground">até</span>
              <Input
                type="date"
                className="w-auto"
                value={custom.to}
                onChange={(event) => setCustom((prev) => ({ ...prev, to: event.target.value }))}
                aria-label="Data final"
              />
            </div>
          ) : null}
          <div className="relative max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={creatorView ? "Buscar cliente ou projeto" : "Buscar cliente ou contrato"}
              className="pl-9"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[46rem] text-sm">
            <thead className="bg-secondary/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">Data</th>
                <th className="px-4 py-3 font-medium">Cliente</th>
                <th className="px-4 py-3 font-medium">{creatorView ? "Projeto" : "Contrato"}</th>
                <th className="px-4 py-3 font-medium">{creatorView ? "Valor do projeto" : "Tipo"}</th>
                <th className="px-4 py-3 font-medium">{creatorView ? "% do criador" : "Percentual"}</th>
                <th className="px-4 py-3 font-medium">{creatorView ? "Comissão" : "Valor recebido"}</th>
                <th className="px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((row) => (
                <tr key={row.id} className="transition-colors hover:bg-secondary/40">
                  <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">{shortDate(row.date)}</td>
                  <td className="px-4 py-3">{row.client}</td>
                  <td className="px-4 py-3 text-muted-foreground">{row.reference}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
                    {creatorView ? currency(row.base) : row.type}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">{row.rate}%</td>
                  <td className="whitespace-nowrap px-4 py-3 font-medium text-success">{currency(row.amount)}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={row.status} />
                  </td>
                </tr>
              ))}
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-14 text-center text-sm text-muted-foreground">
                    Você ainda não possui comissões disponíveis.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-6 overflow-hidden rounded-2xl border border-border bg-card shadow-panel">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3">
          <h2 className="text-sm font-semibold">Saques</h2>
          <span className="text-xs text-muted-foreground">
            Saldo disponível: <strong className="text-success">{currency(totals.balance)}</strong>
          </span>
        </div>
        <ul className="divide-y divide-border">
          {withdrawals.map((item) => (
            <li
              key={item.id}
              className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-sm transition-colors hover:bg-secondary/40"
            >
              <span className="min-w-0">
                <span className="block font-medium">{currency(item.amount)}</span>
                <span className="block text-xs text-muted-foreground">
                  Solicitado em {shortDate(item.created_at)} · PIX {item.pix_key ?? "—"}
                </span>
              </span>
              <span className="flex items-center gap-3">
                {item.paid_at ? (
                  <span className="text-xs text-muted-foreground">Pago em {shortDate(item.paid_at)}</span>
                ) : null}
                <StatusBadge status={item.status} />
              </span>
            </li>
          ))}
          {withdrawals.length === 0 ? (
            <li className="px-4 py-10 text-center text-sm text-muted-foreground">
              Nenhuma solicitação de saque registrada.
            </li>
          ) : null}
        </ul>
      </section>
    </AppShell>
  );
}

function FilterChip({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full border px-3 py-1.5 text-xs transition-all duration-200 hover:-translate-y-0.5",
        active
          ? "border-primary bg-primary/15 text-primary shadow-glow"
          : "border-border text-muted-foreground hover:border-primary/40 hover:text-foreground",
      )}
    >
      {label}
    </button>
  );
}
