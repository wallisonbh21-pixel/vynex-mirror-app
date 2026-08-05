import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { 
  ArrowLeft, 
  Calendar, 
  Clock, 
  CircleDollarSign, 
  Globe, 
  User,
  ExternalLink,
  MessageSquare,
  FileText,
  Briefcase,
  Palette,
  FolderOpen,
  CheckCircle2,
  Info,
  Send,
  AlertCircle,
  Link as LinkIcon
} from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { ProjectProgression } from "@/components/ProjectProgression";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { requireCriador } from "@/lib/guard";
import { useRows } from "@/lib/data";
import { useMyCreatorProjects, useProjectChecklist, useProjectNotes, useUpdateCreatorProject } from "@/lib/creator";
import { useApprovalEvents } from "@/lib/approval";
import { currency, shortDate, PROJECT_STATUS, label } from "@/lib/format";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

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
  const { data: checklist = [], toggle } = useProjectChecklist(projectId);
  const { data: notes = [], addNote } = useProjectNotes(projectId);
  const updateProject = useUpdateCreatorProject();
  const [newNote, setNewNote] = useState("");

  const project = useMemo(() => projects.find((p) => p.id === projectId), [projects, projectId]);
  const client = useMemo(() => clients.find((c) => c.id === project?.client_id), [clients, project]);
  
  const progress = useMemo(() => {
    if (checklist.length === 0) return 0;
    const completed = checklist.filter((i) => i.completed).length;
    return Math.round((completed / checklist.length) * 100);
  }, [checklist]);

  if (!project) return null;

  const progressionSteps = PROJECT_STATUS.filter(s => !["cancelado", "disponivel"].includes(s));

  return (
    <AppShell title={project.title}>
      {/* HEADER INFO */}
      <div className="mb-6 rounded-2xl border bg-card p-6 shadow-panel">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">{project.title}</h1>
            <p className="text-muted-foreground">{client?.company || "Cliente"}</p>
          </div>
          <div className="flex gap-4">
            <div className="text-right">
              <div className="text-xs uppercase font-bold text-muted-foreground">Status</div>
              <StatusBadge status={project.status} />
            </div>
            <div className="text-right">
              <div className="text-xs uppercase font-bold text-muted-foreground">Prazo</div>
              <div className="font-bold">{shortDate(project.due_date)}</div>
            </div>
            <div className="text-right">
              <div className="text-xs uppercase font-bold text-muted-foreground">Comissão</div>
              <div className="font-bold text-primary">{currency(project.commission)}</div>
            </div>
          </div>
        </div>
        <div className="mt-6 border-t pt-6">
          <ProjectProgression steps={progressionSteps as any} currentStatus={project.status} />
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Tabs defaultValue="briefing">
            <TabsList className="grid grid-cols-5 w-full bg-muted/20 p-1 h-12">
              <TabsTrigger value="briefing" className="gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm"><Briefcase className="size-4" /> Briefing</TabsTrigger>
              <TabsTrigger value="id_visual" className="gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm"><Palette className="size-4" /> Identidade</TabsTrigger>
              <TabsTrigger value="checklist" className="gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm"><CheckCircle2 className="size-4" /> Checklist</TabsTrigger>
              <TabsTrigger value="projeto" className="gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm"><Globe className="size-4" /> Projeto</TabsTrigger>
              <TabsTrigger value="historico" className="gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm"><Clock className="size-4" /> Histórico</TabsTrigger>
            </TabsList>
            <TabsContent value="briefing" className="mt-4 p-6 bg-card border rounded-2xl shadow-panel">
               <div className="grid md:grid-cols-2 gap-8">
                 <div>
                   <h3 className="font-bold flex items-center gap-2 mb-4 text-primary">
                     <Briefcase className="size-4" /> Dados do Negócio
                   </h3>
                   <div className="space-y-4 text-sm">
                     <div className="grid grid-cols-2 gap-2 border-b pb-2">
                       <span className="text-muted-foreground">Empresa:</span>
                       <span className="font-medium text-right">{client?.company}</span>
                     </div>
                     <div className="grid grid-cols-2 gap-2 border-b pb-2">
                       <span className="text-muted-foreground">Nicho:</span>
                       <span className="font-medium text-right">{client?.niche}</span>
                     </div>
                     <div className="grid grid-cols-2 gap-2 border-b pb-2">
                       <span className="text-muted-foreground">Responsável:</span>
                       <span className="font-medium text-right">{client?.name}</span>
                     </div>
                     <div className="grid grid-cols-2 gap-2 border-b pb-2">
                       <span className="text-muted-foreground">Cidade/UF:</span>
                       <span className="font-medium text-right">{client?.city} - {client?.state}</span>
                     </div>
                   </div>
                 </div>
                 <div>
                   <h3 className="font-bold flex items-center gap-2 mb-4 text-primary">
                     <FileText className="size-4" /> Descrição & Observações
                   </h3>
                   <div className="bg-muted/30 p-4 rounded-xl text-sm whitespace-pre-wrap leading-relaxed">
                     {project.description || "Nenhuma descrição adicional fornecida."}
                   </div>
                 </div>
               </div>
            </TabsContent>
            
            <TabsContent value="id_visual" className="mt-4 p-6 bg-card border rounded-2xl shadow-panel">
               <div className="grid md:grid-cols-2 gap-8">
                 <div>
                   <h3 className="font-bold flex items-center gap-2 mb-4 text-primary">
                     <Palette className="size-4" /> Identidade Visual
                   </h3>
                   <div className="space-y-6 text-sm">
                     <div className="p-4 bg-muted/30 rounded-xl border border-dashed text-center">
                       <p className="text-muted-foreground italic">Arquivos de logotipo e marca serão exibidos aqui.</p>
                     </div>
                     <div>
                       <h4 className="font-bold text-xs uppercase text-muted-foreground mb-3 tracking-wider">Cores da Marca</h4>
                       <div className="flex gap-2">
                         <div className="size-10 rounded-lg bg-primary border shadow-sm" title="Primária"></div>
                         <div className="size-10 rounded-lg bg-secondary border shadow-sm" title="Secundária"></div>
                         <div className="size-10 rounded-lg bg-muted border shadow-sm" title="Neutro"></div>
                       </div>
                     </div>
                   </div>
                 </div>
                 <div>
                   <h3 className="font-bold flex items-center gap-2 mb-4 text-primary">
                     <FolderOpen className="size-4" /> Materiais
                   </h3>
                   <div className="space-y-2">
                     <div className="p-3 border rounded-xl flex items-center justify-between hover:bg-muted/50 transition-colors cursor-not-allowed opacity-60">
                       <div className="flex items-center gap-3">
                         <FileText className="size-4 text-muted-foreground" />
                         <span className="text-xs font-medium">Briefing_Completo.pdf</span>
                       </div>
                       <Button variant="ghost" size="icon" className="size-8"><ExternalLink className="size-3" /></Button>
                     </div>
                     <p className="text-[10px] text-muted-foreground text-center py-4">Utilize a área de "Projeto" para links externos.</p>
                   </div>
                 </div>
               </div>
            
            <TabsContent value="checklist" className="mt-4 p-6 bg-card border rounded-2xl shadow-panel">
               <div className="flex items-center justify-between mb-6">
                 <div>
                   <h3 className="font-bold">Checklist de Produção</h3>
                   <p className="text-xs text-muted-foreground">Complete todos os itens antes de enviar para aprovação.</p>
                 </div>
                 <div className="text-right">
                   <span className="text-2xl font-bold text-primary">{progress}%</span>
                 </div>
               </div>
               <Progress value={progress} className="h-3 mb-8" />
               <div className="grid gap-3">
                 {checklist.map(item => (
                   <label key={item.id} className={cn(
                     "flex items-center gap-4 p-4 rounded-xl border transition-all cursor-pointer hover:bg-muted/50",
                     item.completed ? "bg-muted/30 border-primary/20" : "bg-card border-border"
                   )}>
                     <Checkbox 
                        checked={item.completed} 
                        onCheckedChange={(c) => toggle.mutate({ itemId: item.id, completed: !!c })}
                        className="size-5"
                     />
                     <span className={cn("font-medium", item.completed && "line-through text-muted-foreground")}>
                       {item.title}
                     </span>
                   </label>
                 ))}
               </div>
            </TabsContent>

            <TabsContent value="projeto" className="mt-4 p-6 bg-card border rounded-2xl shadow-panel">
               <div className="max-w-md mx-auto py-10 text-center">
                 <div className="size-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                   <Globe className="size-8 text-primary" />
                 </div>
                 <h3 className="text-xl font-bold mb-2">Ambiente de Pré-visualização</h3>
                 <p className="text-muted-foreground mb-8">
                   Este é o link que o cliente usará para revisar o site.
                 </p>
                 
                 {project.delivery_link ? (
                   <div className="space-y-4">
                     <div className="p-4 bg-muted rounded-xl border font-mono text-sm break-all">
                       {project.delivery_link}
                     </div>
                     <div className="flex gap-2">
                       <Button className="flex-1 gap-2" asChild>
                         <a href={project.delivery_link} target="_blank"><ExternalLink className="size-4" /> Abrir Site</a>
                       </Button>
                       <Button variant="outline" onClick={() => {
                         navigator.clipboard.writeText(project.delivery_link || "");
                         toast.success("Link copiado!");
                       }}><LinkIcon className="size-4" /></Button>
                     </div>
                   </div>
                 ) : (
                   <div className="p-8 rounded-2xl border border-dashed text-muted-foreground italic">
                     Link de entrega ainda não configurado.
                   </div>
                 )}
               </div>
            </TabsContent>

            <TabsContent value="historico" className="mt-4 overflow-hidden border rounded-2xl bg-card shadow-panel">
               <div className="divide-y">
                 {events.map((event) => (
                    <div key={event.id} className="p-4 flex gap-4 hover:bg-muted/30 transition-colors">
                      <div className={cn(
                        "flex size-10 shrink-0 items-center justify-center rounded-full text-xs font-bold shadow-sm",
                        event.event_type.includes('ajustes') ? "bg-red-500/10 text-red-500" : "bg-primary/10 text-primary"
                      )}>
                        {event.actor_label[0]}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-bold text-sm">{event.actor_label}</span>
                          <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">{shortDate(event.created_at)}</span>
                        </div>
                        <p className="text-sm text-foreground leading-relaxed">{event.message}</p>
                        {event.new_status && (
                          <div className="mt-3">
                            <StatusBadge status={event.new_status} className="h-5 px-2 text-[10px] uppercase font-bold" />
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  {events.length === 0 && (
                    <div className="p-20 text-center">
                      <Clock className="size-10 text-muted/20 mx-auto mb-4" />
                      <p className="text-muted-foreground italic">Nenhuma atividade registrada ainda.</p>
                    </div>
                  )}
               </div>
            </TabsContent>
          </Tabs>
        </div>
        
        <aside className="space-y-6">
          <div className="rounded-2xl border bg-card p-6 shadow-panel">
            <h3 className="font-bold flex items-center gap-2 mb-4">
              <MessageSquare className="size-4 text-primary" /> Notas do Projeto
            </h3>
            <div className="space-y-3 mb-6 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
              {notes.map(n => (
                <div key={n.id} className="p-3 bg-muted/50 rounded-xl border border-border/50 relative group">
                  <p className="text-xs leading-relaxed">{n.content}</p>
                  <span className="text-[9px] text-muted-foreground mt-2 block opacity-0 group-hover:opacity-100 transition-opacity">
                    {shortDate(n.created_at)}
                  </span>
                </div>
              ))}
              {notes.length === 0 && (
                <p className="text-center text-xs text-muted-foreground py-10 italic">Nenhuma nota interna.</p>
              )}
            </div>
            <div className="flex flex-col gap-2">
               <Input 
                value={newNote} 
                onChange={e => setNewNote(e.target.value)} 
                placeholder="Escrever nota..."
                className="bg-muted/30 border-none shadow-none focus-visible:ring-1"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && newNote.trim()) {
                    addNote.mutate(newNote);
                    setNewNote("");
                  }
                }}
               />
               <Button 
                variant="secondary" 
                size="sm" 
                className="w-full font-bold"
                onClick={() => {
                  if (!newNote.trim()) return;
                  addNote.mutate(newNote);
                  setNewNote("");
                }}
               >Adicionar Nota</Button>
            </div>
          </div>

          <div className="rounded-2xl border bg-primary/5 border-primary/20 p-6 shadow-panel">
            <h3 className="font-bold flex items-center gap-2 mb-2">
              <Info className="size-4 text-primary" /> Orientações
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed mb-6">
              Certifique-se de que a versão mobile está impecável antes de enviar. O cliente revisará o site pelo link de pré-visualização.
            </p>

            {project.status === "em_producao" ? (
              <Button 
                className="w-full gap-2 shadow-lg shadow-primary/20 h-12 text-base font-bold" 
                onClick={() => {
                  if (progress < 100) {
                    toast.error("Complete o checklist de produção primeiro!");
                    return;
                  }
                  if (!project.delivery_link) {
                    toast.error("Configure o link do projeto antes de enviar.");
                    return;
                  }
                  
                  const confirmed = window.confirm("Tem certeza que deseja enviar este projeto para aprovação?");
                  if (confirmed) {
                    updateProject.mutate({ id: project.id, status: "aguardando_aprovacao" });
                  }
                }}
              >
                <Send className="size-5" /> Enviar para Aprovação
              </Button>
            ) : project.status === "ajustes" ? (
              <Button 
                className="w-full gap-2 bg-amber-500 hover:bg-amber-600 text-white font-bold h-12"
                onClick={() => updateProject.mutate({ id: project.id, status: "em_producao" })}
              >
                Retomar Produção
              </Button>
            ) : (
              <div className="text-center p-4 bg-muted/50 rounded-xl border border-dashed text-xs text-muted-foreground">
                Projeto com status: <StatusBadge status={project.status} className="inline-flex ml-1" />
              </div>
            )}
          </div>
        </aside>
      </div>
    </AppShell>
  );
}
