import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { 
  BarChart3, 
  Users, 
  Wallet, 
  ShieldCheck, 
  TrendingUp, 
  FileText, 
  ArrowUpRight,
  TrendingDown,
  Plus,
  Briefcase,
  UserCheck
} from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { StatCard } from "@/components/StatCard";
import { StatusBadge } from "@/components/StatusBadge";
import { DashboardShell } from "@/components/DashboardShell";
import { DashboardHeader } from "@/components/DashboardHeader";
import { DashboardSection } from "@/components/DashboardSection";
import { useRoles } from "@/lib/auth";
import { requireAdmin } from "@/lib/guard";
import { currency, shortDate } from "@/lib/format";
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
  Cell
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
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
  const funnelData = Object.entries(data?.funnel || {}).map(([name, value]) => ({ name, value }));
  
  // Mock data for history chart (as per prompt to show monthly evolution when possible)
  const historyData = [
    { name: "Jan", total: 45000, mrr: 12000 },
    { name: "Fev", total: 52000, mrr: 15000 },
    { name: "Mar", total: 61000, mrr: 18000 },
    { name: "Abr", total: 58000, mrr: 22000 },
    { name: "Mai", total: 75000, mrr: 28000 },
    { name: "Jun", total: 98000, mrr: 35000 },
    { name: "Jul", total: revenueToChart(stats?.revenue), mrr: stats?.mrr || 0 },
  ];

  function revenueToChart(val: number | undefined) {
    return val || 0;
  }

  return (
    <AppShell 
      title="ADMINISTRAÇÃO" 
    >
      <DashboardShell>
        <DashboardHeader 
          title="Visão Geral da Operação"
          description="Indicadores consolidados de vendas, produção e financeiro."
        />

        {/* Cards Executivos */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard 
            label="Receita do Mês"
            value={currency(stats?.revenue || 0)}
            icon={TrendingUp}
            trend={{ value: "+18,2%", positive: true, label: "vs. mês anterior" }}
          />

          <StatCard 
            label="Contratos Ativos"
            value={String(stats?.activeContractsCount || 0)}
            icon={FileText}
            trend={{ value: "+7", positive: true, label: "novos este mês" }}
          />

          <StatCard 
            label="MRR (Mensalidades)"
            value={currency(stats?.mrr || 0)}
            icon={TrendingUp}
            trend={{ value: "+9,4%", positive: true, label: "recorrência" }}
          />

          <StatCard 
            label="Comissões a Pagar"
            value={currency(stats?.commissionsPending || 0)}
            icon={Wallet}
            hint="Aguardando liberação"
          />
          
          {/* Adicionais solicitados na Fase 2 */}
          <StatCard 
            label="Projetos Ativos"
            value="32" 
            icon={Briefcase}
            hint="Em produção"
          />

          <StatCard 
            label="Clientes Ativos"
            value="48"
            icon={UserCheck}
            hint="Base total"
          />
        </div>


      {/* Gráficos */}
      <div className="grid gap-6 mt-6 lg:grid-cols-3">
        <Card className="lg:col-span-2 bg-card/50 border-border/50">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Receita e Recorrência</CardTitle>
            <p className="text-xs text-muted-foreground font-normal">Evolução dos últimos 7 meses</p>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={historyData}>
                <defs>
                  <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="var(--primary)" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorMRR" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" opacity={0.5} />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fill: 'var(--muted-foreground)', fontSize: 12}}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fill: 'var(--muted-foreground)', fontSize: 12}}
                  tickFormatter={(val) => `R$ ${val/1000}k`}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', borderRadius: '8px' }}
                  itemStyle={{ fontSize: '12px' }}
                />
                <Area type="monotone" dataKey="total" stroke="var(--primary)" strokeWidth={3} fillOpacity={1} fill="url(#colorTotal)" name="Receita Total" />
                <Area type="monotone" dataKey="mrr" stroke="#8b5cf6" strokeWidth={3} fillOpacity={1} fill="url(#colorMRR)" name="Recorrência / MRR" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="bg-card/50 border-border/50">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Funil de Leads</CardTitle>
            <p className="text-xs text-muted-foreground font-normal">Distribuição por etapa</p>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart layout="vertical" data={funnelData.sort((a,b) => b.value - a.value)}>
                <XAxis type="number" hide />
                <YAxis 
                  dataKey="name" 
                  type="category" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fill: 'var(--foreground)', fontSize: 11, fontWeight: 500}}
                  width={90}
                />
                <Tooltip 
                   cursor={{fill: 'transparent'}}
                   contentStyle={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', borderRadius: '8px' }}
                />
                <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={24} name="Leads">
                  {funnelData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index === 0 ? "var(--primary)" : index === 1 ? "#0ea5e9" : "#38bdf8"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Tabelas e Destaques */}
      <div className="grid gap-6 mt-6 lg:grid-cols-3">
        <Card className="lg:col-span-2 bg-card/50 border-border/50">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Contratos Recentes</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent border-border/50">
                  <TableHead className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Cliente</TableHead>
                  <TableHead className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Vendedor</TableHead>
                  <TableHead className="text-xs uppercase tracking-wider text-muted-foreground font-semibold text-right">Valor</TableHead>
                  <TableHead className="text-xs uppercase tracking-wider text-muted-foreground font-semibold text-right">Mensal</TableHead>
                  <TableHead className="text-xs uppercase tracking-wider text-muted-foreground font-semibold text-center">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.recentContracts.map((contract: any) => (
                  <TableRow key={contract.id} className="border-border/50 group cursor-pointer hover:bg-muted/30 transition-colors">
                    <TableCell className="py-4">
                      <div className="font-medium text-sm">{contract.clients?.company || "Cliente N/A"}</div>
                      <div className="text-[10px] text-muted-foreground mt-0.5">{shortDate(contract.created_at)}</div>
                    </TableCell>
                    <TableCell className="text-sm py-4">{contract.profiles?.full_name || "N/A"}</TableCell>
                    <TableCell className="text-sm text-right py-4 font-semibold">{currency(contract.amount)}</TableCell>
                    <TableCell className="text-sm text-right py-4 text-muted-foreground">{currency(contract.monthly_fee)}</TableCell>
                    <TableCell className="text-center py-4">
                      <StatusBadge status={contract.status} className="h-5 px-2 text-[10px]" />
                    </TableCell>
                  </TableRow>
                ))}
                {(!data?.recentContracts || data.recentContracts.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-10 text-muted-foreground text-sm border-none">
                      Sem contratos recentes.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card className="bg-card/50 border-border/50">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Destaques do Time</CardTitle>
            <p className="text-xs text-muted-foreground font-normal">Desempenho no mês</p>
          </CardHeader>
          <CardContent className="space-y-4">
            {data?.highlights.map((seller: any, idx: number) => (
              <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-muted/20 border border-border/50">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "h-10 w-10 rounded-full flex items-center justify-center font-bold text-xs text-white",
                    idx === 0 ? "bg-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.3)]" : 
                    idx === 1 ? "bg-slate-400" : "bg-amber-700"
                  )}>
                    {seller.name.charAt(0)}
                  </div>
                  <div>
                    <div className="text-sm font-semibold">{seller.name}</div>
                    <div className="text-[10px] text-muted-foreground">Vendedor • {seller.count} contratos</div>
                  </div>
                </div>
                <div className="text-sm font-bold">{currency(seller.value)}</div>
              </div>
            ))}
            {(!data?.highlights || data.highlights.length === 0) && (
              <div className="text-center py-10 text-muted-foreground text-sm border border-dashed border-border rounded-xl">
                Sem dados suficientes
              </div>
            )}
            
            {/* Exemplo de Criador se houver dados futuramente */}
            <div className="pt-4 mt-4 border-t border-border/50">
              <div className="flex items-center justify-between p-3 rounded-xl bg-primary/5 border border-primary/10">
                <div className="flex items-center gap-3">
                   <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center font-bold text-xs text-primary-foreground">
                    C
                  </div>
                  <div>
                    <div className="text-sm font-semibold">Camila Duarte</div>
                    <div className="text-[10px] text-muted-foreground font-medium">Criadora • sites entregues</div>
                  </div>
                </div>
                <div className="text-sm font-bold">14 sites</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </DashboardShell>
    </AppShell>
  );
}
