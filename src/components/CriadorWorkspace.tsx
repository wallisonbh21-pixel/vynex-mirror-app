import { useState, useMemo } from "react";
import { useParams, Link } from "@tanstack/react-router";
import {
  FileText,
  Palette,
  Folder,
  CheckSquare,
  Globe,
  MessageSquare,
  Clock,
  Send,
  AlertCircle,
} from "lucide-react";
import { useProjetoChecklist, useProjetoNotes, useUpdateCreatorProjeto } from "@/lib/creator";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { currency } from "@/lib/format";

export function CriadorWorkspace({ project }: { project: any }) {
  const { data: checklist = [], toggle } = useProjetoChecklist(project.id);
  const { data: notes = [], addNote } = useProjetoNotes(project.id);
  const [newNote, setNewNote] = useState("");
  const updateProjeto = useUpdateCreatorProjeto();

  const progress = useMemo(() => {
    if (checklist.length === 0) return 0;
    const completed = checklist.filter((i) => i.completed).length;
    return Math.round((completed / checklist.length) * 100);
  }, [checklist]);

  const handleSendApproval = () => {
    if (progress < 100) {
      toast.error("Complete o checklist antes de enviar para aprovação!");
      return;
    }
    if (!project.delivery_link) {
      toast.error("O link de pré-visualização é obrigatório.");
      return;
    }
    updateProjeto.mutate({
      id: project.id,
      status: "aguardando_aprovacao",
      submitted_at: new Date().toISOString()
    });
  };

  return (
    <div className="space-y-6">
      {/* 6. CHECKLIST */}
      <section className="rounded-2xl border border-border bg-card p-6 shadow-panel">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <CheckSquare className="size-5 text-primary" /> Checklist de Produção
          </h2>
          <span className="text-sm font-bold text-muted-foreground">{checklist.filter(i => i.completed).length} de {checklist.length} concluídos</span>
        </div>
        <Progress value={progress} className="h-2 mb-6" />
        <div className="space-y-2">
          {checklist.map((item) => (
            <div key={item.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50">
              <Checkbox 
                checked={item.completed} 
                onCheckedChange={(checked) => toggle.mutate({ itemId: item.id, completed: checked as boolean })}
              />
              <span className={cn("text-sm", item.completed && "line-through text-muted-foreground")}>{item.title}</span>
            </div>
          ))}
        </div>
      </section>

      {/* 8. NOTAS */}
      <section className="rounded-2xl border border-border bg-card p-6 shadow-panel">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <MessageSquare className="size-5 text-primary" /> Notas do Projeto
        </h2>
        <div className="space-y-4">
          <div className="flex gap-2">
            <Input 
              value={newNote} 
              onChange={(e) => setNewNote(e.target.value)} 
              placeholder="Adicionar nota..."
            />
            <Button onClick={() => { addNote.mutate(newNote); setNewNote(""); }}>Adicionar</Button>
          </div>
          <div className="space-y-2">
            {notes.map((note) => (
              <div key={note.id} className="text-sm p-3 bg-muted rounded-lg border">
                {note.content}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 9. ENVIO */}
      {project.status === "em_producao" && (
        <section className="rounded-2xl border border-border bg-card p-6 shadow-panel text-center">
          <Button size="lg" className="w-full gap-2" onClick={handleSendApproval}>
            <Send className="size-5" /> Enviar para Aprovação
          </Button>
        </section>
      )}
    </div>
  );
}

import { cn } from "@/lib/utils";
