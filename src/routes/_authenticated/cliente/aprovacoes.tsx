import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { useClientProjects } from "@/lib/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckCircle2, AlertCircle, Eye, MessageSquare, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription, 
  DialogFooter 
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/_authenticated/cliente/aprovacoes")({
  component: MyApprovals,
});

function MyApprovals() {
  const queryClient = useQueryClient();
  const { data: projects, isLoading: loadingProjects } = useClientProjects();
  const [feedbackModalOpen, setFeedbackModalOpen] = useState(false);
  const [feedbackText, setFeedbackText] = useState("");
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);
  
  const projectId = projects?.[0]?.id;

  const { data: events, isLoading: loadingEvents } = useQuery({
    queryKey: ["client-approval-events", projectId],
    enabled: !!projectId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("project_approval_events")
        .select("*")
        .eq("project_id", projectId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  if (loadingProjects || loadingEvents) {
    return (
      <AppShell title="Aprovações">
        <Skeleton className="h-96 w-full" />
      </AppShell>
    );
  }

  const project = projects?.[0];

  return (
    <AppShell title="Aprovações">
      <div className="space-y-6">
        <div className="flex flex-col gap-2">
          <h2 className="text-2xl font-bold">Portal de Aprovação</h2>
          <p className="text-muted-foreground">Revise as versões enviadas e forneça seu feedback.</p>
        </div>

        {project?.status === "aguardando_aprovacao" && (
          <Card className="border-primary/20 bg-primary/5 shadow-glow-sm">
            <CardContent className="p-6 flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="flex size-12 items-center justify-center rounded-full bg-primary/20 text-primary">
                  <AlertCircle className="size-6" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">Nova Versão Disponível</h3>
                  <p className="text-sm text-muted-foreground">O projeto "{project.title}" aguarda sua revisão final.</p>
                </div>
              </div>
              <div className="flex gap-3 w-full md:w-auto">
                <Button 
                  variant="outline" 
                  className="flex-1 md:flex-none"
                  asChild
                >
                  <a href={project.delivery_link || "#"} target="_blank" rel="noopener noreferrer">
                    <Eye className="mr-2 size-4" />
                    Visualizar
                  </a>
                </Button>
                <Button 
                  variant="outline"
                  className="flex-1 md:flex-none"
                  onClick={() => setFeedbackModalOpen(true)}
                >
                  <MessageSquare className="mr-2 size-4" />
                  Solicitar Ajustes
                </Button>
                <Button 
                  className="flex-1 md:flex-none shadow-glow"
                  onClick={async () => {
                    const { error } = await supabase
                      .from("project_approval_events")
                      .insert({
                        project_id: project.id,
                        event_type: "APPROVAL",
                        actor_label: "Cliente",
                        message: "Projeto aprovado pelo cliente via Portal.",
                        new_status: "aprovado"
                      });
                    
                    if (!error) {
                      await supabase
                        .from("projects")
                        .update({ 
                          status: "aprovado",
                          client_approved_at: new Date().toISOString()
                        })
                        .eq("id", project.id);
                      
                      toast.success("Projeto aprovado com sucesso!");
                      queryClient.invalidateQueries({ queryKey: ["client-projects"] });
                      queryClient.invalidateQueries({ queryKey: ["client-approval-events", project.id] });
                    } else {
                      toast.error("Erro ao aprovar projeto.");
                    }
                  }}
                >
                  <CheckCircle2 className="mr-2 size-4" />
                  Aprovar Agora
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <Dialog open={feedbackModalOpen} onOpenChange={setFeedbackModalOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Solicitar Ajustes</DialogTitle>
              <DialogDescription>
                Descreva detalhadamente o que precisa ser alterado para que nossa equipe possa realizar os ajustes.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <Textarea 
                placeholder="Ex: Gostaria de mudar a cor do botão principal e ajustar o texto da seção sobre..."
                className="min-h-32"
                value={feedbackText}
                onChange={(e) => setFeedbackText(e.target.value)}
              />
            </div>
            <DialogFooter className="flex gap-2 sm:gap-0">
              <Button variant="ghost" onClick={() => setFeedbackModalOpen(false)}>Cancelar</Button>
              <Button 
                disabled={!feedbackText.trim() || isSubmittingFeedback}
                onClick={async () => {
                  setIsSubmittingFeedback(true);
                  try {
                    const { error } = await supabase
                      .from("project_approval_events")
                      .insert({
                        project_id: project!.id,
                        event_type: "FEEDBACK",
                        actor_label: "Cliente",
                        message: feedbackText,
                        new_status: "em_revisao"
                      });
                    
                    if (error) throw error;

                    await supabase
                      .from("projects")
                      .update({ status: "em_revisao" })
                      .eq("id", project!.id);

                    toast.success("Feedback enviado com sucesso!");
                    setFeedbackModalOpen(false);
                    setFeedbackText("");
                    queryClient.invalidateQueries({ queryKey: ["client-projects"] });
                    queryClient.invalidateQueries({ queryKey: ["client-approval-events", project!.id] });
                  } catch (err: any) {
                    toast.error("Erro ao enviar feedback: " + err.message);
                  } finally {
                    setIsSubmittingFeedback(false);
                  }
                }}
              >
                {isSubmittingFeedback && <Loader2 className="mr-2 size-4 animate-spin" />}
                Enviar Solicitação
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <div className="grid gap-6 md:grid-cols-3">
          <div className="md:col-span-2 space-y-6">
            <Card className="border-sidebar-border/50 bg-sidebar/30 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-lg">Histórico de Decisões</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {events && events.length > 0 ? (
                    events.map((event) => (
                      <div key={event.id} className="flex gap-4">
                        <div className={cn(
                          "mt-1 flex size-8 shrink-0 items-center justify-center rounded-full",
                          event.event_type === "APPROVAL" ? "bg-green-500/10 text-green-500" :
                          event.event_type === "FEEDBACK" ? "bg-yellow-500/10 text-yellow-500" :
                          "bg-blue-500/10 text-blue-500"
                        )}>
                          {event.event_type === "APPROVAL" ? <CheckCircle2 className="size-4" /> :
                           event.event_type === "FEEDBACK" ? <MessageSquare className="size-4" /> :
                           <Eye className="size-4" />}
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold">{event.actor_label}</span>
                            <span className="text-xs text-muted-foreground">
                              {new Date(event.created_at).toLocaleString("pt-BR")}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground">{event.message || "Atualização de status"}</p>
                          {event.new_status && (
                            <Badge variant="outline" className="text-[10px] uppercase">
                              {event.new_status}
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-center py-8 text-muted-foreground italic">Nenhum evento registrado ainda.</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="border-sidebar-border/50 bg-sidebar/30 backdrop-blur-sm h-fit">
            <CardHeader>
              <CardTitle className="text-lg">Resumo</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Status Atual</span>
                  <Badge className="capitalize">{project?.status.replace("_", " ") || "Pendente"}</Badge>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Versão Atual</span>
                  <span className="font-medium">v1.0.0</span>
                </div>
              </div>
              <Separator className="bg-sidebar-border/50" />
              <p className="text-xs text-muted-foreground">
                Todas as aprovações são registradas e vinculadas ao seu perfil para garantir a integridade do processo de entrega.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(" ");
}

function Separator({ className }: { className?: string }) {
  return <div className={cn("h-px w-full bg-border", className)} />;
}
