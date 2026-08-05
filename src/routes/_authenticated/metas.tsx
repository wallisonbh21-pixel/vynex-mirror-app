import { createFileRoute } from "@tanstack/react-router";
import { Plus, Trash2, Trophy, Flame, Star, Gem, CheckCircle2, TrendingUp, Target, History as HistoryIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { AppShell } from "@/components/AppShell";
import { requireVendedor, requireCriador } from "@/lib/guard";
import { RecordDialog, type Field } from "@/components/RecordDialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useDeleteRow, useRows, useSaveRow } from "@/lib/data";
import { useSession, useRoles } from "@/lib/auth";
import type { Contract } from "@/lib/crm";
import { currency, shortDate } from "@/lib/format";
import { useMyCreatorProjects } from "@/lib/creator";


export const Route = createFileRoute("/_authenticated/metas")({
  beforeLoad: () => {
    // Permite que tanto Vendedor quanto Criador acessem suas metas
    return true;
  },
  head: () => ({
    meta: [
      { title: "Metas — ScaleNexus" },
      { name: "description", content: "Metas mensais de vendas e faturamento com progresso real do vendedor." },
      { property: "og:title", content: "Metas — ScaleNexus" },
      { property: "og:description", content: "Metas e progresso do time ScaleNexus." },
    ],
  }),
  component: MetasPage,
});

type Goal = {
  id: string;
  user_id: string;
  month: string;
  sales_target: number;
  revenue_target: number;
};

const fields: Field[] = [
  { name: "month", label: "Mês da meta", type: "date", required: true },
  { name: "sales_target", label: "Meta de contratos", type: "number" },
  { name: "revenue_target", label: "Meta de faturamento (R$)", type: "number" },
];

function MetasPage() {
  const { user } = useSession();
  const { isCriador } = useRoles();
  const { data: goals = [] } = useRows<Goal>("goals", { column: "month" });
  const { data: contracts = [] } = useRows<Contract>("contracts", { column: "signed_at" });
  const { data: projects = [] } = useMyCreatorProjects();
  const save = useSaveRow("goals");
  const remove = useDeleteRow("goals");

  const deliveredCount = projects.filter(p => p.status === 'entregue').length;

  if (isCriador) {
    return (
      <AppShell
        title="Minhas Metas & Conquistas"
        description="Acompanhe sua produtividade e desbloqueie troféus profissionais."
      >
        <div className="grid gap-8">
          {/* SEÇÃO DE CONQUISTAS */}
          <section>
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Trophy className="size-5 text-primary" /> Conquistas & Troféus
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              <AchievementCard 
                icon={Target} 
                title="Primeiro projeto" 
                desc="Entregue seu primeiro site" 
                active={deliveredCount >= 1} 
              />
              <AchievementCard 
                icon={Flame} 
                title="5 Projetos" 
                desc="Entregue 5 sites com sucesso" 
                active={deliveredCount >= 5} 
              />
              <AchievementCard 
                icon={Gem} 
                title="Elite 10" 
                desc="Entregue 10 sites com sucesso" 
                active={deliveredCount >= 10} 
              />
              <AchievementCard 
                icon={Star} 
                title="Mestre Criador" 
                desc="Entregue 20 sites com sucesso" 
                active={deliveredCount >= 20} 
              />
            </div>
          </section>

          {/* LISTA DE METAS */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <TrendingUp className="size-5 text-primary" /> Metas de Produção
              </h2>
              <RecordDialog
                title="Nova meta"
                fields={fields}
                initial={{
                  month: `${new Date().toISOString().slice(0, 7)}-01`,
                  sales_target: 0,
                  revenue_target: 0,
                }}
                onSubmit={(values) => save.mutate({ ...values, user_id: user?.id })}
                trigger={
                  <Button size="sm">
                    <Plus className="size-4" /> Definir meta
                  </Button>
                }
              />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {goals.map((goal) => {
                const monthKey = goal.month.slice(0, 7);
                const monthProjects = projects.filter((p) => (p.delivered_at || p.created_at).slice(0, 7) === monthKey && p.status === 'entregue');
                const progressPercent = Number(goal.sales_target)
                  ? Math.min(100, Math.round((monthProjects.length / Number(goal.sales_target)) * 100))
                  : 0;

                return (
                  <article key={goal.id} className="rounded-2xl border border-border bg-card p-5 shadow-panel">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "flex size-10 items-center justify-center rounded-full shadow-sm",
                          progressPercent >= 100 ? "bg-success/20 text-success" : "bg-secondary text-muted-foreground"
                        )}>
                          <Trophy className="size-5" />
                        </div>
                        <div>
                          <h2 className="font-bold">
                            {new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric" }).format(
                              new Date(`${monthKey}-01T12:00:00`),
                            )}
                          </h2>
                          <p className="text-xs text-muted-foreground">{shortDate(goal.month)}</p>
                        </div>
                      </div>
                      <span className="text-lg font-bold text-primary">{progressPercent}%</span>
                    </div>

                    <div className="mt-6">
                      <div className="flex justify-between text-xs font-bold uppercase tracking-wider mb-2">
                        <span>Entregas Realizadas</span>
                        <span className="text-muted-foreground">
                          {monthProjects.length} / {goal.sales_target}
                        </span>
                      </div>
                      <Progress value={progressPercent} className="h-2" />
                    </div>

                    <div className="mt-4 flex justify-end gap-1 border-t border-border pt-3">
                      <RecordDialog
                        title="Editar meta"
                        fields={fields}
                        initial={goal}
                        onSubmit={(values) => save.mutate({ ...values, id: goal.id })}
                        trigger={<Button variant="ghost" size="sm">Editar</Button>}
                      />
                      <Button variant="ghost" size="sm" onClick={() => remove.mutate(goal.id)}>
                        <Trash2 className="size-4 text-destructive" />
                      </Button>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        </div>
      </AppShell>
    );
  }

  // Vendedor (Código existente)
  return (
    <AppShell
      title="Conquistas & Metas"
      description="Alcance seus objetivos mensais e conquiste troféus com contratos fechados."
      actions={
        <RecordDialog
          title="Nova meta"
          fields={fields}
          initial={{
            month: `${new Date().toISOString().slice(0, 7)}-01`,
            sales_target: 0,
            revenue_target: 0,
          }}
          onSubmit={(values) => save.mutate({ ...values, user_id: user?.id })}
          trigger={
            <Button>
              <Plus className="size-4" /> Nova meta
            </Button>
          }
        />
      }
    >
      <div className="grid gap-4 md:grid-cols-2">
        {goals.map((goal) => {
          const monthKey = goal.month.slice(0, 7);
          const monthContracts = contracts.filter((c) => c.signed_at.slice(0, 7) === monthKey);
          const revenue = monthContracts.reduce((sum, c) => sum + Number(c.amount), 0);
          const revenuePercent = Number(goal.revenue_target)
            ? Math.min(100, Math.round((revenue / Number(goal.revenue_target)) * 100))
            : 0;
          const salesPercent = Number(goal.sales_target)
            ? Math.min(100, Math.round((monthContracts.length / Number(goal.sales_target)) * 100))
            : 0;

          return (
            <article key={goal.id} className="rounded-2xl border border-border bg-card p-5 shadow-panel">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "flex size-10 items-center justify-center rounded-full shadow-sm",
                    revenuePercent >= 100 ? "bg-success/20 text-success" : "bg-secondary text-muted-foreground"
                  )}>
                    <Trophy className={cn("size-5", revenuePercent >= 100 && "animate-pulse")} />
                  </div>
                  <div>
                    <h2 className="font-semibold">
                      {new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric" }).format(
                        new Date(`${monthKey}-01T12:00:00`),
                      )}
                    </h2>
                    <p className="text-xs text-muted-foreground">Início em {shortDate(goal.month)}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className={cn(
                    "text-lg font-bold",
                    revenuePercent >= 100 ? "text-success" : "text-primary"
                  )}>
                    {revenuePercent}%
                  </span>
                </div>
              </div>

              <div className="mt-4 space-y-4">
                <div>
                  <div className="flex justify-between text-sm">
                    <span>Faturamento</span>
                    <span className="text-muted-foreground">
                      {currency(revenue)} de {currency(goal.revenue_target)}
                    </span>
                  </div>
                  <Progress value={revenuePercent} className="mt-1.5" />
                </div>
                <div>
                  <div className="flex justify-between text-sm">
                    <span>Contratos</span>
                    <span className="text-muted-foreground">
                      {monthContracts.length} de {goal.sales_target}
                    </span>
                  </div>
                  <Progress value={salesPercent} className="mt-1.5" />
                </div>
              </div>

              <div className="mt-4 flex justify-end gap-1">
                <RecordDialog
                  title="Editar meta"
                  fields={fields}
                  initial={goal}
                  onSubmit={(values) => save.mutate({ ...values, id: goal.id })}
                  trigger={
                    <Button variant="ghost" size="sm">
                      Editar
                    </Button>
                  }
                />
                <Button variant="ghost" size="sm" onClick={() => remove.mutate(goal.id)}>
                  <Trash2 className="size-4 text-destructive" />
                </Button>
              </div>
            </article>
          );
        })}
        {goals.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground md:col-span-2">
            Nenhuma meta cadastrada ainda.
          </p>
        ) : null}
      </div>
    </AppShell>
  );
}

function AchievementCard({ icon: Icon, title, desc, active }: { icon: any, title: string, desc: string, active: boolean }) {
  return (
    <div className={cn(
      "p-4 rounded-2xl border transition-all duration-300 flex flex-col items-center text-center",
      active 
        ? "bg-primary/5 border-primary/20 shadow-glow" 
        : "bg-muted/30 border-border opacity-50 grayscale"
    )}>
      <div className={cn(
        "size-12 rounded-full flex items-center justify-center mb-3",
        active ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
      )}>
        <Icon className="size-6" />
      </div>
      <h3 className="text-xs font-bold uppercase tracking-wider mb-1">{title}</h3>
      <p className="text-[10px] text-muted-foreground leading-tight">{desc}</p>
    </div>
  );
}
