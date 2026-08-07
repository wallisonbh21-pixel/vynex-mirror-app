import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { useClientPortalData } from "@/lib/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { AlertCircle, Inbox } from "lucide-react";
import { ProjectProgression } from "@/components/ProjectProgression";
import { PROJECT_STATUS } from "@/lib/format";
export const Route = createFileRoute("/_authenticated/cliente/")({
    component: ClientDashboard,
});
function ClientDashboard() {
    const { data: client, isLoading, isError, refetch } = useClientPortalData();
    if (isLoading) {
        return (<AppShell title="Dashboard">
        <div className="flex flex-col items-center justify-center py-20 space-y-6">
          <Skeleton className="h-12 w-64"/>
          <Skeleton className="h-48 w-full max-w-4xl"/>
          <p className="text-sm text-muted-foreground animate-pulse">Carregando seu painel...</p>
        </div>
      </AppShell>);
    }
    if (isError || !client) {
        return (<AppShell title="Dashboard">
        <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
          <div className="rounded-full bg-destructive/10 p-6">
            <AlertCircle className="size-12 text-destructive"/>
          </div>
          <h2 className="text-2xl font-bold">Não foi possível carregar seu painel.</h2>
          <p className="text-muted-foreground max-w-md">
            Ocorreu um erro ao buscar seus dados comerciais. Por favor, tente novamente ou contate o suporte.
          </p>
          <Button variant="outline" onClick={() => refetch()}>
            Tentar novamente
          </Button>
        </div>
      </AppShell>);
    }
    const projects = client.projects || [];
    const activeProject = projects[0];
    return (<AppShell title="Dashboard">
      <div className="space-y-8">
        <div className="flex flex-col gap-2">
          <h2 className="text-3xl font-bold tracking-tight">
            Olá, {client.contact_name || "Cliente"}! 👋
          </h2>
          <p className="text-muted-foreground">
            Acompanhe a evolução do seu projeto e suas próximas etapas.
          </p>
        </div>

        {activeProject ? (<div className="grid gap-6 lg:grid-cols-3">
            <Card className="lg:col-span-2 border-sidebar-border/50 bg-sidebar/30 backdrop-blur-sm">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg font-medium">Projeto em Destaque</CardTitle>
                <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 capitalize">
                  {activeProject.status?.replace("_", " ")}
                </Badge>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="text-xl font-bold">{activeProject.title}</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Tipo de Site: {activeProject.site_type || "Não informado"}
                  </p>
                </div>
                <div className="py-4">
                  <ProjectProgression steps={[...PROJECT_STATUS]} currentStatus={activeProject.status}/>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-6">
              <Card className="border-sidebar-border/50 bg-sidebar/30">
                <CardHeader><CardTitle className="text-base font-medium">Próxima Ação</CardTitle></CardHeader>
                <CardContent>
                  {activeProject.status === "aguardando_aprovacao" ? (<div className="space-y-4">
                      <p className="text-sm text-muted-foreground">Seu site aguarda sua aprovação.</p>
                      <Button className="w-full">Revisar Agora</Button>
                    </div>) : (<p className="text-sm text-muted-foreground">Nenhuma ação pendente no momento.</p>)}
                </CardContent>
              </Card>

              <Card className="border-sidebar-border/50 bg-sidebar/30">
                <CardHeader><CardTitle className="text-base font-medium">Financeiro</CardTitle></CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Valor</span>
                    <span className="font-semibold">R$ {activeProject.value?.toLocaleString("pt-BR") || "0,00"}</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>) : (<Card className="p-20 text-center border-dashed border-2">
            <Inbox className="mx-auto size-12 text-muted-foreground/30 mb-4"/>
            <h3 className="text-lg font-medium">Seu painel ainda não possui informações.</h3>
            <p className="text-muted-foreground">Seus projetos aparecerão aqui assim que forem vinculados.</p>
          </Card>)}
      </div>
    </AppShell>);
}
