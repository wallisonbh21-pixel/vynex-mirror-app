import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { useClienteProjetos } from "@/lib/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ExternalLink, Globe, Layout, ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/_authenticated/cliente/site")({
  component: MySite,
});

function MySite() {
  const { data: projects, isLoading } = useClienteProjetos();

  if (isLoading) {
    return (
      <AppShell title="Meu Site">
        <Skeleton className="h-96 w-full" />
      </AppShell>
    );
  }

  const project = projects?.[0];

  if (!project) {
    return (
      <AppShell title="Meu Site">
        <Card className="p-12 text-center border-dashed">
          <p className="text-muted-foreground">Nenhum projeto encontrado.</p>
        </Card>
      </AppShell>
    );
  }

  const isLive = project.status === "entregue" && project.delivery_link;

  return (
    <AppShell title="Meu Site">
      <div className="space-y-6">
        <Card className="border-sidebar-border/50 bg-sidebar/30 backdrop-blur-sm overflow-hidden">
          <div className="aspect-video relative bg-muted flex items-center justify-center group">
            {project.status === "entregue" ? (
              <div className="text-center p-8">
                <Globe className="size-16 text-primary mx-auto mb-4 opacity-20" />
                <h3 className="text-xl font-bold mb-2">Seu site está online!</h3>
                <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                  Parabéns! Seu projeto foi concluído e já está disponível para o mundo.
                </p>
                <Button asChild size="lg" className="shadow-glow">
                  <a href={project.delivery_link || "#"} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="mr-2 size-4" />
                    Visualizar Site Oficial
                  </a>
                </Button>
              </div>
            ) : (
              <div className="text-center p-8">
                <Layout className="size-16 text-muted-foreground mx-auto mb-4 opacity-20" />
                <h3 className="text-xl font-bold mb-2">Construindo sua presença digital</h3>
                <p className="text-muted-foreground mb-4 max-w-md mx-auto">
                  Nossa equipe está trabalhando nos detalhes finais do seu site.
                </p>
                <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                  STATUS: {project.status.toUpperCase()}
                </Badge>
              </div>
            )}
          </div>
          
          <CardContent className="p-6">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="size-5 text-primary" />
                  <h4 className="font-semibold text-lg">Informações do Domínio</h4>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between py-2 border-b border-sidebar-border/50">
                    <span className="text-sm text-muted-foreground">Endereço Principal</span>
                    <span className="text-sm font-medium">{project.delivery_link || "Pendente"}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-sidebar-border/50">
                    <span className="text-sm text-muted-foreground">SSL / Segurança</span>
                    <Badge variant="secondary" className="bg-green-500/10 text-green-500 border-green-500/20">Ativo</Badge>
                  </div>
                  <div className="flex justify-between py-2 border-b border-sidebar-border/50">
                    <span className="text-sm text-muted-foreground">Última Atualização</span>
                    <span className="text-sm font-medium">
                      {new Date(project.updated_at).toLocaleDateString("pt-BR")}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Layout className="size-5 text-primary" />
                  <h4 className="font-semibold text-lg">Ações Rápidas</h4>
                </div>
                <div className="grid gap-3">
                  <Button variant="outline" className="justify-start border-sidebar-border/50" disabled={!project.client_token}>
                    <ExternalLink className="mr-2 size-4" />
                    Abrir Preview em Tempo Real
                  </Button>
                  <Button variant="outline" className="justify-start border-sidebar-border/50">
                    <ShieldCheck className="mr-2 size-4" />
                    Solicitar Alteração Técnica
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
