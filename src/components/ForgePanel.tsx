import React, { useState } from 'react';
import { 
  Sparkles, 
  Layout, 
  Target, 
  Palette, 
  CheckCircle2, 
  Circle, 
  ChevronRight, 
  Play, 
  X,
  ArrowRight,
  Loader2,
  Settings2,
  GripVertical,
  Trash2,
  Plus,
  Brain
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { ForgeBuildPlan, ForgeSectionPlan } from '@/lib/forge';
import { ScaleNexusProjetoContext } from '@/lib/ai-core';

interface ForgePanelProps {
  context: ScaleNexusProjetoContext;
  plan: ForgeBuildPlan;
  onUpdatePlan: (updatedPlan: ForgeBuildPlan) => void;
  onStartBuild: (plan: ForgeBuildPlan) => void;
  isBuilding: boolean;
  currentStepIndex?: number;
}

export function ForgePanel({ context, plan, onUpdatePlan, onStartBuild, isBuilding, currentStepIndex = -1 }: ForgePanelProps) {
  const [view, setView] = useState<'overview' | 'sections' | 'decisions'>('overview');

  const handleToggleSection = (sectionId: string) => {
    const updatedSections = plan.sections.map(s => 
      s.id === sectionId ? { ...s, recommended: !s.recommended } : s
    );
    onUpdatePlan({ ...plan, sections: updatedSections });
  };

  const handleRemoveSection = (sectionId: string) => {
    const updatedSections = plan.sections.filter(s => s.id !== sectionId);
    onUpdatePlan({ ...plan, sections: updatedSections });
  };

  if (isBuilding) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex flex-col items-center justify-center text-center space-y-4 py-8">
          <div className="relative">
            <div className="size-20 rounded-full bg-brand-500/20 flex items-center justify-center animate-pulse">
              <Sparkles className="size-10 text-brand-400" />
            </div>
            <div className="absolute inset-0 size-20 rounded-full border-2 border-brand-500/50 border-t-transparent animate-spin" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">Construindo seu site</h3>
            <p className="text-sm text-slate-400">A Forge está transformando estratégia em estrutura...</p>
          </div>
        </div>

        <div className="space-y-3">
          {plan.sections.map((section, idx) => {
            const isCompleted = idx < currentStepIndex;
            const isCurrent = idx === currentStepIndex;
            return (
              <div 
                key={section.id} 
                className={cn(
                  "flex items-center gap-3 p-3 rounded-xl border transition-all duration-300",
                  isCompleted ? "bg-emerald-500/10 border-emerald-500/20" :
                  isCurrent ? "bg-brand-500/10 border-brand-500/50 scale-[1.02]" :
                  "bg-slate-900 border-slate-800 opacity-50"
                )}
              >
                <div className="shrink-0">
                  {isCompleted ? <CheckCircle2 className="size-4 text-emerald-500" /> :
                   isCurrent ? <Loader2 className="size-4 text-brand-400 animate-spin" /> :
                   <Circle className="size-4 text-slate-700" />}
                </div>
                <div className="flex-1">
                  <p className={cn("text-xs font-bold", isCurrent ? "text-brand-400" : "text-slate-300")}>
                    {section.name}
                  </p>
                  {isCurrent && <p className="text-[10px] text-brand-400/70">Executando ADD_SECTION {section.type}...</p>}
                </div>
              </div>
            );
          })}
        </div>

        <Button 
          variant="outline" 
          className="w-full border-red-500/30 text-red-500 hover:bg-red-500/10 h-10 font-bold"
          onClick={() => window.location.reload()} // Quick way to cancel/reset for V1
        >
          Cancelar Construção
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-slate-950 text-slate-200">
      {/* Premium Header */}
      <div className="p-6 bg-gradient-to-br from-brand-600/20 to-transparent border-b border-slate-800">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2.5 rounded-xl bg-brand-500/20 text-brand-400 ring-1 ring-brand-500/30">
            <Sparkles className="size-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white leading-none mb-1">ScaleNexus Forge V1.1</h3>
            <p className="text-[10px] text-brand-400 font-bold uppercase tracking-[0.2em]">Diretor de Construção Digital</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800/50 backdrop-blur-sm">
            <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
              <Target className="size-3" /> Resumo do Projeto
            </h4>
            <div className="space-y-2">
              <div className="flex justify-between items-baseline">
                <span className="text-xs text-slate-400">Empresa:</span>
                <span className="text-sm font-bold text-white">{context.businessName}</span>
              </div>
              <div className="flex justify-between items-baseline">
                <span className="text-xs text-slate-400">Objetivo:</span>
                <span className="text-sm font-bold text-brand-400">{plan.goal}</span>
              </div>
              <div className="flex justify-between items-baseline">
                <span className="text-xs text-slate-400">Estilo:</span>
                <span className="text-sm font-bold text-slate-200">{plan.designDirection}</span>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-brand-500/5 border border-brand-500/20">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-[10px] font-bold text-brand-400 uppercase tracking-widest flex items-center gap-2">
                <Target className="size-3" /> Estratégia Digital
              </h4>
              <span className="text-xl font-black text-white">{plan.strategyScore.total}%</span>
            </div>
            <Progress value={plan.strategyScore.total} className="h-1.5 bg-slate-800" />
            <div className="grid grid-cols-5 gap-1 mt-3">
              {Object.entries(plan.strategyScore.breakdown).map(([key, value]) => (
                <div key={key} className="text-center">
                  <div className="text-[8px] uppercase text-slate-500 font-bold mb-0.5 truncate">{key}</div>
                  <div className="text-[10px] font-bold text-slate-300">{value}%</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs / Navigation */}
      <div className="flex items-center px-6 border-b border-slate-800 bg-slate-900/20">
        <button 
          className={cn(
            "py-4 px-2 text-xs font-bold uppercase tracking-widest transition-all relative",
            view === 'overview' ? "text-white" : "text-slate-500 hover:text-slate-300"
          )}
          onClick={() => setView('overview')}
        >
          Visão Geral
          {view === 'overview' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-500" />}
        </button>
        <button 
          className={cn(
            "py-4 px-2 ml-4 text-xs font-bold uppercase tracking-widest transition-all relative",
            view === 'decisions' ? "text-white" : "text-slate-500 hover:text-slate-300"
          )}
          onClick={() => setView('decisions')}
        >
          Decisões ({plan.decisions.length})
          {view === 'decisions' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-500" />}
        </button>
        <button 
          className={cn(
            "py-4 px-2 ml-4 text-xs font-bold uppercase tracking-widest transition-all relative",
            view === 'sections' ? "text-white" : "text-slate-500 hover:text-slate-300"
          )}
          onClick={() => setView('sections')}
        >
          Estrutura ({plan.sections.length})
          {view === 'sections' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-500" />}
        </button>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {view === 'overview' ? (
          <div className="p-6 space-y-6">
            {/* Visual Strategy Summary */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                <h5 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1 flex items-center gap-1.5">
                  <Target className="size-3" /> Objetivo
                </h5>
                <p className="text-xs font-bold text-white">{plan.goal}</p>
              </div>
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                <h5 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1 flex items-center gap-1.5">
                  <Brain className="size-3" /> Estratégia
                </h5>
                <p className="text-xs font-bold text-brand-400 truncate">{plan.strategy}</p>
              </div>
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                <h5 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1 flex items-center gap-1.5">
                  <Layout className="size-3" /> Estrutura
                </h5>
                <p className="text-xs font-bold text-white">{plan.sections.length} seções</p>
              </div>
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                <h5 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1 flex items-center gap-1.5">
                  <Palette className="size-3" /> Visual
                </h5>
                <p className="text-xs font-bold text-white truncate">{plan.designDirection}</p>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">Sequência de Construção</h4>
              <div className="space-y-1">
                {plan.sections.map((section, idx) => (
                  <div key={section.id} className="flex items-center gap-3 p-2 group">
                    <span className="text-[10px] font-mono text-slate-700 w-4">{idx + 1}</span>
                    <div className={cn(
                      "size-1.5 rounded-full transition-colors",
                      section.priority === 'ESSENTIAL' ? "bg-red-500" : 
                      section.priority === 'IMPORTANT' ? "bg-brand-500" : "bg-slate-800"
                    )} />
                    <span className="text-sm font-medium text-slate-300">{section.name}</span>
                    {section.priority === 'ESSENTIAL' && (
                      <span className="ml-auto text-[8px] font-black px-1.5 py-0.5 rounded-sm bg-red-500/10 text-red-500 border border-red-500/20 uppercase">Essencial</span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="p-4 rounded-xl border border-brand-500/30 bg-brand-500/5">
              <h5 className="text-[11px] font-bold text-brand-400 mb-2 flex items-center gap-2">
                <Brain className="size-3" /> Por que escolhi esta estrutura?
              </h5>
              <p className="text-[11px] text-slate-400 italic leading-relaxed">
                "Seu principal objetivo é {plan.goal.toLowerCase()}. Por isso, a Forge priorizou: 
                {plan.sections.filter(s => s.priority === 'ESSENTIAL').map(s => ` ✓ ${s.name}`).join(', ')}. 
                A ordem foi pensada para manter clareza, interesse e prova social antes da conversão final."
              </p>
            </div>
          </div>
        ) : view === 'decisions' ? (
          <div className="p-6 space-y-4">
            {plan.decisions.map(decision => (
              <div key={decision.id} className="p-4 rounded-xl border border-slate-800 bg-slate-900/30 group">
                <div className="flex items-center gap-2 mb-2">
                  <div className={cn(
                    "text-[9px] font-black px-2 py-0.5 rounded-full uppercase",
                    decision.priority === 'ESSENTIAL' ? "bg-red-500/20 text-red-400 border border-red-500/30" :
                    decision.priority === 'IMPORTANT' ? "bg-amber-500/20 text-amber-400 border border-amber-500/30" :
                    "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                  )}>
                    {decision.priority === 'ESSENTIAL' ? '🔴 Essencial' : decision.priority === 'IMPORTANT' ? '🟠 Importante' : '🟡 Opcional'}
                  </div>
                  <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">{decision.category}</span>
                </div>
                <h5 className="text-sm font-bold text-white mb-1">{decision.title}</h5>
                <p className="text-[11px] text-slate-300 leading-relaxed mb-3">{decision.decision}</p>
                
                <div className="p-2.5 rounded-lg bg-slate-950/50 border border-slate-800/50">
                  <h6 className="text-[9px] font-bold text-slate-500 uppercase mb-1">Motivo Estratégico</h6>
                  <p className="text-[10px] text-slate-400 italic leading-relaxed">{decision.reason}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-6 space-y-4">
            {plan.sections.map((section, idx) => (
              <div 
                key={section.id} 
                className={cn(
                  "p-4 rounded-xl border transition-all group",
                  section.recommended ? "bg-slate-900 border-slate-800" : "bg-slate-950 border-slate-900 opacity-50"
                )}
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="cursor-grab text-slate-700 hover:text-slate-400">
                    <GripVertical className="size-4" />
                  </div>
                  <div className="flex-1">
                    <h5 className="text-sm font-bold text-white">{section.name}</h5>
                    <p className="text-[10px] text-slate-500 font-medium">Etapa {idx + 1} • {section.type}</p>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="size-8 text-slate-600 hover:text-red-500"
                    onClick={() => handleRemoveSection(section.id)}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed mb-3">{section.purpose}</p>
                <div className="flex items-center gap-2">
                  <span className={cn(
                    "text-[9px] font-bold px-2 py-0.5 rounded-full uppercase",
                    section.priority === 'ESSENTIAL' ? "bg-red-500/10 text-red-500" : 
                    section.priority === 'IMPORTANT' ? "bg-brand-500/10 text-brand-400" : "bg-slate-800 text-slate-400"
                  )}>
                    {section.priority === 'ESSENTIAL' ? '🔴 Essencial' : section.priority === 'IMPORTANT' ? '🟠 Importante' : '🟡 Opcional'}
                  </span>
                  <span className="text-[9px] font-bold text-slate-600 ml-auto">Posição: {section.recommendedPosition}</span>
                </div>
              </div>
            ))}
            
            <Button variant="outline" className="w-full border-dashed border-slate-800 text-slate-500 hover:text-slate-300 hover:bg-slate-900/50 py-6 h-auto">
              <Plus className="size-4 mr-2" /> Adicionar Seção ao Plano
            </Button>
          </div>
        )}
      </div>

      {/* Action Footer */}
      <div className="p-6 border-t border-slate-800 bg-slate-900/50 backdrop-blur-md">
        <Button 
          className="w-full h-12 bg-brand-500 hover:bg-brand-600 text-white font-black uppercase tracking-widest text-xs group"
          onClick={() => onStartBuild(plan)}
        >
          <Sparkles className="size-4 mr-2 group-hover:animate-pulse" /> Construir Estrutura
          <ArrowRight className="size-4 ml-2 group-hover:translate-x-1 transition-transform" />
        </Button>
        <p className="text-[10px] text-center mt-4 text-slate-500 font-medium">
          A Forge irá gerar {plan.estimatedActions} ações estruturadas. Reversível via Undo.
        </p>
      </div>
    </div>
  );
}