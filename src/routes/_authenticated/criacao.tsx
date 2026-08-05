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
  Trophy,
  Flame,
  Star,
  Gem,
  AlertCircle,
  Calendar,
  ExternalLink,
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
import { Button } from "@/components/ui/button";
import { requireCriador } from "@/lib/guard";
import { useRows } from "@/lib/data";
import {
  creatorEarnings,
  monthlySeries,
  useMyCreatorProjects,
} from "@/lib/creator";
import { currency, shortDate } from "@/lib/format";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/criacao")({
  beforeLoad: () => requireCriador(),
  head: () => ({
    meta: [
      { title: "Painel do criador — ScaleNexus" },
      {
        name: "description",
        content: "Projetos atribuídos, prazos e comissões do criador ScaleNexus.",
      },
      { property: "og:title", content: "Painel do criador — ScaleNexus" },
      { property: "og:description", content: "Acompanhe seus projetos e ganhos na ScaleNexus." },
    ],
  }),
  component: PainelCriador,
});

type Withdrawal = { id: string; amount: number; status: string; created_at: string };

function PainelCriador() {
  const { data: mine = [] } = useMyCreatorProjects();
  const { data: withdrawals = [] } = useRows<Withdrawal>("withdrawals");

  const earnings = creatorEarnings(mine, withdrawals);
  const series = monthlySeries(mine, earnings.commissionOf);

  const inProduction = mine.filter((p) => p.status === "em_producao" || p.status === "briefing");
  const pendingApproval = mine.filter((p) => p.status === "aguardando_aprovacao" || p.status === "aguardando_cliente");
  const delivered = mine.filter((p) => p.status === "entregue");
  const approved = mine.filter((p) => p.status === "aprovado");
  const active = mine.filter((p) => !["entregue", "cancelado"].includes(p.status));

  // Cálculo de Prazos
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const deadlines = active.map(p => {
    if (!p.due_date) return null;
    const due = new Date(p.due_date);
    due.setHours(0, 0, 0, 0);
    const diff = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return { ...p, diff };
  }).filter(Boolean).sort((a, b) => a!.diff - b!.diff);

  const urgent = deadlines.filter(d => d!.diff <= 0);
  const near = deadlines.filter(d => d!.diff > 0 && d!.diff <= 3);
  const onTime = deadlines.filter(d => d!.diff > 3);

  // Desempenho
  const finishedOnTimeCount = delivered.filter(p => {
    if (!p.delivered_at || !p.due_date) return true;
    return new Date(p.delivered_at) <= new Date(p.due_date);
  }).length;
  
  const completionRate = mine.length > 0 ? Math.round((delivered.length / mine.length) * 100) : 0;

  return (
    <AppShell
      title="Painel do criador"
      description="Dashboard de acompanhamento de projetos e comissões."
    >
      {/* 2. CARDS DE RESUMO */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard 
          label="Projetos ativos" 
          value={String(active.length)} 
          hint="Total em aberto" 
          icon={Layers} 
        />
        <StatCard 
          label="Em produção" 
          value={String(inProduction.length)} 
          hint="Desenvolvimento" 
          icon={Hammer} 
        />
        <StatCard 
          label="Aguardando aprovação" 
          value={String(pendingApproval.length)} 
          hint="Revisão interna/cliente" 
          icon={Clock} 
        />
        <StatCard 
          label="Entregues" 
          value={String(delivered.length)} 
          hint="Concluídos" 
          icon={PackageCheck} 
        />
        <StatCard 
          label="Comissões disponíveis" 
          value={currency(earnings.balance)} 
          hint="Liberado para saque" 
          icon={Wallet} 
        />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        {/* 3. MEUS PROJETOS (Resumo) */}
        <section className="lg:col-span-2 space-y-6">
          <div className="rounded-2xl border border-border bg-card shadow-panel overflow-hidden">
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <h2 className="font-semibold">Meus Projetos Recentes</h2>
              <Button asChild variant="ghost" size="sm">
                <Link to="/meus-projetos">Ver todos</Link>
              </Button>
            </div>
            <div className="divide-y divide-border">
              {active.slice(0, 5).map((project) => (
                <div key={project.id} className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors">
                  <div className="min-w-0 flex-1 pr-4">
                    <div className="flex items-center gap-2">
                      <span className="truncate font-medium">{project.title}</span>
                      <StatusBadge status={project.status} />
                    </div>
                    <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                      <span>{project.site_type || "Site"}</span>
                      <span>Início: {shortDate(project.assigned_at || project.created_at)}</span>
                      <span className={cn(
                        project.due_date && new Date(project.due_date) < today && "text-destructive font-bold"
                      )}>
                        Prazo: {shortDate(project.due_date)}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-primary">{currency(earnings.commissionOf(project))}</div>
                    <Button asChild size="sm" variant="ghost" className="h-8 px-2 mt-1">
                      <Link to="/projetos/$projectId" params={{ projectId: project.id }} className="gap-1">
                        Abrir <ExternalLink className="size-3" />
                      </Link>
                    </Button>
                  </div>
                </div>
              ))}
              {active.length === 0 && (
                <div className="p-8 text-center text-sm text-muted-foreground">
                  Nenhum projeto ativo atribuído.
                </div>
              )}
            </div>
          </div>

          {/* Grafico de Projetos */}
          <section className="rounded-2xl border border-border bg-card p-5 shadow-panel">
            <h2 className="text-sm font-semibold mb-4">Volume de Projetos (Últimos 6 meses)</h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={series}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" vertical={false} />
                  <XAxis dataKey="label" tickLine={false} axisLine={false} className="text-xs" />
                  <YAxis allowDecimals={false} tickLine={false} axisLine={false} className="text-xs" width={30} />
                  <Tooltip 
                    cursor={{ opacity: 0.1 }} 
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }}
                  />
                  < Bar dataKey="projetos" radius={[6, 6, 0, 0]} fill="var(--primary)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>
        </section>

        <aside className="space-y-6">
          {/* 5. PRAZOS */}
          <section className="rounded-2xl border border-border bg-card shadow-panel">
            <h2 className="border-b border-border px-4 py-3 text-sm font-semibold flex items-center gap-2">
              <Calendar className="size-4 text-primary" /> Próximos Prazos
            </h2>
            <div className="p-4 space-y-4">
              {urgent.length > 0 && (
                <div className="space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-destructive flex items-center gap-1">
                    <AlertCircle className="size-3" /> Entrega hoje ou atrasado
                  </span>
                  {urgent.map(d => (
                    <div key={d!.id} className="rounded-lg bg-destructive/10 border border-destructive/20 p-2 text-xs">
                      <div className="font-bold flex justify-between">
                        <span className="truncate">{d!.title}</span>
                        <span className="text-destructive whitespace-nowrap">{d!.diff < 0 ? 'ATRASADO' : 'HOJE'}</span>
                      </div>
                      <div className="text-muted-foreground mt-0.5">{shortDate(d!.due_date)}</div>
                    </div>
                  ))}
                </div>
              )}

              {near.length > 0 && (
                <div className="space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-warning">🟠 Entrega próxima</span>
                  {near.map(d => (
                    <div key={d!.id} className="rounded-lg bg-warning/10 border border-warning/20 p-2 text-xs">
                      <div className="font-bold flex justify-between">
                        <span className="truncate">{d!.title}</span>
                        <span className="text-warning whitespace-nowrap">{d!.diff} dia{d!.diff > 1 ? 's' : ''}</span>
                      </div>
                      <div className="text-muted-foreground mt-0.5">{shortDate(d!.due_date)}</div>
                    </div>
                  ))}
                </div>
              )}

              {onTime.length > 0 && (
                <div className="space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-success">🟢 Dentro do prazo</span>
                  {onTime.slice(0, 3).map(d => (
                    <div key={d!.id} className="rounded-lg bg-success/10 border border-success/20 p-2 text-xs">
                      <div className="font-bold flex justify-between">
                        <span className="truncate">{d!.title}</span>
                        <span className="text-success whitespace-nowrap">{d!.diff} dias</span>
                      </div>
                      <div className="text-muted-foreground mt-0.5">{shortDate(d!.due_date)}</div>
                    </div>
                  ))}
                </div>
              )}

              {deadlines.length === 0 && (
                <p className="text-center py-4 text-xs text-muted-foreground">Sem prazos definidos.</p>
              )}
            </div>
          </section>

          {/* 6. COMISSÕES (Resumo) */}
          <section className="rounded-2xl border border-border bg-card shadow-panel">
            <h2 className="border-b border-border px-4 py-3 text-sm font-semibold flex items-center gap-2">
              <Wallet className="size-4 text-primary" /> Resumo Financeiro
            </h2>
            <div className="p-4 space-y-3">
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Total de comissões</span>
                <span className="font-semibold">{currency(earnings.paid + earnings.released + earnings.pending)}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Disponível</span>
                <span className="font-bold text-success">{currency(earnings.balance)}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">A receber</span>
                <span className="font-medium text-warning">{currency(earnings.pending)}</span>
              </div>
              <div className="flex justify-between items-center text-sm border-t border-border pt-2">
                <span className="text-muted-foreground">Já recebido</span>
                <span className="font-medium">{currency(earnings.withdrawn)}</span>
              </div>
              <Button asChild className="w-full mt-2" size="sm">
                <Link to="/financeiro">Ver minhas comissões</Link>
              </Button>
            </div>
          </section>

          {/* 7. DESEMPENHO */}
          <section className="rounded-2xl border border-border bg-card shadow-panel">
            <h2 className="border-b border-border px-4 py-3 text-sm font-semibold flex items-center gap-2">
              <TrendingUp className="size-4 text-primary" /> Meu Desempenho
            </h2>
            <div className="p-4 grid grid-cols-2 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold">{delivered.length}</div>
                <div className="text-[10px] text-muted-foreground uppercase">Projetos Concluídos</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{completionRate}%</div>
                <div className="text-[10px] text-muted-foreground uppercase">Taxa de Conclusão</div>
              </div>
            </div>

            <div className="px-4 pb-4 space-y-2">
              <div className="text-xs font-semibold mb-2">Conquistas & Troféus</div>
              <div className="grid grid-cols-2 gap-2">
                <AchievementCard 
                  icon={Trophy} 
                  label="Concluídos" 
                  value={delivered.length} 
                  active={delivered.length > 0} 
                />
                <AchievementCard 
                  icon={Flame} 
                  label="No Prazo" 
                  value={finishedOnTimeCount} 
                  active={finishedOnTimeCount > 0} 
                />
                <AchievementCard 
                  icon={Star} 
                  label="Destaque" 
                  value="" 
                  active={completionRate >= 90 && delivered.length >= 5} 
                />
                <AchievementCard 
                  icon={Gem} 
                  label="10 Concluídos" 
                  value="" 
                  active={delivered.length >= 10} 
                />
              </div>
            </div>
          </section>
        </aside>
      </div>
    </AppShell>
  );
}

function AchievementCard({ icon: Icon, label, value, active }: { icon: any, label: string, value: string | number, active: boolean }) {
  return (
    <div className={cn(
      "flex flex-col items-center justify-center rounded-xl border p-2 text-center transition-all",
      active ? "bg-primary/5 border-primary/20 text-primary shadow-sm" : "bg-muted/50 border-border text-muted-foreground opacity-50 grayscale"
    )}>
      <Icon className="size-4 mb-1" />
      <span className="text-[9px] font-bold uppercase leading-none">{label}</span>
      {value !== "" && <span className="text-xs font-bold mt-0.5">{value}</span>}
    </div>
  );
}
