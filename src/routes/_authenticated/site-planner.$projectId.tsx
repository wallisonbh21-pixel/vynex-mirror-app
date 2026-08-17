import { createFileRoute, useNavigate, useParams, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { 
  ArrowLeft, 
  ArrowRight, 
  Save, 
  CheckCircle2, 
  AlertTriangle,
  LayoutDashboard,
  Target,
  Sparkles,
  Palette,
  Eye,
  Rocket,
  Plus,
  Trash2,
  FileText,
  GripVertical,
  Pencil,
  PlusCircle,
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { AppShell } from "@/components/AppShell";
import { cn } from "@/lib/utils";
import { getBriefing } from "@/lib/briefing";
import { getSitePlan, saveSitePlan, generateRecommendedPlan, SitePlanSection, SitePlanData } from "@/lib/planner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/site-planner/$projectId")({
  component: SitePlannerPage,
  head: () => ({
    meta: [{ title: "ScaleNexus Site Planner — Planejamento Inteligente" }],
  }),
});

function SitePlannerPage() {
  const { projectId } = useParams({ from: "/_authenticated/site-planner/$projectId" });
  const navigate = useNavigate();
  const queryCliente = useQueryClient();
  const [plan, setPlan] = useState<Partial<SitePlanData> | null>(null);
  const [editingSection, setEditingSection] = useState<string | null>(null);

  const { data: project } = useQuery({
    queryKey: ["project", projectId],
    queryFn: async () => {
      const { data, error } = await supabase.from("projects").select("*").eq("id", projectId).single();
      if (error) throw error;
      return data;
    },
  });

  const { data: briefing } = useQuery({
    queryKey: ["briefing", projectId],
    queryFn: () => getBriefing(projectId),
  });

  const { data: savedPlan, isLoading } = useQuery({
    queryKey: ["site-plan", projectId],
    queryFn: () => getSitePlan(projectId),
  });

  useEffect(() => {
    if (savedPlan) {
      setPlan(savedPlan);
    } else if (briefing) {
      const recommended = generateRecommendedPlan(briefing);
      setPlan(recommended);
    }
  }, [savedPlan, briefing]);

  const saveMutation = useMutation({
    mutationFn: (data: Partial<SitePlanData>) => saveSitePlan(projectId, data),
    onSuccess: () => {
      queryCliente.invalidateQueries({ queryKey: ["site-plan", projectId] });
      toast.success("Plano salvo com sucesso");
    },
  });

  const handleSaveAndStudio = async () => {
    if (!plan) return;
    await saveMutation.mutateAsync({ ...plan, status: 'revisado' });
    navigate({ to: "/studio/$projectId", params: { projectId } });
  };

  const updateSections = (newSections: SitePlanSection[]) => {
    if (!plan) return;
    // Update numbers
    const updated = newSections.map((s, i) => ({
      ...s,
      number: (i + 1).toString().padStart(2, '0')
    }));
    setPlan({ ...plan, sections: updated });
  };

  const removeSection = (id: string) => {
    if (!plan?.sections) return;
    if (confirm("Tem certeza que deseja remover esta seção?")) {
      const filtered = plan.sections.filter(s => s.id !== id);
      updateSections(filtered);
    }
  };

  const moveUp = (index: number) => {
    if (!plan?.sections || index === 0) return;
    const newSections = [...plan.sections];
    const prevSection = newSections[index - 1];
    const currSection = newSections[index];
    if (prevSection && currSection) {
      newSections[index] = prevSection;
      newSections[index - 1] = currSection;
      updateSections(newSections);
    }
    updateSections(newSections);
  };

  const moveDown = (index: number) => {
    if (!plan?.sections || index === plan.sections.length - 1) return;
    const newSections = [...plan.sections];
    const nextSection = newSections[index + 1];
    const currSection = newSections[index];
    if (nextSection && currSection) {
      newSections[index] = nextSection;
      newSections[index + 1] = currSection;
      updateSections(newSections);
    }
    updateSections(newSections);
  };

  if (isLoading) return <div className="p-8 text-center">Carregando plano inteligente...</div>;
  if (!plan) return <div className="p-8 text-center">Nenhum briefing encontrado para este projeto.</div>;

  return (
    <AppShell 
      title="🧠 Plano Inteligente do Site" 
      description="Com base no briefing, preparamos uma estrutura recomendada para este projeto."
    >
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* CABEÇALHO INFO */}
        <div className="rounded-2xl border bg-card p-6 shadow-panel">
          <div className="grid md:grid-cols-4 gap-6">
            <div className="space-y-1">
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Empresa</p>
              <p className="font-bold">{project?.title}</p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Nicho</p>
              <p className="font-bold capitalize">{briefing?.niche || 'Geral'}</p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Objetivo Principal</p>
              <p className="font-bold text-brand-500">{plan.strategy?.objective}</p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Compatibilidade</p>
              <div className="flex items-center gap-2">
                <span className="font-bold text-green-500">92%</span>
                <Progress value={92} className="h-1.5 w-16 bg-muted" />
              </div>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-[1fr_320px] gap-8">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <LayoutDashboard className="size-5 text-brand-500" /> 📐 Estrutura recomendada
              </h3>
              <Button variant="outline" size="sm" className="gap-2">
                <PlusCircle className="size-4" /> Adicionar seção
              </Button>
            </div>

            <div className="space-y-4">
              {plan.sections?.map((section, index) => (
                <div key={section.id} className="group relative">
                  <div className={cn(
                    "flex gap-4 p-5 rounded-2xl border bg-card transition-all hover:shadow-md",
                    section.essential ? "border-brand-500/30 bg-brand-500/5 shadow-sm" : "border-border"
                  )}>
                    <div className="flex flex-col items-center gap-1 shrink-0 pt-1">
                      <span className="text-[10px] font-black text-muted-foreground/50">{section.number}</span>
                      <div className="text-2xl">{section.icon}</div>
                    </div>
                    
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-lg">{section.name}</h4>
                          {section.essential && (
                            <span className="px-2 py-0.5 rounded-full bg-brand-500 text-[10px] text-white font-bold uppercase">Essencial</span>
                          )}
                          {section.recommended && !section.essential && (
                            <span className="px-2 py-0.5 rounded-full bg-blue-500 text-[10px] text-white font-bold uppercase">Recomendado</span>
                          )}
                        </div>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button variant="ghost" size="icon" className="size-8" onClick={() => moveUp(index)} disabled={index === 0}>
                            <ArrowLeft className="size-4 rotate-90" />
                          </Button>
                          <Button variant="ghost" size="icon" className="size-8" onClick={() => moveDown(index)} disabled={index === (plan.sections?.length || 0) - 1}>
                            <ArrowRight className="size-4 rotate-90" />
                          </Button>
                          <Button variant="ghost" size="icon" className="size-8 text-primary" onClick={() => setEditingSection(section.id)}>
                            <Pencil className="size-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="size-8 text-destructive" onClick={() => removeSection(section.id)}>
                            <Trash2 className="size-4" />
                          </Button>
                        </div>
                      </div>

                      {editingSection === section.id ? (
                        <div className="space-y-4 pt-2 animate-in fade-in zoom-in-95 duration-200">
                          <div className="grid gap-2">
                            <label className="text-xs font-bold uppercase">Objetivo</label>
                            <Input 
                              value={section.objective} 
                              onChange={(e) => {
                                const newSections = [...(plan.sections || [])];
                                newSections[index] = { ...section, objective: e.target.value };
                                setPlan({ ...plan, sections: newSections });
                              }}
                            />
                          </div>
                          <div className="grid gap-2">
                            <label className="text-xs font-bold uppercase">Recomendação Estratégica</label>
                            <Textarea 
                              value={section.recommendation} 
                              onChange={(e) => {
                                const newSections = [...(plan.sections || [])];
                                newSections[index] = { ...section, recommendation: e.target.value };
                                setPlan({ ...plan, sections: newSections });
                              }}
                              rows={2}
                            />
                          </div>
                          <div className="flex justify-end gap-2">
                            <Button size="sm" onClick={() => setEditingSection(null)}>Finalizar Edição</Button>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <p className="text-sm text-foreground/80 leading-relaxed">{section.objective}</p>
                          <div className="flex gap-2 p-3 rounded-xl bg-muted/40 border border-dashed">
                             <Sparkles className="size-4 text-brand-500 shrink-0 mt-0.5" />
                             <p className="text-xs text-muted-foreground leading-relaxed italic">{section.recommendation}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <Button variant="outline" className="w-full h-16 border-dashed border-2 gap-2 text-muted-foreground hover:text-brand-500 hover:border-brand-500 hover:bg-brand-500/5 transition-all">
              <PlusCircle className="size-5" /> Adicionar nova seção estratégica
            </Button>
          </div>

          <aside className="space-y-6">
            <div className="rounded-2xl border border-brand-500/20 bg-brand-500/5 p-6 shadow-panel">
              <h3 className="font-bold text-sm mb-4 flex items-center gap-2">
                <Target className="size-4 text-brand-500" /> 🎯 Estratégia recomendada
              </h3>
              <div className="space-y-4">
                <div className="space-y-1">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">CTA Principal</p>
                  <p className="text-sm font-medium">{plan.strategy?.primary_cta}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Estilo Visual</p>
                  <p className="text-sm font-medium">{plan.strategy?.visual_style}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Público Alvo</p>
                  <p className="text-sm font-medium">{plan.strategy?.audience}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Estrutura</p>
                  <p className="text-sm font-medium">{plan.sections?.length} seções sugeridas</p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border bg-card p-6 shadow-panel">
              <h3 className="font-bold text-sm mb-4 flex items-center gap-2 text-blue-500">
                <Sparkles className="size-4" /> ⚙️ Personalizar plano
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed mb-4">
                Você pode reordenar seções arrastando os botões de seta ou remover o que não for essencial para este cliente.
              </p>
              <div className="space-y-2">
                 <Button variant="outline" size="sm" className="w-full text-[10px] font-bold uppercase h-8" onClick={() => {
                   if (briefing) setPlan(generateRecommendedPlan(briefing));
                   toast.info("Estrutura resetada para o padrão");
                 }}>Resetar Estrutura</Button>
              </div>
            </div>
          </aside>
        </div>

        {/* FOOTER ACTIONS */}
        <div className="flex items-center justify-between border-t pt-8 pb-12">
          <Button variant="ghost" asChild className="gap-2">
            <Link to="/briefing/$projectId" params={{ projectId }}>
              <ArrowLeft className="size-4" /> Voltar ao Briefing
            </Link>
          </Button>
          <div className="flex gap-4">
            <Button variant="outline" onClick={() => saveMutation.mutate(plan as any)} disabled={saveMutation.isPending}>
              <Save className="size-4 mr-2" /> Salvar Rascunho
            </Button>
            <Button 
              className="gap-2 bg-gradient-brand shadow-glow border-none h-12 px-8 font-bold text-lg"
              onClick={handleSaveAndStudio}
            >
              <Rocket className="size-5" /> Abrir no ScaleNexus Studio
            </Button>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
