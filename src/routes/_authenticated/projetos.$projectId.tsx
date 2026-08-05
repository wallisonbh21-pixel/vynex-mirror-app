import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useMemo } from "react";
import { 
  ArrowLeft, 
  Calendar, 
  Clock, 
  CircleDollarSign, 
  Globe, 
  User,
  ExternalLink,
  MessageSquare,
  FileText
} from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { ProjectProgression } from "@/components/ProjectProgression";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { requireCriador } from "@/lib/guard";
import { useRows } from "@/lib/data";
import { useMyCreatorProjects } from "@/lib/creator";
import { useApprovalEvents } from "@/lib/approval";
import { currency, shortDate, PROJECT_STATUS } from "@/lib/format";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/projetos/$projectId")({
  beforeLoad: () => requireCriador(),
  head: () => ({
    meta: [{ title: "Detalhes do Projeto — VYNEXA" }],
  }),
  component: DetalhesProjetoPage,
});

function DetalhesProjetoPage() {
  const { projectId } = useParams({ from: "/_authenticated/projetos/$projectId" });
  const { data: projects = [] } = useMyCreatorProjects();
  const { data: clients = [] } = useRows<any>("clients");
  const { data: events = [] } = useApprovalEvents(projectId);

  const project = useMemo(() => projects.find((p) => p.id === projectId), [projects, projectId]);
  const client = useMemo(() => clients.find((c) => c.id === project?.client_id), [clients, project]);

  if (!project) {
    return (
      <AppShell title="Projeto não encontrado">
        <div className="flex flex-col items-center justify-center py-20">
          <p className="text-muted-foreground">O projeto solicitado não existe ou você não tem permissão para acessá-lo.</p>
          <Button asChild className="mt-4">
            <Link to="/criacao">Voltar ao painel</Link>
          </Button>
        </div>
      </AppShell>
    );
  }

  // Filtrar status para a linha de progresso (excluindo cancelado e disponível se já atribuído)
  const progressionSteps = PROJECT_STATUS.filter(s => !["cancelado", "disponivel"].includes(s));

  return (
    <AppShell
      title={project.title}
      description={`Detalhes e progresso do desenvolvimento.`}
      actions={
        <Button asChild variant="outline" size="sm">
          <Link to="/meus-projetos" className="gap-2">
            <ArrowLeft className="size-4" /> Voltar
          </Link>
        </Button>
      }
    >
      <div className="space-y-6">
        {/* 4. PROGRESSO DO PROJETO */}
        <section className="rounded-2xl border border-border bg-card shadow-panel overflow-hidden">
          <div className="border-b border-border px-5 py-4">
            <h2 className="font-semibold">Progresso do Desenvolvimento</h2>
          </div>
          <ProjectProgression steps={progressionSteps as any} currentStatus={project.status} />
        </section>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            {/* Informações Gerais */}
            <section className="rounded-2xl border border-border bg-card p-6 shadow-panel">
              <h2 className="text-lg font-semibold mb-4">Informações do Projeto</h2>
              <div className="grid gap-6 sm:grid-cols-2">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <FileText className="size-5" />
                    </div>
                    <div>
                      <div className="text-[10px] uppercase font-bold text-muted-foreground">Tipo de Site</div>
                      <div className="font-medium">{project.site_type || "Não definido"}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Calendar className="size-5" />
                    </div>
                    <div>
                      <div className="text-[10px] uppercase font-bold text-muted-foreground">Data de Início</div>
                      <div className="font-medium">{shortDate(project.assigned_at || project.created_at)}</div>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Clock className="size-5" />
                    </div>
                    <div>
                      <div className="text-[10px] uppercase font-bold text-muted-foreground">Prazo de Entrega</div>
                      <div className="font-medium">{shortDate(project.due_date)}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <CircleDollarSign className="size-5" />
                    </div>
                    <div>
                      <div className="text-[10px] uppercase font-bold text-muted-foreground">Sua Comissão</div>
                      <div className="font-bold text-primary">{currency(project.commission || (project.value * (project.commission_rate || 0) / 100))}</div>
                    </div>
                  </div>
                </div>
              </div>

              {project.description && (
                <div className="mt-6 pt-6 border-t border-border">
                  <h3 className="text-sm font-semibold mb-2">Descrição / Briefing</h3>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{project.description}</p>
                </div>
              )}
            </section>

            {/* Histórico de Atividade */}
            <section className="rounded-2xl border border-border bg-card shadow-panel overflow-hidden">
              <div className="border-b border-border px-5 py-4">
                <h2 className="font-semibold">Histórico de Aprovação e Ajustes</h2>
              </div>
              <div className="divide-y divide-border">
                {events.map((event) => (
                  <div key={event.id} className="p-4 flex gap-4">
                    <div className={cn(
                      "flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-bold",
                      event.event_type.includes('ajustes') ? "bg-warning/10 text-warning" : "bg-primary/10 text-primary"
                    )}>
                      {event.actor_label[0]}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-bold">{event.actor_label}</span>
                        <span className="text-[10px] text-muted-foreground">{shortDate(event.created_at)}</span>
                      </div>
                      <div className="text-sm text-foreground mt-0.5">
                        {event.message || "Atualização de status no fluxo de aprovação."}
                      </div>
                      {event.new_status && (
                        <div className="mt-2 flex items-center gap-2">
                          <span className="text-[10px] text-muted-foreground uppercase font-bold">Status:</span>
                          <StatusBadge status={event.new_status} className="h-5 py-0 px-2" />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {events.length === 0 && (
                  <div className="p-8 text-center text-sm text-muted-foreground">
                    Nenhuma atividade de aprovação registrada.
                  </div>
                )}
              </div>
            </section>
          </div>

          <aside className="space-y-6">
            {/* Dados do Cliente */}
            <section className="rounded-2xl border border-border bg-card p-6 shadow-panel">
              <h2 className="text-sm font-semibold mb-4 flex items-center gap-2">
                <User className="size-4 text-primary" /> Cliente
              </h2>
              {client ? (
                <div className="space-y-4">
                  <div>
                    <div className="text-[10px] uppercase font-bold text-muted-foreground">Empresa</div>
                    <div className="font-semibold">{client.company}</div>
                  </div>
                  {client.niche && (
                    <div>
                      <div className="text-[10px] uppercase font-bold text-muted-foreground">Nicho</div>
                      <div className="text-sm">{client.niche}</div>
                    </div>
                  )}
                  {client.city && (
                    <div>
                      <div className="text-[10px] uppercase font-bold text-muted-foreground">Localização</div>
                      <div className="text-sm">{client.city}{client.state ? `, ${client.state}` : ''}</div>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Dados do cliente não vinculados.</p>
              )}
            </section>

            {/* Links de Entrega */}
            <section className="rounded-2xl border border-border bg-card p-6 shadow-panel">
              <h2 className="text-sm font-semibold mb-4 flex items-center gap-2">
                <Globe className="size-4 text-primary" /> Entrega
              </h2>
              <div className="space-y-4">
                {project.delivery_link ? (
                  <Button asChild className="w-full justify-between" variant="outline">
                    <a href={project.delivery_link} target="_blank" rel="noreferrer">
                      Ver Site em Produção <ExternalLink className="size-4" />
                    </a>
                  </Button>
                ) : (
                  <div className="rounded-lg bg-muted/50 p-4 text-center text-xs text-muted-foreground">
                    O link de entrega será exibido após o primeiro envio para aprovação.
                  </div>
                )}
                
                {project.status === "em_producao" && (
                   <Button asChild className="w-full">
                    <Link to="/meus-projetos">
                      Gerenciar Entrega
                    </Link>
                  </Button>
                )}
              </div>
            </section>

            {/* Dúvidas ou Suporte */}
            <section className="rounded-2xl border border-primary/20 bg-primary/5 p-6 shadow-sm">
              <h2 className="text-sm font-semibold mb-2 flex items-center gap-2">
                <MessageSquare className="size-4 text-primary" /> Suporte Interno
              </h2>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Precisa de ajuda com este projeto ou identificou um erro no briefing? Entre em contato com o vendedor responsável ou administrador.
              </p>
            </section>
          </aside>
        </div>
      </div>
    </AppShell>
  );
}
