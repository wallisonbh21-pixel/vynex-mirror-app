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
  Link as LinkIcon,
  Rocket,
  LayoutDashboard,
  Brain
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
import { getBriefing } from "@/lib/briefing";
import { useQuery } from "@tanstack/react-query";
import { buildProjectContext, generateIntelligence } from "@/lib/ai-core";
import { AICorePanel } from "@/components/AICorePanel";
import { getSitePlan } from "@/lib/planner";
import { useStudioData } from "@/lib/studio/hooks";

import { currency, shortDate, PROJECT_STATUS, label } from "@/lib/format";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/projetos/$projectId")({
  beforeLoad: () => requireCriador(),
  head: () => ({
    meta: [{ title: "Detalhes do Projeto — ScaleNexus" }],
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

  const { data: savedBriefing } = useQuery({
    queryKey: ["briefing", projectId],
    queryFn: () => getBriefing(projectId),
  });


  const { data: sitePlan } = useQuery({
    queryKey: ["site-plan", projectId],
    queryFn: () => getSitePlan(projectId),
  });

  const { data: studioData } = useStudioData(projectId);

  const intelligence = useMemo(() => {
    const context = buildProjectContext(projectId, savedBriefing || null, sitePlan || null, studioData || null);
    return generateIntelligence(context, studioData || null);
  }, [projectId, savedBriefing, sitePlan, studioData]);

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
            <TabsList className="grid grid-cols-6 w-full bg-muted/20 p-1 h-12">
              <TabsTrigger value="briefing" className="gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm"><Briefcase className="size-4" /> Briefing</TabsTrigger>
              <TabsTrigger value="checklist" className="gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm"><CheckCircle2 className="size-4" /> Checklist</TabsTrigger>
              <TabsTrigger value="projeto" className="gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm"><Globe className="size-4" /> Projeto</TabsTrigger>
              <TabsTrigger value="reunioes" className="gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm"><Calendar className="size-4" /> Reuniões</TabsTrigger>
              <TabsTrigger value="financeiro" className="gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm"><CircleDollarSign className="size-4" /> Financeiro</TabsTrigger>
              <TabsTrigger value="historico" className="gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm"><Clock className="size-4" /> Histórico</TabsTrigger>

            </TabsList>
            <TabsContent value="briefing" className="mt-4 p-6 bg-card border rounded-2xl shadow-panel">
               <div className="flex items-center justify-between mb-8">
                 <div className="flex items-center gap-3">
                   <div className="p-3 rounded-xl bg-brand-500/10 text-brand-500">
                     <Briefcase className="size-6" />
                   </div>
                   <div>
                     <h3 className="text-xl font-bold">Briefing Inteligente</h3>
                     <p className="text-sm text-muted-foreground">Coleta e organização de informações do negócio.</p>
                   </div>
                 </div>
                 <div className="flex gap-2">
                   <Button variant="outline" asChild className="gap-2 border-brand-500/50 text-brand-500 hover:bg-brand-500/5">
                      <Link to="/briefing/$projectId" params={{ projectId: project.id }}>
                        <FileText className="size-4" /> {savedBriefing ? 'Editar Briefing' : 'Iniciar Briefing'}
                      </Link>
                   </Button>
                   <Button asChild className="gap-2 shadow-glow bg-gradient-brand border-none">
                      <Link to="/site-planner/$projectId" params={{ projectId: project.id }}>
                        <LayoutDashboard className="size-4" /> Site Planner
                      </Link>
                   </Button>
                 </div>
               </div>

               <div className="grid md:grid-cols-2 gap-8">
                 <div className="space-y-6">
                   <div>
                     <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-4">Dados Fundamentais</h4>
                     <div className="space-y-4">
                       <div className="flex justify-between border-b pb-2">
                         <span className="text-sm text-muted-foreground">Empresa:</span>
                         <span className="text-sm font-bold">{project.title}</span>
                       </div>
                       <div className="flex justify-between border-b pb-2">
                         <span className="text-sm text-muted-foreground">Segmento:</span>
                         <span className="text-sm font-bold">{project.site_type || 'N/A'}</span>
                       </div>
                     </div>
                   </div>
                   
                   <div>
                     <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-4">Progresso do Briefing</h4>
                     <div className="p-4 rounded-xl bg-muted/30 border border-dashed text-center">
                        <p className="text-xs text-muted-foreground">
                          {savedBriefing ? 'Briefing preenchido e pronto para uso no Studio.' : 'O briefing ainda não foi iniciado para este projeto.'}
                        </p>
                     </div>
                   </div>
                 </div>

                 <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-4">Ambiente de Criação</h4>
                    <div className="p-6 rounded-2xl bg-slate-900 text-white shadow-2xl overflow-hidden relative group">
                      <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Palette className="size-20" />
                      </div>
                      <h5 className="font-bold text-lg mb-2">ScaleNexus Studio</h5>
                      <p className="text-slate-400 text-xs leading-relaxed mb-6">
                        Abra o editor profissional para construir o site do cliente utilizando os dados do briefing.
                      </p>
                      <Button asChild className="w-full gap-2 bg-brand-500 hover:bg-brand-600 border-none font-bold">
                        <Link to="/studio/$projectId" params={{ projectId: project.id }}>
                          <Rocket className="size-4" /> Abrir Studio
                        </Link>
                      </Button>
                    </div>
                 </div>
               </div>
            </TabsContent>
            
            <TabsContent value="ai-core" className="mt-4">
              <AICorePanel intelligence={intelligence} />
            </TabsContent>
            
            <TabsContent value="financeiro" className="mt-4 p-6 bg-card border rounded-2xl shadow-panel">
               <div className="grid md:grid-cols-2 gap-8">
                 <div>
                   <h3 className="font-bold flex items-center gap-2 mb-4 text-primary">
                     <CircleDollarSign className="size-4" /> Resumo de Ganhos
                   </h3>
                   <div className="space-y-4 text-sm">
                     <div className="grid grid-cols-2 gap-2 border-b pb-2">
                       <span className="text-muted-foreground">Valor do Contrato:</span>
                       <span className="font-medium text-right">{currency(project.value)}</span>
                     </div>
                     <div className="grid grid-cols-2 gap-2 border-b pb-2">
                       <span className="text-muted-foreground">Sua Comissão ({project.commission_rate}%):</span>
                       <span className="font-bold text-brand-500 text-right">{currency(project.commission)}</span>
                     </div>
                     <div className="grid grid-cols-2 gap-2 border-b pb-2">
                       <span className="text-muted-foreground">Status do Pagamento:</span>
                       <span className="font-medium text-right uppercase text-xs">{project.commission_status}</span>
                     </div>
                   </div>
                 </div>
                 <div>
                   <h3 className="font-bold flex items-center gap-2 mb-4 text-primary">
                     <Info className="size-4" /> Regras Financeiras
                   </h3>
                   <p className="text-xs text-muted-foreground leading-relaxed">
                     A comissão é liberada para saque assim que o projeto é marcado como <strong>Entregue</strong> e o pagamento do cliente é confirmado pelo financeiro.
                   </p>
                 </div>
               </div>
            </TabsContent>
            
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
            
            <TabsContent value="reunioes" className="mt-4 p-6 bg-card border rounded-2xl shadow-panel">
               <div className="flex items-center justify-between mb-8">
                 <div className="flex items-center gap-3">
                   <div className="p-3 rounded-xl bg-primary/10 text-primary">
                     <Calendar className="size-6" />
                   </div>
                   <div>
                     <h3 className="text-xl font-bold">Agenda de Reuniões</h3>
                     <p className="text-sm text-muted-foreground">Alinhamentos estratégicos com o cliente.</p>
                   </div>
                 </div>
                 <Button asChild variant="outline" className="gap-2">
                   <Link to="/reunioes">Ver Todas</Link>
                 </Button>
               </div>

               <div className="flex flex-col items-center justify-center py-12 border-2 border-dashed rounded-2xl text-center">
                 <p className="text-muted-foreground italic mb-4">Nenhuma reunião agendada para este projeto.</p>
                 <Button className="font-bold shadow-glow" asChild>
                   <Link to="/reunioes">Agendar Reunião</Link>
                 </Button>
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

            {/* ScaleNexus Studio Entry */}
            <Button 
              variant="outline"
              className="w-full gap-2 h-12 text-base font-bold border-primary/20 hover:bg-primary/10 text-primary mt-4"
              asChild
            >
              <Link to={"/_authenticated/studio/$projectId" as any} params={{ projectId: project.id } as any}>
                🎨 Abrir no ScaleNexus Studio
              </Link>
            </Button>
          </div>
        </aside>
      </div>
    </AppShell>
  );
}
