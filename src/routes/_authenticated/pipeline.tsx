import { useState, useMemo } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { SalesFunnel, ProgressionLine, LeadFunnelCard } from "@/components/SalesFunnel";
import { requireVendedor } from "@/lib/guard";
import { useSession } from "@/lib/auth";
import { useChangeLeadStatus, type Lead } from "@/lib/crm";
import { useRows } from "@/lib/data";
import { currency, LEAD_STATUS, label } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { LayoutGrid, List } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const Route = createFileRoute("/_authenticated/pipeline")({
  beforeLoad: () => requireVendedor(),
  head: () => ({
    meta: [
      { title: "Funil de Vendas — VYNEXA" },
      {
        name: "description",
        content: "Funil visual das oportunidades: arraste os cards entre as etapas e acompanhe o fechamento.",
      },
      { property: "og:title", content: "Funil de Vendas — VYNEXA" },
      { property: "og:description", content: "Kanban comercial do CRM VYNEXA." },
    ],
  }),
  component: PipelinePage,
});

const COLUMN_ACCENT: Record<string, string> = {
  novo: "bg-chart-3",
  contatado: "bg-chart-4",
  interessado: "bg-chart-1",
  proposta: "bg-chart-5",
  negociacao: "bg-chart-2",
  fechado: "bg-success",
  perdido: "bg-destructive",
};

function PipelinePage() {
  const { user } = useSession();
  const navigate = useNavigate();
  const { data = [] } = useRows<Lead>("leads");
  const changeStatus = useChangeLeadStatus();
  
  const [dragging, setDragging] = useState<string | null>(null);
  const [over, setOver] = useState<string | null>(null);
  const [activeStep, setActiveStep] = useState<string | null>(null);

  const steps = useMemo(() => LEAD_STATUS.filter(s => s !== 'perdido'), []);
  
  const filteredLeads = useMemo(() => {
    if (!activeStep) return data;
    return data.filter(l => l.status === activeStep);
  }, [data, activeStep]);

  function drop(status: string) {
    const lead = data.find((item) => item.id === dragging);
    setDragging(null);
    setOver(null);
    if (!lead || !user || lead.status === status) return;
    changeStatus.mutate({ lead, status, userId: user.id });
  }

  return (
    <AppShell
      title="Funil de Vendas"
      description="Visualize e gerencie seu processo comercial de ponta a ponta."
    >
      <Tabs defaultValue="funnel" className="w-full">
        <div className="mb-6 flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="funnel" className="gap-2">
              <List className="size-4" /> Funil Visual
            </TabsTrigger>
            <TabsTrigger value="kanban" className="gap-2">
              <LayoutGrid className="size-4" /> Kanban
            </TabsTrigger>
          </TabsList>
          
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">
              Total: <strong>{data.length}</strong> leads
            </span>
          </div>
        </div>

        <TabsContent value="funnel" className="space-y-8 outline-none">
          {/* Funil Principal */}
          <section className="rounded-2xl border border-border bg-card p-6 shadow-panel">
            <h2 className="mb-6 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Conversão de Etapas</h2>
            <SalesFunnel 
              leads={data} 
              activeStep={activeStep} 
              onStepClick={(s) => setActiveStep(s === activeStep ? null : s)} 
            />
          </section>

          {/* Linha de Progresso */}
          <section className="rounded-2xl border border-border bg-card p-4 shadow-panel overflow-x-auto">
             <ProgressionLine 
              steps={steps} 
              currentStep={activeStep} 
              onStepClick={(s) => setActiveStep(s === activeStep ? null : s)}
              leads={data}
            />
          </section>

          {/* Listagem de Clientes */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">
                {activeStep ? `Leads em ${label(activeStep)}` : 'Todos os Leads Ativos'}
                <span className="ml-2 rounded-full bg-secondary px-2 py-0.5 text-xs text-secondary-foreground">
                  {filteredLeads.length}
                </span>
              </h3>
              {activeStep && (
                <Button variant="ghost" size="sm" onClick={() => setActiveStep(null)}>
                  Ver todos
                </Button>
              )}
            </div>
            
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredLeads.map((lead) => (
                <LeadFunnelCard 
                  key={lead.id} 
                  lead={lead} 
                  onOpen={() => navigate({ to: "/leads/$leadId", params: { leadId: lead.id } })} 
                />
              ))}
              {filteredLeads.length === 0 && (
                <div className="col-span-full py-12 text-center text-muted-foreground border border-dashed rounded-2xl">
                  Nenhum lead encontrado nesta etapa.
                </div>
              )}
            </div>
          </section>
        </TabsContent>

        <TabsContent value="kanban" className="outline-none">
          <div className="flex gap-4 overflow-x-auto pb-4">
            {LEAD_STATUS.map((status) => {
              const rows = data.filter((lead) => lead.status === status);
              const total = rows.reduce(
                (sum, lead) => sum + Number(lead.closed_value || lead.estimated_value),
                0,
              );
              return (
                <section
                  key={status}
                  onDragOver={(event) => {
                    event.preventDefault();
                    setOver(status);
                  }}
                  onDragLeave={() => setOver((value) => (value === status ? null : value))}
                  onDrop={() => drop(status)}
                  className={cn(
                    "w-72 shrink-0 rounded-2xl border border-border bg-card/60 p-3 transition-colors",
                    over === status && "border-primary bg-secondary/60",
                  )}
                >
                  <header className="flex items-center gap-2 px-1">
                    <span className={cn("size-2.5 rounded-full", COLUMN_ACCENT[status])} />
                    <h2 className="flex-1 text-sm font-semibold">{label(status)}</h2>
                    <span className="text-xs text-muted-foreground">{rows.length}</span>
                  </header>
                  <p className="px-1 text-xs text-muted-foreground">{currency(total)}</p>

                  <div className="mt-3 space-y-2">
                    {rows.map((lead) => (
                      <article
                        key={lead.id}
                        draggable
                        onDragStart={() => setDragging(lead.id)}
                        onDragEnd={() => setDragging(null)}
                        className={cn(
                          "cursor-grab rounded-xl border border-border bg-card p-3 shadow-panel active:cursor-grabbing",
                          dragging === lead.id && "opacity-50",
                        )}
                      >
                        <Link
                          to="/leads/$leadId"
                          params={{ leadId: lead.id }}
                          className="text-sm font-medium hover:text-primary"
                        >
                          {lead.company || lead.name}
                        </Link>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {lead.name} · {lead.city || "—"}
                        </p>
                        <p className="mt-2 text-sm font-semibold">
                          {currency(lead.closed_value || lead.estimated_value)}
                        </p>
                      </article>
                    ))}
                    {rows.length === 0 ? (
                      <p className="py-6 text-center text-xs text-muted-foreground">Vazio</p>
                    ) : null}
                  </div>
                </section>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>
    </AppShell>
  );
}
