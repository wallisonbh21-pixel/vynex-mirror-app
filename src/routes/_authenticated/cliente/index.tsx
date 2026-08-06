import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { useClientData, useClientProjects } from "@/lib/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { PROJECT_STATUS } from "@/lib/format";
import { ProjectProgression } from "@/components/ProjectProgression";

export const Route = createFileRoute("/_authenticated/cliente/")({
  component: ClientDashboard,
});

function ClientDashboard() {
  const { data: client, isLoading: loadingClient } = useClientData();
  const { data: projects, isLoading: loadingProjects } = useClientProjects();

  if (loadingClient || loadingProjects) {
    return (
      <AppShell title="Dashboard">
        <div className="flex flex-col items-center justify-center py-20 space-y-4">
          <Skeleton className="h-32 w-full max-w-4xl" />
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 w-full max-w-4xl">
            <Skeleton className="h-40" />
            <Skeleton className="h-40" />
            <Skeleton className="h-40" />
          </div>
          <p className="text-sm text-muted-foreground animate-pulse">Carregando seu painel...</p>
        </div>
      </AppShell>
    );
  }

  if (!client) {
    return (
      <AppShell title="Dashboard">
        <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
          <div className="rounded-full bg-destructive/10 p-6">
            <Rocket className="size-12 text-destructive opacity-50" />
          </div>
          <h2 className="text-2xl font-bold">Não foi possível carregar seu painel.</h2>
          <p className="text-muted-foreground max-w-md">
            Seu vínculo comercial não foi encontrado ou você ainda não possui informações vinculadas à sua conta.
          </p>
          <Button variant="outline" onClick={() => window.location.reload()}>
            Tentar novamente
          </Button>
        </div>
      </AppShell>
    );
  }

  const activeProject = projects?.[0];

  return (
    <AppShell title="Dashboard">
      <div className="space-y-8">
        <div className="flex flex-col gap-2">
          <h2 className="text-3xl font-bold tracking-tight">
            Olá, {client?.contact_name || "Cliente"}! 👋
          </h2>
          <p className="text-muted-foreground">
            Acompanhe a evolução do seu projeto e suas próximas etapas.
          </p>
        </div>

        {activeProject ? (
          <div className="grid gap-6 lg:grid-cols-3">
            <Card className="lg:col-span-2 overflow-hidden border-sidebar-border/50 bg-sidebar/30 backdrop-blur-sm">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-lg font-medium">Projeto em Destaque</CardTitle>
                <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 capitalize">
                  {activeProject.status.replace("_", " ")}
                </Badge>
              </CardHeader>
              <CardContent className="space-y-6 pt-4">
                <div>
                  <h3 className="text-xl font-bold">{activeProject.title}</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Tipo de Site: {activeProject.site_type || "Não informado"}
                  </p>
                </div>
                
                <div className="py-4">
                  <ProjectProgression steps={[...PROJECT_STATUS]} currentStatus={activeProject.status} />
                </div>
              </CardContent>
            </Card>

            <div className="space-y-6">
              <Card className="border-sidebar-border/50 bg-sidebar/30 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-base font-medium">Próxima Ação</CardTitle>
                </CardHeader>
                <CardContent>
                  {activeProject.status === "aguardando_aprovacao" ? (
                    <div className="space-y-4">
                      <p className="text-sm text-muted-foreground">
                        Seu site está aguardando sua aprovação para seguir para a próxima etapa.
                      </p>
                      <button className="w-full rounded-lg bg-primary py-2 text-sm font-semibold text-primary-foreground transition-all hover:bg-primary/90">
                        Revisar Agora
                      </button>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Nenhuma ação pendente no momento. Nossa equipe está trabalhando no seu projeto!
                    </p>
                  )}
                </CardContent>
              </Card>

              <Card className="border-sidebar-border/50 bg-sidebar/30 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-base font-medium">Resumo Financeiro</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Valor do Projeto</span>
                    <span className="font-semibold">R$ {activeProject.value?.toLocaleString("pt-BR") || "0,00"}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Status</span>
                    <Badge variant="secondary" className="bg-green-500/10 text-green-500 border-green-500/20">
                      Regular
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        ) : (
          <Card className="p-12 text-center border-dashed">
            <p className="text-muted-foreground">Você ainda não possui projetos ativos.</p>
          </Card>
        )}
      </div>
    </AppShell>
  );
}
