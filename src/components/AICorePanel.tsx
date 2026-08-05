import React from 'react';
import { 
  Brain, 
  Target, 
  MessageSquare, 
  Palette, 
  Type, 
  Layout, 
  AlertTriangle, 
  Lightbulb,
  Check,
  ChevronRight,
  Info
} from 'lucide-react';
import { ProjectIntelligence } from '@/lib/ai-core';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

interface AICorePanelProps {
  intelligence: ProjectIntelligence;
  onAccept?: (rec: string) => void;
  onIgnore?: (rec: string) => void;
}

export function AICorePanel({ intelligence, onAccept, onIgnore }: AICorePanelProps) {
  return (
    <div className="space-y-6">
      {/* Header with Score */}
      <div className="p-6 rounded-2xl bg-gradient-brand text-white shadow-glow">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-white/20">
              <Brain className="size-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold">Inteligência ScaleNexus</h3>
              <p className="text-xs text-white/70">Análise baseada nos dados do projeto (v{intelligence.engineVersion})</p>
            </div>
          </div>
          <div className="text-right">
            <span className="text-3xl font-black">{intelligence.intelligenceScore}%</span>
            <p className="text-[10px] uppercase tracking-widest font-bold text-white/50">Preparação</p>
          </div>
        </div>
        <Progress value={intelligence.intelligenceScore} className="h-2 bg-white/20" />
      </div>

      {/* Primary Insights */}
      <div className="grid grid-cols-2 gap-4">
        <div className="p-4 rounded-xl border bg-card shadow-sm">
          <div className="flex items-center gap-2 mb-2 text-primary">
            <Target className="size-4" />
            <span className="text-xs font-bold uppercase tracking-wider">Objetivo</span>
          </div>
          <p className="text-sm font-bold capitalize">{intelligence.primaryGoal.replace('_', ' ')}</p>
        </div>
        <div className="p-4 rounded-xl border bg-card shadow-sm">
          <div className="flex items-center gap-2 mb-2 text-primary">
            <MessageSquare className="size-4" />
            <span className="text-xs font-bold uppercase tracking-wider">CTA Recomendado</span>
          </div>
          <p className="text-sm font-bold">{intelligence.recommendedCTA}</p>
        </div>
      </div>

      {/* Design Guidance */}
      <div className="p-6 rounded-2xl border bg-card shadow-sm space-y-4">
        <h4 className="text-sm font-bold flex items-center gap-2">
          <Palette className="size-4 text-primary" /> Direção Visual & Tom
        </h4>
        
        <div className="grid gap-4">
          <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
            <Type className="size-4 text-muted-foreground mt-1" />
            <div>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1">Tom de Voz</p>
              <p className="text-sm">{intelligence.toneOfVoice}</p>
            </div>
          </div>
          
          <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
            <Layout className="size-4 text-muted-foreground mt-1" />
            <div>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1">Direção Visual</p>
              <p className="text-sm">{intelligence.visualDirection}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Structure & Priorities */}
      <div className="space-y-3">
        <h4 className="text-sm font-bold px-1">Estrutura & Prioridades</h4>
        <div className="space-y-2">
          {intelligence.recommendedSections.map((section, idx) => (
            <div key={idx} className="flex items-center justify-between p-3 rounded-xl border bg-card group">
              <div className="flex items-center gap-3">
                <span className="text-xs font-mono text-muted-foreground">{(idx + 1).toString().padStart(2, '0')}</span>
                <span className="text-sm font-medium">{section.name}</span>
              </div>
              <span className={cn(
                "text-[10px] font-bold px-2 py-0.5 rounded-full uppercase",
                section.priority === 'ESSENCIAL' ? "bg-red-500/10 text-red-500" :
                section.priority === 'ALTA' ? "bg-orange-500/10 text-orange-500" :
                "bg-blue-500/10 text-blue-500"
              )}>
                {section.priority}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Warnings */}
      {intelligence.warnings.length > 0 && (
        <div className="p-4 rounded-xl bg-red-500/5 border border-red-500/20 space-y-3">
          <h4 className="text-xs font-bold text-red-500 flex items-center gap-2">
            <AlertTriangle className="size-3" /> Pontos de Atenção
          </h4>
          <ul className="space-y-2">
            {intelligence.warnings.map((w, idx) => (
              <li key={idx} className="text-xs text-red-600/80 flex items-start gap-2">
                <div className="size-1 rounded-full bg-red-500 mt-1.5" />
                {w}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Opportunities */}
      <div className="p-5 rounded-2xl bg-slate-900 text-white space-y-4">
        <h4 className="text-sm font-bold flex items-center gap-2">
          <Lightbulb className="size-4 text-yellow-400" /> Oportunidades
        </h4>
        <div className="space-y-3">
          {intelligence.opportunities.map((opt, idx) => (
            <div key={idx} className="p-3 rounded-xl bg-white/5 border border-white/10 text-xs leading-relaxed group">
              <div className="flex items-start gap-3">
                <Info className="size-3 text-brand-400 mt-0.5 shrink-0" />
                <p>{opt}</p>
              </div>
              <div className="flex gap-2 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button size="sm" variant="ghost" className="h-6 text-[10px] px-2 text-white hover:bg-white/10" onClick={() => onAccept?.(opt)}>
                  <Check className="size-3 mr-1" /> Aceitar
                </Button>
                <Button size="sm" variant="ghost" className="h-6 text-[10px] px-2 text-white/50 hover:bg-white/5" onClick={() => onIgnore?.(opt)}>
                  Ignorar
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
