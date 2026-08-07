import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { useClientPortalData } from "@/lib/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { FileText, Download, File, Lock, Loader2, AlertCircle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/cliente/documentos")({
  component: MyDocuments,
});

function MyDocuments() {
  const { data: clientData, isLoading: loadingClient } = useClientPortalData();
  
  const activeProject = clientData?.projects?.[0];
  const projectId = activeProject?.id;

  const { data: documents, isLoading: loadingDocs, isError } = useQuery({
    queryKey: ["project-documents", projectId],
    enabled: !!projectId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("project_documents")
        .select("*")
        .eq("project_id", projectId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  if (loadingClient || loadingDocs) {
    return (
      <AppShell title="Documentos">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-48 w-full" />)}
        </div>
      </AppShell>
    );
  }

  if (!activeProject) {
    return (
      <AppShell title="Documentos">
        <Card className="p-12 text-center border-dashed">
          <File className="size-12 text-muted-foreground/20 mx-auto mb-4" />
          <p className="text-muted-foreground">Nenhum projeto encontrado para listar documentos.</p>
        </Card>
      </AppShell>
    );
  }

  return (
    <AppShell title="Documentos">
      <div className="space-y-6">
        <div className="flex flex-col gap-2">
          <h2 className="text-2xl font-bold">Central de Documentos</h2>
          <p className="text-muted-foreground">Acesse contratos, manuais e arquivos do seu projeto: {activeProject.title}.</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {documents && documents.length > 0 ? (
            documents.map((doc) => (
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
                    {doc.size_bytes ? `${(doc.size_bytes / 1024 / 1024).toFixed(2)} MB` : "N/A"} • {new Date(doc.created_at).toLocaleDateString("pt-BR")}
                  </p>
                  
                  <div className="mt-auto pt-4 border-t border-sidebar-border/30">
                    <Button 
                      variant="ghost" 
                      className="w-full text-xs justify-between hover:bg-primary/10 hover:text-primary"
                      onClick={async () => {
                        const { data, error } = await supabase.storage.from('project-documents').createSignedUrl(doc.file_path, 60);
                        if (data?.signedUrl) window.open(data.signedUrl, '_blank');
                        else toast.error("Erro ao gerar link de download.");
                      }}
                    >
                      Baixar Arquivo
                      <Download className="size-3 ml-2" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="col-span-full py-20 text-center opacity-40">
              <FileText className="size-12 mx-auto mb-2" />
              <p>Nenhum documento compartilhado ainda.</p>
            </div>
          )}
          
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

