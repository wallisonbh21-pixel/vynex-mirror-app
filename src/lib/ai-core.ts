import { BriefingData } from './briefing';
import { SitePlanData } from './planner';
import { StudioData } from '@/types/studio';

export interface ScaleNexusProjectContext {
  projectId: string;
  businessName: string;
  niche: string | undefined;
  description: string | undefined;
  objectives: string[] | undefined;
  audience: any | undefined;
  location: string | undefined;
  services: string[] | undefined;
  products: string[] | undefined;
  differentiators: string[] | undefined;
  brandIdentity: any | undefined;
  visualStyle: string[] | undefined;
  references: any | undefined;
  requirements: any | undefined;
  notes: string | undefined;
  template: string | undefined;
  sitePlan: SitePlanData | undefined;
  plannedSections: string[] | undefined;
  primaryCTA: string | undefined;
  secondaryCTA: string | undefined;
  availableAssets: any[] | undefined;
  designSystem: any | undefined;
}

export interface ProjectIntelligence {
  primaryGoal: string;
  recommendedCTA: string;
  recommendedSections: { name: string; priority: 'ESSENCIAL' | 'ALTA' | 'MÉDIA' | 'BAIXA' }[];
  sectionPriorities: { name: string; priority: string }[];
  toneOfVoice: string;
  visualDirection: string;
  contentPriorities: string[];
  conversionRecommendations: string[];
  warnings: string[];
  opportunities: string[];
  intelligenceScore: number;
  engineVersion: string;
}

export function buildProjectContext(
  projectId: string,
  briefing: BriefingData | null,
  sitePlan: SitePlanData | null,
  studioData: StudioData | null
): ScaleNexusProjectContext {
  return {
    projectId,
    businessName: briefing?.businessName || 'Projeto sem nome',
    niche: briefing?.niche,
    description: briefing?.description,
    objectives: briefing?.objectives,
    audience: briefing?.audience,
    services: briefing?.contentAssets,
    differentiators: briefing?.differentiators,
    brandIdentity: briefing?.brandIdentity,
    visualStyle: briefing?.visualStyle,
    references: briefing?.references,
    sitePlan: sitePlan || undefined,
    plannedSections: sitePlan?.sections?.map(s => s.name),
    primaryCTA: sitePlan?.primary_cta,
    designSystem: studioData?.design_system,
  };
}

export function generateIntelligence(context: ScaleNexusProjectContext): ProjectIntelligence {
  const objectives = context.objectives || [];
  const primaryGoal = objectives.length > 0 ? objectives[0] : 'institutional';
  
  const recommendedCTA = objectives.includes('whatsapp') ? 'Pedir agora' : 
                         objectives.includes('agendamento') ? 'Agendar agora' : 'Saiba mais';

  const warnings: string[] = [];
  if (!context.visualStyle || context.visualStyle.length === 0) warnings.push('⚠️ A identidade visual ainda não foi definida.');
  if (!context.sitePlan) warnings.push('⚠️ O Site Planner ainda não foi definido.');

  return {
    primaryGoal,
    recommendedCTA,
    recommendedSections: [
      { name: 'Hero', priority: 'ESSENCIAL' },
      { name: 'CTA', priority: 'ESSENCIAL' },
      { name: 'Depoimentos', priority: 'ALTA' },
    ],
    sectionPriorities: [
      { name: 'Hero', priority: 'ESSENCIAL' },
      { name: 'CTA', priority: 'ESSENCIAL' },
    ],
    toneOfVoice: context.niche === 'hamburgueria' ? 'direto, jovem, apetitoso' : 'profissional e claro',
    visualDirection: context.visualStyle?.join(', ') || 'modern',
    contentPriorities: context.services || [],
    conversionRecommendations: ['Posicione o CTA principal no Hero para aumentar conversão.'],
    warnings,
    opportunities: ['Considere destacar avaliações de clientes para aumentar a confiança.'],
    intelligenceScore: 86,
    engineVersion: '1.0'
  };
}
