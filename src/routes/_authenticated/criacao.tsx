import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
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
  Rocket,
  ArrowRight,
  Target,
  History,
  LayoutDashboard,
  ArrowUpRight,
  Briefcase,
  UserCheck
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Cell,
  Area,
  AreaChart,
} from "recharts";
import { AppShell } from "@/components/AppShell";
import { StatCard } from "@/components/StatCard";
import { StatusBadge } from "@/components/StatusBadge";
import { DashboardShell } from "@/components/DashboardShell";
import { DashboardHeader } from "@/components/DashboardHeader";
import { DashboardSection } from "@/components/DashboardSection";
import { Button } from "@/components/ui/button";
import { requireCriador } from "@/lib/guard";
import { useRows } from "@/lib/data";
import {
  creatorEarnings,
  monthlySeries,
  useMyCreatorProjetos,
} from "@/lib/creator";
import { currency, shortDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useProfile } from "@/lib/auth";
import { SalesProgression } from "@/components/SalesProgression";
import { Progress } from "@/components/ui/progress";

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
  const navigate = useNavigate();
  const { data: profile } = useProfile();
  const { data: mine = [] } = useMyCreatorProjetos();
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

  const progressionData = [
    { name: "Recebidos", value: mine.length, color: "var(--primary)" },
    { name: "Produção", value: inProduction.length, color: "#3B82F6" },
    { name: "Revisão", value: pendingApproval.length, color: "#F59E0B" },
    { name: "Aprovados", value: approved.length, color: "#10B981" },
    { name: "Entregues", value: delivered.length, color: "#8B5CF6" },
  ];

  return (
    <AppShell
      title="CENTRAL DE PRODUÇÃO"
    >
      <DashboardShell>
        <DashboardHeader 
          title={`Olá, ${profile?.full_name?.split(' ')[0] || "Criador"} 👋`}
          description="Gerencie seus projetos, prazos e desempenho profissional."
        />
        
        <div className="flex justify-end mb-6">
          <Button asChild className="shadow-glow bg-primary hover:bg-primary/90">
            <Link to="/disponiveis">
              <Rocket className="mr-2 size-4" /> Criar novo site
            </Link>
          </Button>
        </div>

        {/* 2. CARDS DE RESUMO */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <StatCard 
            label="Em andamento" 
            value={String(active.length)} 
            icon={Layers}
            onClick={() => navigate({ to: "/meus-projetos" })}
          />
          <StatCard 
            label="Aguardando aprovação" 
            value={String(pendingApproval.length)} 
            icon={Clock} 
            status={pendingApproval.length > 0 ? 'warning' : 'idle'}
            onClick={() => navigate({ to: "/aprovacoes" })}
          />
          <StatCard 
            label="Projetos entregues" 
            value={String(delivered.length)} 
            icon={PackageCheck} 
            status="success"
            onClick={() => navigate({ to: "/meus-projetos" })}
          />
          <StatCard 
            label="Comissão acumulada" 
            value={currency(earnings.paid + earnings.released + earnings.pending)} 
            icon={Banknote} 
            onClick={() => navigate({ to: "/comissoes" })}
          />
          <StatCard 
            label="Disponível saque" 
            value={currency(earnings.balance)} 
            icon={Wallet} 
            status={earnings.balance > 0 ? 'active' : 'idle'}
            onClick={() => navigate({ to: "/meus-saques" })}
          />
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-3">
          {/* 3. MEUS PROJETOS (Resumo) */}
          <section className="space-y-4 lg:col-span-2">
            <div className="premium-card card-hover overflow-hidden">
              <div className="flex items-center justify-between border-b border-border/50 px-6 py-4">
                <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                  <History className="size-4 text-primary" /> Projetos em Andamento
                </h2>
                <Button asChild variant="ghost" size="sm" className="text-xs text-brand-500 hover:text-brand-600 uppercase font-bold tracking-widest">
                  <Link to="/meus-projetos">Ver todos</Link>
                </Button>
              </div>
              <div className="divide-y divide-border/30">
                {active.slice(0, 5).map((project) => (
                  <div key={project.id} className="p-6 hover:bg-muted/20 transition-colors">
                    <div className="flex items-center justify-between mb-4">
                      <div className="min-w-0 flex-1 pr-4">
                        <div className="flex items-center gap-2">
                          <span className="truncate font-bold text-base">{project.title}</span>
                          <StatusBadge status={project.status} className="h-5 px-2 text-[10px]" />
                        </div>
                        <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground font-medium uppercase tracking-tight">
                          <span className="flex items-center gap-1"><Rocket className="size-3" /> {project.site_type || "Site"}</span>
                          <span className="flex items-center gap-1"><Calendar className="size-3" /> Início: {shortDate(project.assigned_at || project.created_at)}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-black text-primary text-xl">{currency(earnings.commissionOf(project))}</div>
                        <Button asChild size="sm" variant="outline" className="h-8 mt-2 border-primary/30 text-primary hover:bg-primary/10 text-[10px] font-bold uppercase tracking-widest">
                          <Link to="/projetos/$projectId" params={{ projectId: project.id }} className="gap-1">
                            Gerenciar <ExternalLink className="size-3" />
                          </Link>
                        </Button>
                      </div>
                    </div>
                    <SalesProgression status={project.status} />
                  </div>
                ))}
                {active.length === 0 && (
                  <div className="p-12 text-center text-sm text-muted-foreground flex flex-col items-center gap-3 italic">
                    <p>Você não tem projetos ativos no momento.</p>
                    <Button asChild variant="link" className="text-brand-500 font-bold uppercase tracking-widest text-[10px]">
                      <Link to="/disponiveis">Ver projetos disponíveis</Link>
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* Grafico de Meu Progresso */}
            <section className="premium-card card-hover p-5">
              <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2 mb-6">
                <TrendingUp className="size-4 text-primary" /> Meu progresso
              </h2>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={progressionData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" vertical={false} opacity={0.5} />
                    <XAxis dataKey="name" tickLine={false} axisLine={false} className="text-[10px] font-bold uppercase" />
                    <YAxis allowDecimals={false} tickLine={false} axisLine={false} className="text-xs" width={30} />
                    <Tooltip 
                      cursor={{ opacity: 0.1 }} 
                      contentStyle={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: '12px' }}
                    />
                    <Bar dataKey="value" radius={[4, 4, 0, 0]} barSize={40}>
                      {progressionData.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </section>

            {/* Volume Histórico */}
            <section className="premium-card card-hover p-5">
              <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2 mb-6">
                <History className="size-4 text-brand-500" /> Histórico de Volume (6 meses)
              </h2>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={series}>
                    <defs>
                      <linearGradient id="colorProjetos" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="var(--primary)" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" vertical={false} opacity={0.5} />
                    <XAxis dataKey="label" tickLine={false} axisLine={false} className="text-[10px] font-bold uppercase" />
                    <YAxis allowDecimals={false} tickLine={false} axisLine={false} className="text-xs" width={30} />
                    <Tooltip 
                      cursor={{ opacity: 0.1 }} 
                      contentStyle={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: '12px' }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="projetos" 
                      stroke="var(--primary)" 
                      fillOpacity={1} 
                      fill="url(#colorProjetos)" 
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </section>
          </section>

          <aside className="space-y-4">
            {/* 5. PRAZOS */}
            <section className="premium-card card-hover">
              <h2 className="border-b border-border/50 px-5 py-4 text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
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
                        <div className="text-muted-foreground mt-0.5 font-medium">{shortDate(d!.due_date)}</div>
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
                        <div className="text-muted-foreground mt-0.5 font-medium">{shortDate(d!.due_date)}</div>
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
                        <div className="text-muted-foreground mt-0.5 font-medium">{shortDate(d!.due_date)}</div>
                      </div>
                    ))}
                  </div>
                )}

                {deadlines.length === 0 && (
                  <p className="text-center py-4 text-xs text-muted-foreground italic">Sem prazos definidos.</p>
                )}
              </div>
            </section>

            {/* 6. COMISSÕES (Resumo) */}
            <section className="premium-card card-hover">
              <h2 className="border-b border-border/50 px-5 py-4 text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <Wallet className="size-4 text-primary" /> Resumo Financeiro
              </h2>
              <div className="p-5 space-y-4">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground font-medium">Total gerado</span>
                  <span className="font-bold">{currency(earnings.paid + earnings.released + earnings.pending)}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground font-medium">Liberado</span>
                  <span className="font-black text-success">{currency(earnings.balance)}</span>
                </div>
                <div className="flex justify-between items-center text-sm border-t border-border/30 pt-4">
                  <span className="text-muted-foreground font-medium">Recebido</span>
                  <span className="font-bold">{currency(earnings.withdrawn)}</span>
                </div>
                <Button asChild className="w-full mt-2 font-bold uppercase tracking-widest text-[10px] shadow-glow bg-primary hover:bg-primary/90">
                  <Link to="/meus-saques">
                    Solicitar Saque <ArrowRight className="ml-2 size-3" />
                  </Link>
                </Button>
              </div>
            </section>

            {/* 7. DESEMPENHO */}
            <section className="premium-card card-hover p-5">
              <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2 mb-6">
                <Trophy className="size-4 text-primary" /> Meu Desempenho
              </h2>
              <div className="space-y-6">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold uppercase tracking-tighter">
                    <span>Taxa de Entrega</span>
                    <span className="text-primary">{completionRate}%</span>
                  </div>
                  <Progress value={completionRate} className="h-1.5" />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-xl bg-muted/20 p-3 border border-border/50">
                    <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Entregas no Prazo</p>
                    <p className="text-lg font-black text-primary">{finishedOnTimeCount}</p>
                  </div>
                  <div className="rounded-xl bg-muted/20 p-3 border border-border/50">
                    <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Média Mensal</p>
                    <p className="text-lg font-black text-primary">{(delivered.length / Math.max(1, series.length)).toFixed(1)}</p>
                  </div>
                </div>
              </div>
            </section>
          </aside>
        </div>
      </DashboardShell>
    </AppShell>
  );
}
