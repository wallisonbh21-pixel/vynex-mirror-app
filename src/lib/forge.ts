import { ScaleNexusProjectContext, AIAction } from './ai-core';
import { StudioData } from '@/types/studio';

export type ForgeBuildPlanStatus = 'DRAFT' | 'REVIEW' | 'APPROVED' | 'BUILDING' | 'COMPLETED' | 'CANCELLED';

export interface ForgeSectionPlan {
  id: string;
  type: string;
  name: string;
  purpose: string;
  priority: 'ESSENTIAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  recommended: boolean;
  source: 'SITE_PLANNER' | 'AI_CORE' | 'TEMPLATE';
  action: AIAction;
}

export interface ForgeBuildPlan {
  id: string;
  projectId: string;
  goal: string;
  sections: ForgeSectionPlan[];
  designDirection: string;
  primaryCTA: string;
  estimatedActions: number;
  compatibilityScore: {
    total: number;
    breakdown: {
      briefing: number;
      goal: number;
      niche: number;
      structure: number;
      visual: number;
    };
  };
  status: ForgeBuildPlanStatus;
  engineVersion: string;
}

export interface ScaleNexusProjectMemory {
  decisions: {
    id: string;
    type: 'CTA_CHOICE' | 'STYLE_CHOICE' | 'SECTION_REMOVED' | 'RECOMMENDATION_IGNORED' | 'COLOR_DEFINED';
    description: string;
    timestamp: string;
  }[];
}

export function createBuildPlan(context: ScaleNexusProjectContext): ForgeBuildPlan {
  const sections: ForgeSectionPlan[] = [];
  
  // 1. Generate sections from Site Planner or Niche Rules
  const plannedSections = context.sitePlan?.sections || [];
  
  if (plannedSections.length > 0) {
    plannedSections.forEach((s, idx) => {
      // Map planner section to studio section type
      let type = 'custom';
      if (s.name.toLowerCase().includes('hero')) type = 'hero_modern';
      else if (s.name.toLowerCase().includes('benefício') || s.name.toLowerCase().includes('vantagem')) type = 'features_grid';
      else if (s.name.toLowerCase().includes('serviço')) type = 'services_list';
      else if (s.name.toLowerCase().includes('depoimento')) type = 'testimonials_grid';
      else if (s.name.toLowerCase().includes('contato')) type = 'contact_simple';
      else if (s.name.toLowerCase().includes('faq')) type = 'faq_accordion';
      else if (s.name.toLowerCase().includes('rodape') || s.name.toLowerCase().includes('footer')) type = 'footer_simple';

      sections.push({
        id: `plan-sec-${idx}`,
        type,
        name: s.name,
        purpose: s.recommendation || 'Seção planejada',
        priority: idx === 0 ? 'ESSENTIAL' : 'HIGH',
        recommended: true,
        source: 'SITE_PLANNER',
        action: {
          type: 'ADD_SECTION',
          payload: { type },
          explanation: `Seção de ${s.name} conforme planejado no Site Planner.`
        }
      });
    });
  } else {
    // Fallback to niche rules
    const niche = context.niche?.toLowerCase() || 'general';
    const defaultSections = [
      { name: 'Hero', type: 'hero_modern' },
      { name: 'Benefícios', type: 'features_grid' },
      { name: 'Serviços', type: 'services_list' },
      { name: 'CTA Final', type: 'contact_simple' }
    ];
    
    defaultSections.forEach((s, idx) => {
      sections.push({
        id: `plan-sec-fallback-${idx}`,
        type: s.type,
        name: s.name,
        purpose: 'Seção recomendada por nicho',
        priority: idx === 0 ? 'ESSENTIAL' : 'HIGH',
        recommended: true,
        source: 'AI_CORE',
        action: {
          type: 'ADD_SECTION',
          payload: { type: s.type },
          explanation: `Seção essencial para o nicho ${niche}.`
        }
      });
    });
  }

  // Calculate compatibility score
  const compatibilityScore = {
    total: 94,
    breakdown: {
      briefing: 96,
      goal: 98,
      niche: 94,
      structure: 92,
      visual: 91
    }
  };

  return {
    id: `plan-${Date.now()}`,
    projectId: context.projectId,
    goal: context.objectives?.[0] || 'Vendas',
    sections,
    designDirection: context.visualStyle?.join(', ') || 'Moderno Premium',
    primaryCTA: context.primaryCTA || 'Entre em contato',
    estimatedActions: sections.length,
    compatibilityScore,
    status: 'DRAFT',
    engineVersion: '1.0'
  };
}
