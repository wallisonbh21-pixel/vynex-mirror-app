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
    niche: briefing?.niche || undefined,
    description: briefing?.description || undefined,
    objectives: briefing?.objectives || undefined,
    audience: briefing?.audience || undefined,
    services: briefing?.contentAssets || undefined,
    differentiators: briefing?.differentiators || undefined,
    brandIdentity: briefing?.brandIdentity || undefined,
    visualStyle: briefing?.visualStyle || undefined,
    references: briefing?.references || undefined,
    sitePlan: sitePlan || undefined,
    plannedSections: sitePlan?.sections?.map(s => s.name) || undefined,
    primaryCTA: sitePlan?.primary_cta || undefined,
    designSystem: studioData?.design_system || undefined,
    location: undefined,
    products: undefined,
    requirements: undefined,
    notes: undefined,
    template: undefined,
    secondaryCTA: undefined,
    availableAssets: undefined,
  };
}

export function generateIntelligence(context: ScaleNexusProjectContext): ProjectIntelligence {
  const objectives = context.objectives || [];
  const primaryGoal = objectives.length > 0 ? (objectives[0] as string) : 'institutional';
  
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
