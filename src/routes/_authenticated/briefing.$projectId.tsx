import { createFileRoute, useNavigate, useParams } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { 
  ArrowLeft, 
  ArrowRight, 
  Save, 
  CheckCircle2, 
  AlertTriangle,
  LayoutDashboard,
  Building2,
  Target,
  Users,
  Sparkles,
  Palette,
  Eye,
  Rocket,
  Plus,
  Trash2,
  FileText
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { AppShell } from "@/components/AppShell";
import { cn } from "@/lib/utils";
import { getBriefing, saveBriefing, BriefingData } from "@/lib/briefing";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/briefing/$projectId")({
  component: BriefingPage,
  head: () => ({
    meta: [{ title: "Briefing Inteligente — ScaleNexus" }],
  }),
});

const STEPS = [
  { id: 1, title: "Negócio", icon: Building2 },
  { id: 2, title: "Objetivo", icon: Target },
  { id: 3, title: "Público", icon: Users },
  { id: 4, title: "Diferenciais", icon: Sparkles },
  { id: 5, title: "Conteúdo", icon: FileText },
  { id: 6, title: "Visual", icon: Palette },
  { id: 7, title: "Referências", icon: Eye },
];

const INITIAL_DATA: BriefingData = {
  businessName: "",
  niche: "",
  description: "",
  objectives: [],
  audience: {
    target: "",
    age: "",
    location: "",
    profile: "",
    needs: "",
    problems: "",
    feeling: "",
  },
  differentiators: [""],
  contentAssets: [],
  brandIdentity: {
    hasIdentity: false,
    logo: false,
    colors: "",
    secondaryColors: "",
    font: "",
    references: "",
    manualUrl: "",
  },
  visualStyle: [],
  references: {
    links: "",
    avoid: "",
    requirements: "",
    notes: "",
  },
};

function BriefingPage() {
  const { projectId } = useParams({ from: "/_authenticated/briefing/$projectId" });
  const navigate = useNavigate();
  const queryCliente = useQueryClient();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<BriefingData>(INITIAL_DATA);

  const { data: project } = useQuery({
    queryKey: ["project", projectId],
    queryFn: async () => {
      const { data, error } = await supabase.from("projects").select("*").eq("id", projectId).single();
      if (error) throw error;
      return data;
    },
  });

  const { data: savedBriefing, isLoading } = useQuery({
    queryKey: ["briefing", projectId],
    queryFn: () => getBriefing(projectId),
  });

  useEffect(() => {
    if (savedBriefing) {
      setFormData(savedBriefing);
    } else if (project) {
      setFormData(prev => ({
        ...prev,
        businessName: project.title,
        niche: project.site_type || "",
        description: project.description || "",
      }));
    }
  }, [savedBriefing, project]);

  const save = useMutation({
    mutationFn: (data: BriefingData) => saveBriefing(projectId, data),
    onSuccess: () => {
      queryCliente.invalidateQueries({ queryKey: ["briefing", projectId] });
      toast.success("Progresso salvo automaticamente");
    },
  });

  const handleNext = () => {
    if (step < 7) {
      setStep(step + 1);
      save.mutate(formData);
    } else {
      // Final summary
      setStep(8);
    }
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const updateField = (path: string, value: any) => {
    const keys = path.split(".");
    setFormData(prev => {
      const newData = { ...prev };
      let current: any = newData;
      for (let i = 0; i < keys.length - 1; i++) {
        const key = keys[i] as keyof typeof current;
        current[key] = { ...current[key] };
        current = current[key];
      }
      current[keys[keys.length - 1] as keyof typeof current] = value;
      return newData;
    });
  };

  const calculateScore = () => {
    let total = 0;
    let filled = 0;
    
    // Simplistic score
    if (formData.businessName) filled++; total++;
    if (formData.niche) filled++; total++;
    if (formData.description) filled++; total++;
    if (formData.objectives.length > 0) filled++; total++;
    if (formData.audience.target) filled++; total++;
    if (formData.differentiators.filter(d => d).length > 0) filled++; total++;
    if (formData.contentAssets.length > 0) filled++; total++;
    
    return Math.round((filled / total) * 100);
  };

  if (isLoading) return <div className="p-8 text-center">Carregando briefing...</div>;

  return (
    <AppShell 
      title="🧠 Briefing Inteligente" 
      description="Vamos entender o negócio para preparar o melhor projeto possível."
    >
      <div className="max-w-4xl mx-auto">
        {/* Progress bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between text-sm font-medium mb-2">
            <span className="text-brand-500">Etapa {step > 7 ? 7 : step} de 7</span>
            <span>{calculateScore()}% completo</span>
          </div>
          <Progress value={step > 7 ? 100 : (step / 7) * 100} className="h-2" />
        </div>

        <div className="grid gap-8 lg:grid-cols-[1fr_280px]">
          <div className="space-y-6">
            <div className="rounded-2xl border border-border bg-card p-8 shadow-panel min-h-[400px]">
              {step === 1 && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-3 rounded-xl bg-brand-500/10 text-brand-500">
                      <Building2 className="size-6" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold">O Negócio</h2>
                      <p className="text-sm text-muted-foreground">Informações fundamentais sobre a empresa.</p>
                    </div>
                  </div>
                  
                  <div className="grid gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Nome da empresa *</label>
                      <Input 
                        value={formData.businessName} 
                        onChange={e => updateField("businessName", e.target.value)}
                        placeholder="Ex: ScaleNexus Tech"
                      />
                    </div>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Segmento</label>
                        <Input 
                          value={formData.niche} 
                          onChange={e => updateField("niche", e.target.value)}
                          placeholder="Ex: Tecnologia"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Nicho</label>
                        <Input 
                          value={formData.niche} 
                          placeholder="Ex: SaaS / B2B"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Descrição do negócio</label>
                      <Textarea 
                        value={formData.description} 
                        onChange={e => updateField("description", e.target.value)}
                        placeholder="O que a empresa faz exatamente?"
                        rows={4}
                      />
                    </div>
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-3 rounded-xl bg-brand-500/10 text-brand-500">
                      <Target className="size-6" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold">Objetivo do Site</h2>
                      <p className="text-sm text-muted-foreground">O que o site deve realizar?</p>
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-3">
                    {[
                      { id: "whatsapp", label: "📱 Receber contatos pelo WhatsApp" },
                      { id: "vendas", label: "🛒 Vender produtos" },
                      { id: "agendamento", label: "📅 Receber agendamentos" },
                      { id: "loja", label: "📍 Atrair para loja física" },
                      { id: "orcamento", label: "📋 Gerar orçamentos" },
                      { id: "institucional", label: "🏢 Apresentar a empresa" },
                      { id: "branding", label: "⭐ Fortalecer a marca" },
                      { id: "leads", label: "🎯 Captar leads" },
                    ].map(obj => (
                      <div 
                        key={obj.id}
                        className={cn(
                          "flex items-center gap-3 p-4 rounded-xl border transition-all cursor-pointer",
                          formData.objectives.includes(obj.id) 
                            ? "border-brand-500 bg-brand-500/5 ring-1 ring-brand-500" 
                            : "border-border hover:border-brand-500/50"
                        )}
                        onClick={() => {
                          const current = formData.objectives;
                          const next = current.includes(obj.id) 
                            ? current.filter(i => i !== obj.id)
                            : [...current, obj.id];
                          updateField("objectives", next);
                        }}
                      >
                        <Checkbox checked={formData.objectives.includes(obj.id)} />
                        <span className="text-sm font-medium">{obj.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Steps 3-7 would follow the same pattern... shortcutting for v1 core flow */}
              {step > 2 && step <= 7 && (
                <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
                  <div className="p-4 rounded-full bg-muted">
                    <Rocket className="size-12 text-muted-foreground" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold">Etapa {step}: {STEPS.find(s => s.id === step)?.title || ''}</h3>
                    <p className="text-muted-foreground">Esta etapa está sendo preparada para coleta de dados detalhados.</p>
                  </div>
                  <Button variant="outline" onClick={handleNext}>Pular esta etapa</Button>
                </div>
              )}

              {step === 8 && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-3 rounded-xl bg-brand-500/10 text-brand-500">
                      <CheckCircle2 className="size-6" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold">Resumo do Briefing</h2>
                      <p className="text-sm text-muted-foreground">Confira se tudo está correto antes de iniciar a criação.</p>
                    </div>
                  </div>

                  <div className="space-y-4 divide-y">
                    <div className="py-4">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Empresa</h4>
                      <p className="font-medium">{formData.businessName}</p>
                      <p className="text-sm text-muted-foreground">{formData.description}</p>
                    </div>
                    <div className="py-4">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Objetivos</h4>
                      <div className="flex flex-wrap gap-2">
                        {formData.objectives.map(o => (
                          <span key={o} className="px-2 py-1 rounded bg-muted text-xs font-medium uppercase">{o}</span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="pt-6 border-t">
                    <Button 
                      className="w-full h-12 text-lg font-bold bg-gradient-brand border-none shadow-glow hover:opacity-90"
                      onClick={() => navigate({ to: "/site-planner/$projectId", params: { projectId } })}
                    >
                      <Sparkles className="size-5 mr-2" /> Gerar Plano do Site
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Navigation buttons */}
            {step <= 7 && (
              <div className="flex items-center justify-between">
                <Button 
                  variant="ghost" 
                  onClick={handleBack} 
                  disabled={step === 1}
                  className="gap-2"
                >
                  <ArrowLeft className="size-4" /> Anterior
                </Button>
                <div className="flex items-center gap-3">
                  <Button variant="outline" onClick={() => save.mutate(formData)}>
                    <Save className="size-4 mr-2" /> Salvar e sair
                  </Button>
                  <Button onClick={handleNext} className="gap-2 bg-brand-500 hover:bg-brand-600">
                    Próximo <ArrowRight className="size-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>

          <aside className="space-y-6">
            <div className="rounded-2xl border border-border bg-card p-6 shadow-panel">
              <h3 className="font-bold text-sm mb-4 flex items-center gap-2">
                <Target className="size-4 text-brand-500" /> Recomendações
              </h3>
              <div className="space-y-4">
                <div className="p-3 rounded-lg bg-muted/50 border text-xs">
                  <p className="font-bold text-brand-500 mb-1">Dica Pro</p>
                  <p className="text-muted-foreground">Para sites de {formData.niche || 'este nicho'}, foque em depoimentos e CTAs diretas para WhatsApp.</p>
                </div>
                {formData.objectives.includes('whatsapp') && (
                  <div className="p-3 rounded-lg bg-green-500/5 border border-green-500/20 text-xs">
                    <p className="font-bold text-green-500 mb-1">Estratégia WhatsApp</p>
                    <p className="text-muted-foreground">Posicione o botão flutuante no canto inferior direito.</p>
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-card p-6 shadow-panel">
              <h3 className="font-bold text-sm mb-4 flex items-center gap-2">
                <AlertTriangle className="size-4 text-warning" /> Pendências
              </h3>
              <ul className="space-y-2 text-xs">
                {!formData.businessName && <li className="flex items-center gap-2 text-muted-foreground"><div className="size-1.5 rounded-full bg-warning" /> Nome da empresa</li>}
                {formData.objectives.length === 0 && <li className="flex items-center gap-2 text-muted-foreground"><div className="size-1.5 rounded-full bg-warning" /> Objetivos do site</li>}
                <li className="flex items-center gap-2 text-muted-foreground"><div className="size-1.5 rounded-full bg-muted" /> Fotos da empresa</li>
                <li className="flex items-center gap-2 text-muted-foreground"><div className="size-1.5 rounded-full bg-muted" /> Logotipo</li>
              </ul>
            </div>
          </aside>
        </div>
      </div>
    </AppShell>
  );
}
