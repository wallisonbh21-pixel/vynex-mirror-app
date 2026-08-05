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
  // Studio Intelligence Engine Logic (V1.1 Concept)
  const getQualityScore = () => {
    // Mock logic based on engine_version 1.1 requirements
    return {
      total: 82,
      breakdown: {
        conversao: 88,
        visual: 91,
        responsividade: 76,
        conteudo: 82,
        estrutura: 90
      }
    };
  };

  const score = getQualityScore();

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
              <p className="text-xs text-white/70">Análise Real-Time (v1.1)</p>
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
      <div className="grid grid-cols-5 gap-1">
        {Object.entries(score.breakdown).map(([key, val]) => (
          <div key={key} className="text-center">
            <div className="text-xs font-bold mb-1 opacity-50 capitalize">
              {key === 'conversao' ? '🎯' : key === 'visual' ? '🎨' : key === 'responsividade' ? '📱' : key === 'conteudo' ? '📝' : '🧭'}
            </div>
            <div className="text-sm font-black text-white">{val}</div>
          </div>
        ))}
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

      {/* Warnings & Opportunities */}
      <div className="space-y-4">
        <div className="p-4 rounded-xl bg-red-500/5 border border-red-500/10 space-y-3">
          <h4 className="text-xs font-bold text-red-400 flex items-center gap-2">
            <AlertTriangle className="size-3" /> ATENÇÃO (3 pontos)
          </h4>
          <ul className="space-y-2 text-xs text-red-200/60">
            <li>1. CTA pouco específico</li>
            <li>2. Seção de depoimentos ausente</li>
            <li>3. Mobile precisa de revisão</li>
          </ul>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 text-white space-y-4">
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
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
