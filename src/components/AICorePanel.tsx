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
  Info,
  Smartphone,
  CheckSquare,
  Star,
  Plus
} from 'lucide-react';
import { ProjectIntelligence } from '@/lib/ai-core';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { StudioData, StudioSection } from '@/types/studio';

interface AICorePanelProps {
  intelligence: ProjectIntelligence;
  onAccept?: (rec: string) => void;
  onIgnore?: (rec: string) => void;
  studioData?: StudioData | null;
}

export function AICorePanel({ intelligence, onAccept, onIgnore, studioData }: AICorePanelProps) {
  const score = intelligence.score;

  return (
    <div className="space-y-6 text-slate-200">
      {/* Header with Score */}
      <div className="p-6 rounded-2xl bg-gradient-brand text-white shadow-glow">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-white/20">
              <Brain className="size-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold">Inteligência ScaleNexus</h3>
              <p className="text-xs text-white/70">Análise Real-Time (v{intelligence.engineVersion})</p>
            </div>
          </div>
          <div className="text-right">
            <span className="text-3xl font-black">{score.total}/100</span>
            <p className="text-[10px] uppercase tracking-widest font-bold text-white/50">Qualidade</p>
          </div>
        </div>
        <Progress value={score.total} className="h-2 bg-white/20" />
      </div>

      {/* Breakdowns */}
      <div className="grid grid-cols-5 gap-1 px-1">
        <div className="text-center">
          <div className="text-xs mb-1 opacity-50">🎯</div>
          <div className="text-sm font-black text-white">{score.breakdown.conversion}</div>
        </div>
        <div className="text-center">
          <div className="text-xs mb-1 opacity-50">🎨</div>
          <div className="text-sm font-black text-white">{score.breakdown.visual}</div>
        </div>
        <div className="text-center">
          <div className="text-xs mb-1 opacity-50">📱</div>
          <div className="text-sm font-black text-white">{score.breakdown.responsiveness}</div>
        </div>
        <div className="text-center">
          <div className="text-xs mb-1 opacity-50">📝</div>
          <div className="text-sm font-black text-white">{score.breakdown.content}</div>
        </div>
        <div className="text-center">
          <div className="text-xs mb-1 opacity-50">🧭</div>
          <div className="text-sm font-black text-white">{score.breakdown.structure}</div>
        </div>
      </div>

      {/* Primary Insights */}
      <div className="grid grid-cols-2 gap-4">
        <div className="p-4 rounded-xl border border-slate-800 bg-slate-950 shadow-sm">
          <div className="flex items-center gap-2 mb-2 text-primary">
            <Target className="size-4" />
            <span className="text-[10px] font-bold uppercase tracking-wider">Objetivo</span>
          </div>
          <p className="text-sm font-bold capitalize">{intelligence.primaryGoal.replace('_', ' ')}</p>
        </div>
        <div className="p-4 rounded-xl border border-slate-800 bg-slate-950 shadow-sm">
          <div className="flex items-center gap-2 mb-2 text-primary">
            <MessageSquare className="size-4" />
            <span className="text-[10px] font-bold uppercase tracking-wider">CTA Sugerido</span>
          </div>
          <p className="text-sm font-bold">{intelligence.recommendedCTA}</p>
        </div>
      </div>

      {/* Strengths */}
      {intelligence.strengths.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-500 flex items-center gap-2 px-1">
            <Check className="size-3 text-green-500" /> Pontos Fortes
          </h4>
          <div className="space-y-2">
            {intelligence.strengths.map((s, idx) => (
              <div key={idx} className="flex items-center gap-2 text-xs font-medium text-slate-300 px-1">
                <Check className="size-3 text-green-500 shrink-0" /> {s}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Issues / Warnings */}
      <div className="space-y-3">
        <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-500 flex items-center gap-2 px-1">
          <AlertTriangle className="size-3 text-orange-500" /> Atenção & Recomendações
        </h4>
        <div className="space-y-3">
          {intelligence.issues.map((issue, idx) => (
            <div 
              key={idx} 
              className={cn(
                "p-4 rounded-xl border flex flex-col gap-1 group relative overflow-hidden",
                issue.severity === 'critical' ? "bg-red-500/5 border-red-500/20" :
                issue.severity === 'important' ? "bg-orange-500/5 border-orange-500/20" :
                "bg-slate-800/50 border-slate-800"
              )}
            >
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  {issue.severity === 'critical' ? <AlertTriangle className="size-3 text-red-500" /> : 
                   issue.severity === 'important' ? <AlertTriangle className="size-3 text-orange-500" /> : 
                   <Info className="size-3 text-brand-400" />}
                  <span className={cn(
                    "text-[10px] font-bold uppercase tracking-tighter",
                    issue.severity === 'critical' ? "text-red-500" :
                    issue.severity === 'important' ? "text-orange-500" :
                    "text-brand-400"
                  )}>
                    {issue.severity.toUpperCase()}
                  </span>
                </div>
              </div>
              <p className="text-xs font-bold text-slate-100">{issue.label}</p>
              <p className="text-[11px] text-slate-400 leading-relaxed">{issue.description}</p>
              
              <div className="flex gap-2 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button size="sm" variant="ghost" className="h-6 text-[10px] px-2 text-white hover:bg-white/10" onClick={() => onAccept?.(issue.label)}>
                  Entendi
                </Button>
                <Button size="sm" variant="ghost" className="h-6 text-[10px] px-2 text-white/50 hover:bg-white/5" onClick={() => onIgnore?.(issue.label)}>
                  Ignorar
                </Button>
              </div>
            </div>
          ))}
          {intelligence.issues.length === 0 && (
            <div className="text-center py-6 text-slate-500 italic text-xs">
              Nenhum problema detectado. Excelente trabalho!
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
