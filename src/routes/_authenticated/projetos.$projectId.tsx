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
            <TabsList className="grid grid-cols-4 w-full">
              <TabsTrigger value="briefing" className="gap-2"><Briefcase className="size-4" /> Briefing</TabsTrigger>
              <TabsTrigger value="checklist" className="gap-2"><CheckCircle2 className="size-4" /> Checklist</TabsTrigger>
              <TabsTrigger value="projeto" className="gap-2"><Globe className="size-4" /> Projeto</TabsTrigger>
              <TabsTrigger value="historico" className="gap-2"><Clock className="size-4" /> Histórico</TabsTrigger>
            </TabsList>
            <TabsContent value="briefing" className="mt-4 p-6 bg-card border rounded-2xl shadow-panel">
               <h3 className="font-semibold mb-4">Dados do Cliente</h3>
               <p className="text-muted-foreground">{project.description}</p>
            </TabsContent>
            <TabsContent value="checklist" className="mt-4 p-6 bg-card border rounded-2xl shadow-panel">
               <Progress value={progress} className="h-2 mb-4" />
               <div className="space-y-2">
                 {checklist.map(item => (
                   <div key={item.id} className="flex items-center gap-2 p-2 border rounded-lg">
                     <Checkbox checked={item.completed} onCheckedChange={(c) => toggle.mutate({ itemId: item.id, completed: !!c })} />
                     {item.title}
                   </div>
                 ))}
               </div>
            </TabsContent>
            <TabsContent value="projeto" className="mt-4 p-6 bg-card border rounded-2xl shadow-panel">
               <div className="flex gap-4">
                 <Button asChild><a href={project.delivery_link || "#"} target="_blank">Visualizar Site</a></Button>
               </div>
            </TabsContent>
            <TabsContent value="historico" className="mt-4 p-6 bg-card border rounded-2xl shadow-panel">
               {events.map(e => <div key={e.id} className="text-sm py-2 border-b">{e.message}</div>)}
            </TabsContent>
          </Tabs>
        </div>
        
        <aside className="space-y-6">
          <div className="rounded-2xl border p-6 shadow-panel">
            <h3 className="font-semibold mb-4">Notas do Criador</h3>
            <div className="space-y-2 mb-4">
              {notes.map(n => <div key={n.id} className="text-xs p-2 bg-muted rounded">{n.content}</div>)}
            </div>
            <div className="flex gap-2">
               <Input value={newNote} onChange={e => setNewNote(e.target.value)} />
               <Button onClick={() => { addNote.mutate(newNote); setNewNote(""); }}>+</Button>
            </div>
          </div>
          {project.status === "em_producao" && (
            <Button className="w-full" onClick={() => {
              if (progress < 100) return toast.error("Complete o checklist!");
              updateProject.mutate({ id: project.id, status: "aguardando_aprovacao" });
            }}><Send className="size-4 mr-2" /> Enviar para Aprovação</Button>
          )}
        </aside>
      </div>
    </AppShell>
  );
}
