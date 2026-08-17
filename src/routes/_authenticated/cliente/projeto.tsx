import { cn } from "@/lib/utils";
import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { useClienteProjetos } from "@/lib/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Clock, Usuário, Calendar, CheckCircle2, Package } from "lucide-react";

export const Route = createFileRoute("/_authenticated/cliente/projeto")({
  component: MyProjeto,
});

function MyProjeto() {
  const { data: projects, isLoading } = useClienteProjetos();

  if (isLoading) {
    return (
      <AppShell title="Meu Projeto">
        <Skeleton className="h-96 w-full" />
      </AppShell>
    );
  }

  const project = projects?.[0];

  if (!project) {
    return (
      <AppShell title="Meu Projeto">
        <Card className="p-12 text-center border-dashed">
          <p className="text-muted-foreground">Nenhum projeto encontrado.</p>
        </Card>
      </AppShell>
    );
  }

  const steps = [
    { key: "projeto_criado", label: "Projeto criado", done: true },
    { key: "briefing", label: "Briefing recebido", done: !!project.submitted_at },
    { key: "em_producao", label: "Em produção", done: ["em_producao", "aguardando_revisao", "ajustes", "aprovado", "entregue"].includes(project.status) },
    { key: "aguardando_revisao", label: "Aguardando revisão", done: ["aguardando_revisao", "aprovado", "entregue"].includes(project.status) },
    { key: "ajustes", label: "Ajustes", done: ["aprovado", "entregue"].includes(project.status) },
    { key: "aprovado", label: "Aprovado", done: !!project.client_approved_at || project.status === "entregue" },
    { key: "entregue", label: "Entregue", done: project.status === "entregue" },
  ];

  return (
    <AppShell title="Meu Projeto">
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold">{project.title}</h2>
            <p className="text-muted-foreground">{project.site_type || "Site Profissional"}</p>
          </div>
          <Badge variant="outline" className="w-fit text-primary border-primary/20 bg-primary/5 px-4 py-1 text-sm font-medium">
            {project.status.replace("_", " ").toUpperCase()}
          </Badge>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <Card className="md:col-span-2 border-sidebar-border/50 bg-sidebar/30 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-lg">Detalhes do Projeto</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex items-center gap-3">
                  <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Package className="size-4" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Tipo de Projeto</p>
                    <p className="text-sm font-medium">{project.site_type || "N/A"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Calendar className="size-4" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Data de Início</p>
                    <p className="text-sm font-medium">
                      {new Date(project.created_at).toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Clock className="size-4" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Prazo Estimado</p>
                    <p className="text-sm font-medium">
                      {project.due_date ? new Date(project.due_date).toLocaleDateString("pt-BR") : "A definir"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Usuário className="size-4" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Responsável</p>
                    <p className="text-sm font-medium">Equipe ScaleNexus</p>
                  </div>
                </div>
              </div>

              <Separator className="bg-sidebar-border/50" />

              <div>
                <h4 className="text-sm font-semibold mb-3">Descrição</h4>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {project.description || "Nenhuma descrição detalhada disponível para este projeto."}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-sidebar-border/50 bg-sidebar/30 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-lg">Linha do Tempo</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative space-y-4 before:absolute before:left-[11px] before:top-2 before:h-[calc(100%-16px)] before:w-0.5 before:bg-sidebar-border/50">
                {steps.map((step) => (
                  <div key={step.key} className="relative flex items-center gap-3 pl-8">
                    <div className={cn(
                      "absolute left-0 flex size-6 items-center justify-center rounded-full border-2 bg-background transition-colors",
                      step.done 
                        ? "border-primary bg-primary text-primary-foreground" 
                        : "border-muted-foreground/30 text-muted-foreground/30"
                    )}>
                      {step.done && <CheckCircle2 className="size-3" />}
                    </div>
                    <span className={cn(
                      "text-sm font-medium transition-colors",
                      step.done ? "text-foreground" : "text-muted-foreground"
                    )}>
                      {step.label}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}

