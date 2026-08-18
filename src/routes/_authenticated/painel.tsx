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
      { title: "Visão geral — ScaleNexus" },
      {
        name: "description",
        content: "Indicadores do vendedor: leads ativos, propostas, contratos, conversão, comissão e meta do mês.",
      },
      { property: "og:title", content: "Visão geral — ScaleNexus" },
      { property: "og:description", content: "Dashboard comercial da ScaleNexus." },
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
        <Button asChild className="shadow-glow bg-primary hover:bg-primary/90">
          <Link to="/pipeline">Abrir pipeline</Link>
        </Button>
      }
    >
      <DashboardShell>
        <DashboardHeader 
          title="Minha Performance"
          description="Acompanhe seus leads, conversões e metas do mês."
        />

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard 
            label="Leads ativos" 
            value={String(activeLeads.length)} 
            hint={`${leads.length} no funil`} 
            icon={Target} 
            status={activeLeads.length > 0 ? 'active' : 'idle'}
          />
          <StatCard 
            label="Contatos realizados" 
            value={String(contacts.length)} 
            hint="Total de interações" 
            icon={Phone} 
          />
          <StatCard 
            label="Contratos fechados" 
            value={String(contracts.length)} 
            hint={`${monthContracts.length} este mês`} 
            icon={Handshake} 
            status={monthContracts.length > 0 ? 'success' : 'idle'}
            trend={{ value: `${conversion}%`, positive: conversion > 20, label: "conversão" }}
          />
          <StatCard 
            label="Comissão prevista" 
            value={currency(commission)} 
            hint={`${rate}% sobre o mês`} 
            icon={Wallet} 
            status="active"
          />
        </div>


        {goal ? (
          <div className="mt-4 rounded-2xl border border-border/50 bg-card/30 p-5 backdrop-blur-sm shadow-panel">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <Trophy className="size-4 text-warning" />
                <span className="font-semibold text-primary uppercase tracking-wider text-xs">Meta de Vendas</span>
              </div>
              <span className="text-muted-foreground font-medium">
                {currency(monthRevenue)} / {currency(goal.revenue_target)}
              </span>
            </div>
            <Progress value={goalPercent} className="mt-3 h-2 shadow-inner bg-muted/30" />
            {goalPercent >= 100 && (
              <p className="mt-2 text-center text-[10px] font-black tracking-widest animate-bounce text-success uppercase">
                🏆 Meta Atingida! 🏆
              </p>
            )}
          </div>
        ) : null}

        <div className="mt-6 grid gap-6 lg:grid-cols-3">
          <section className="lg:col-span-2 rounded-2xl border border-border/50 bg-card/30 p-6 backdrop-blur-sm shadow-panel">
            <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2 mb-6">
              <TrendingUp className="size-4 text-primary" /> Evolução de Vendas
            </h2>
            <div className="h-64">
              {evolution.length === 0 ? (
                <p className="pt-16 text-center text-sm text-muted-foreground">
                  Nenhum contrato fechado ainda.
                </p>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={evolution}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} opacity={0.5} />
                    <XAxis 
                      dataKey="month" 
                      tickLine={false} 
                      axisLine={false} 
                      tick={{fill: 'var(--muted-foreground)', fontSize: 11}}
                    />
                    <YAxis 
                      tickLine={false} 
                      axisLine={false} 
                      tick={{fill: 'var(--muted-foreground)', fontSize: 11}}
                      tickFormatter={(val) => `R$ ${val/1000}k`}
                    />
                    <Tooltip
                      cursor={{ fill: "var(--muted)", opacity: 0.1 }}
                      contentStyle={{
                        background: "var(--card)",
                        border: "1px solid var(--border)",
                        borderRadius: 12,
                      }}
                      formatter={(value: number) => currency(value)}
                    />
                    <Bar dataKey="total" fill="var(--primary)" radius={[4, 4, 0, 0]} barSize={40} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </section>

          <section className="rounded-2xl border border-border/50 bg-card/30 p-6 backdrop-blur-sm shadow-panel">
            <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2 mb-6">
              <Target className="size-4 text-primary" /> Funil Comercial
            </h2>
            <SalesFunnel leads={leads} />
          </section>
        </div>

        <section className="mt-6 overflow-hidden rounded-2xl border border-border/50 bg-card/30 backdrop-blur-sm shadow-panel">
          <div className="flex items-center justify-between border-b border-border/50 px-6 py-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <ArrowUpRight className="size-4 text-primary" /> Minhas Oportunidades
            </h2>
            <Button asChild variant="ghost" size="sm" className="text-xs text-brand-500 hover:text-brand-600 uppercase font-bold tracking-widest">
              <Link to="/pipeline">Ver Pipeline</Link>
            </Button>
          </div>
          <div className="divide-y divide-border/30">
            {leads.slice(0, 6).map((lead) => (
              <div key={lead.id} className="flex items-center justify-between gap-4 px-6 py-4 hover:bg-muted/20 transition-colors cursor-pointer group">
                <div className="min-w-0">
                  <Link
                    to="/leads/$leadId"
                    params={{ leadId: lead.id }}
                    className="block truncate font-bold text-sm group-hover:text-primary transition-colors"
                  >
                    {lead.company || lead.name}
                  </Link>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-tight">
                      {currency(lead.closed_value || lead.estimated_value)}
                    </span>
                    <span className="text-[10px] text-muted-foreground/40">•</span>
                    <span className="text-[10px] text-muted-foreground/60">
                      Contato: {shortDate(lead.next_contact_at)}
                    </span>
                  </div>
                </div>
                <StatusBadge status={lead.status} className="h-5 px-2 text-[10px]" />
              </div>
            ))}
            {leads.length === 0 && (
              <div className="px-6 py-12 text-center text-sm text-muted-foreground italic">
                Nenhuma oportunidade cadastrada ainda.
              </div>
            )}
          </div>
        </section>
      </DashboardShell>
    </AppShell>
  );
}

