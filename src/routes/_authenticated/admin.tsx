import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { BarChart3, Wallet, TrendingUp, FileText } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { LegacyMetricCard } from "@/components/admin/LegacyMetricCard";
import { StatusBadge } from "@/components/StatusBadge";
import { DashboardShell } from "@/components/DashboardShell";
import { useRoles } from "@/lib/auth";
import { requireAdmin } from "@/lib/guard";
import { currency, shortDate, label as statusLabel, LEAD_STATUS } from "@/lib/format";
import { getAdminDashboardData } from "@/lib/admin-dashboard.functions";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/admin")({
  beforeLoad: () => requireAdmin(),
  head: () => ({
    meta: [
      { title: "Visão Geral da Operação — ScaleNexus" },
      { name: "description", content: "Indicadores consolidados de vendas, produção e financeiro." },
    ],
  }),
  component: AdminDashboardPage,
});


function AdminDashboardPage() {
  const { isAdmin, loading: rolesLoading } = useRoles();
  
  const { data, isLoading } = useQuery({
    queryKey: ["admin-dashboard-data"],
    queryFn: () => getAdminDashboardData(),
    enabled: isAdmin,
  });

  if (rolesLoading || isLoading) {
    return (
      <AppShell title="VISÃO GERAL DA OPERAÇÃO" description="Indicadores consolidados de vendas, produção e financeiro.">
        <div className="flex h-[400px] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
        </div>
      </AppShell>
    );
  }

  const stats = data?.stats;
  const rawFunnel = data?.funnel || {};
  const funnelData = Object.entries(rawFunnel)
    .map(([status, value]) => ({ status, name: statusLabel(status), value: Number(value) || 0 }))
    .sort(
      (a, b) =>
        (LEAD_STATUS.indexOf(a.status as never) + 1 || 99) -
        (LEAD_STATUS.indexOf(b.status as never) + 1 || 99),
    );
  const funnelTotal = funnelData.reduce((acc, f) => acc + f.value, 0);

  
  // Série construída apenas com dados reais dos contratos retornados pelo backend.
  const historyData = [...(data?.recentContracts ?? [])]
    .reverse()
    .map((contract: any) => ({
      name: shortDate(contract.signed_at || contract.created_at),
      total: Number(contract.amount) || 0,
      mrr: Number(contract.monthly_fee) || 0,
    }));

  return (
    <AppShell 
      title="Visão Geral da Operação"
      description="Indicadores consolidados de vendas, produção e financeiro."
    >
      <DashboardShell className="animate-fade-in space-y-4 font-sans">
        <span className="block text-xs text-muted-foreground/80">
          {funnelTotal} leads em pipeline · {data?.highlights?.length || 0} vendedores com contratos ativos
        </span>

        {/* Faixa 1 — Cards executivos */}
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <LegacyMetricCard
            label="Receita do Mês"
            value={currency(stats?.revenue || 0)}
            icon={TrendingUp}
            hint="Contratos ativos"
          />

          <LegacyMetricCard
            label="Contratos Ativos"
            value={String(stats?.activeContractsCount || 0)}
            icon={FileText}
            hint="Base contratada"
          />

          <LegacyMetricCard
            label="MRR (Mensalidades)"
            value={currency(stats?.mrr || 0)}
            icon={BarChart3}
            hint="Recorrência mensal"
          />

          <LegacyMetricCard
            label="Comissões a Pagar"
            value={currency(stats?.commissionsPending || 0)}
            icon={Wallet}
            hint="Aguardando liberação"
          />
        </div>


        {/* Faixa 2 — Área analítica */}
        <div className="grid gap-4 lg:grid-cols-3">
          <section className="surface p-5 lg:col-span-2">
            <div className="mb-4">
              <h3 className="font-display text-lg font-semibold">Receita e Recorrência</h3>
              <p className="text-sm text-muted-foreground">
                Contratos recentes — valor total e mensalidade
              </p>
            </div>
            <div className="h-[260px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={historyData}>
                  <defs>
                    <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--chart-1)" stopOpacity={0.5} />
                      <stop offset="95%" stopColor="var(--chart-1)" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorMRR" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--chart-2)" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="var(--chart-2)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
                    tickFormatter={(val) => `R$ ${val / 1000}k`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "var(--card)",
                      borderColor: "var(--border)",
                      borderRadius: "12px",
                      color: "var(--foreground)",
                    }}
                    itemStyle={{ fontSize: "12px" }}
                  />
                  <Area
                    type="monotone"
                    dataKey="total"
                    stroke="var(--chart-1)"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorTotal)"
                    name="Receita Total"
                  />
                  <Area
                    type="monotone"
                    dataKey="mrr"
                    stroke="var(--chart-2)"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorMRR)"
                    name="Recorrência / MRR"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </section>

          <section className="surface p-5">
            <div className="mb-4">
              <h3 className="font-display text-lg font-semibold">Funil de Leads</h3>
              <p className="text-sm text-muted-foreground">Distribuição por etapa</p>
            </div>
            <div className="h-[260px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart layout="vertical" data={funnelData} margin={{ left: 4, right: 12 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--border)" />
                  <XAxis type="number" hide />
                  <YAxis
                    dataKey="name"
                    type="category"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
                    width={104}
                  />
                  <Tooltip
                    cursor={{ fill: "transparent" }}
                    contentStyle={{
                      backgroundColor: "var(--card)",
                      borderColor: "var(--border)",
                      borderRadius: "12px",
                      color: "var(--foreground)",
                    }}
                  />
                  <Bar
                    dataKey="value"
                    radius={[0, 4, 4, 0]}
                    barSize={16}
                    name="Leads"
                    fill="var(--chart-1)"
                  />
                </BarChart>

              </ResponsiveContainer>
            </div>
          </section>
        </div>

        {/* Faixa 3 — Tabelas e destaques */}
        <div className="grid gap-4 lg:grid-cols-3">
          <section className="surface overflow-hidden lg:col-span-2">
            <div className="border-b border-border/60 p-5">
              <h3 className="font-display text-lg font-semibold">Contratos Recentes</h3>
              <p className="text-sm text-muted-foreground">Últimos contratos registrados</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <th className="px-5 py-3 font-medium">Cliente</th>
                    <th className="px-5 py-3 font-medium">Vendedor</th>
                    <th className="px-5 py-3 text-right font-medium">Valor</th>
                    <th className="px-5 py-3 text-right font-medium">Mensal</th>
                    <th className="px-5 py-3 text-center font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {data?.recentContracts.map((contract: any) => (
                    <tr
                      key={contract.id}
                      className="border-t border-border/60 transition-colors hover:bg-muted/30"
                    >
                      <td className="px-5 py-3">
                        <div className="truncate font-medium">
                          {contract.clients?.company || "Cliente N/A"}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {shortDate(contract.created_at)}
                        </div>
                      </td>
                      <td className="px-5 py-3 text-muted-foreground">
                        <span className="block max-w-[180px] truncate">
                          {contract.profiles?.full_name || "N/A"}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-right font-medium">
                        {currency(contract.amount)}
                      </td>
                      <td className="px-5 py-3 text-right text-muted-foreground">
                        {currency(contract.monthly_fee)}
                      </td>
                      <td className="px-5 py-3 text-center">
                        <StatusBadge status={contract.status} className="h-5 px-2 text-xs" />
                      </td>
                    </tr>
                  ))}
                  {(!data?.recentContracts || data.recentContracts.length === 0) && (
                    <tr className="border-t border-border/60">
                      <td colSpan={5} className="px-5 py-10 text-center text-sm text-muted-foreground">
                        Sem contratos recentes.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          <section className="surface p-5">
            <div className="mb-4">
              <h3 className="font-display text-lg font-semibold">Destaques do Time</h3>
              <p className="text-sm text-muted-foreground">Desempenho no mês</p>
            </div>
            <ul className="space-y-2">
              {data?.highlights.map((seller: any, idx: number) => (
                <li
                  key={idx}
                  className="flex items-center gap-3 rounded-lg border border-border/60 bg-muted/20 px-3 py-2"
                >
                  <span
                    className={cn(
                      "flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary",
                    )}
                  >
                    {seller.name.charAt(0)}
                  </span>

                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium">{seller.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {seller.count} contratos
                    </div>
                  </div>
                  <div className="text-sm font-semibold">{currency(seller.value)}</div>
                </li>
              ))}
            </ul>
            {(!data?.highlights || data.highlights.length === 0) && (
              <div className="rounded-lg border border-dashed border-border/60 py-10 text-center text-sm text-muted-foreground">
                Sem dados suficientes
              </div>
            )}
          </section>
        </div>
      </DashboardShell>
    </AppShell>
  );
}

