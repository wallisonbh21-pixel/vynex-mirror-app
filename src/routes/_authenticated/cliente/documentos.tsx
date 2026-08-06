import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { useClientProjects } from "@/lib/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { FileText, Download, File, Lock } from "lucide-react";

export const Route = createFileRoute("/_authenticated/cliente/documentos")({
  component: MyDocuments,
});

function MyDocuments() {
  const { data: projects, isLoading } = useClientProjects();

  const documents = [
    { id: 1, name: "Contrato de Prestação de Serviços.pdf", type: "PDF", size: "1.2 MB", category: "Contrato" },
    { id: 2, name: "Briefing Consolidado.pdf", type: "PDF", size: "450 KB", category: "Briefing" },
    { id: 3, name: "Manual da Marca - Guia Visual.pdf", type: "PDF", size: "8.5 MB", category: "Design" },
  ];

  if (isLoading) {
    return (
      <AppShell title="Documentos">
        <Skeleton className="h-96 w-full" />
      </AppShell>
    );
  }

  return (
    <AppShell title="Documentos">
      <div className="space-y-6">
        <div className="flex flex-col gap-2">
          <h2 className="text-2xl font-bold">Central de Documentos</h2>
          <p className="text-muted-foreground">Acesse contratos, manuais e arquivos do seu projeto.</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {documents.map((doc) => (
            <Card key={doc.id} className="border-sidebar-border/50 bg-sidebar/30 backdrop-blur-sm group hover:border-primary/30 transition-all">
              <CardContent className="p-4 flex flex-col h-full">
                <div className="flex items-start justify-between mb-4">
                  <div className="size-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                    <FileText className="size-5" />
                  </div>
                  <Badge variant="secondary" className="text-[10px] uppercase">{doc.category}</Badge>
                </div>
                
                <h3 className="font-semibold text-sm line-clamp-2 mb-1 group-hover:text-primary transition-colors">
                  {doc.name}
                </h3>
                <p className="text-xs text-muted-foreground mb-6">
                  {doc.type} • {doc.size}
                </p>
                
                <div className="mt-auto pt-4 border-t border-sidebar-border/30">
                  <Button variant="ghost" className="w-full text-xs justify-between hover:bg-primary/10 hover:text-primary">
                    Baixar Arquivo
                    <Download className="size-3 ml-2" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
          
          <Card className="border-sidebar-border/50 bg-sidebar/30 backdrop-blur-sm border-dashed">
            <CardContent className="p-4 flex flex-col items-center justify-center h-full text-center py-10">
              <Lock className="size-8 text-muted-foreground/30 mb-2" />
              <h3 className="text-sm font-medium text-muted-foreground">Arquivos Internos</h3>
              <p className="text-[10px] text-muted-foreground/60 mt-1">
                Apenas documentos públicos são visíveis para o cliente.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
