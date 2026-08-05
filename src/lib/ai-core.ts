import { BriefingData } from './briefing';
import { SitePlanData, SitePlanSection } from './planner';
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
  designGuidance?: any;
}

export interface StudioPageSnapshot {
  sectionsCount: number;
  sectionsOrder: string[];
  elementsCount: number;
  hasHero: boolean;
  hasCTA: boolean;
  hasTestimonials: boolean;
  hasContact: boolean;
  hasPricing: boolean;
  contentQuality: {
    hasLoremIpsum: boolean;
    hasEmptyHeadlines: boolean;
    hasMissingImages: boolean;
  };
  responsiveWarnings: string[];
}

export interface AIAction {
  type: 'ADD_SECTION' | 'REMOVE_SECTION' | 'MOVE_SECTION' | 'ADD_ELEMENT' | 'REMOVE_ELEMENT' | 'UPDATE_ELEMENT' | 'UPDATE_TEXT' | 'UPDATE_CTA' | 'UPDATE_STYLE' | 'APPLY_STYLE_PRESET' | 'UPDATE_RESPONSIVE_CONFIG';
  targetId?: string | undefined; // sectionId or elementId
  payload: any;
  explanation: string;
  previewLabel?: string;
  reversible?: boolean;
}

export interface StudioAnalysis {
  score: {
    total: number;
    breakdown: {
      conversion: number;
      visual: number;
      responsiveness: number;
      content: number;
      structure: number;
    };
  };
  strengths: string[];
  issues: {
    id: string;
    severity: 'critical' | 'important' | 'recommended' | 'positive';
    label: string;
    description: string;
    action?: AIAction;
    status?: 'PENDENTE' | 'APLICADA' | 'IGNORADA' | 'DESFEITA' | 'EXPIRADA' | 'ERRO';
  }[];
  opportunities: string[];
  engineVersion: string;
}

export interface ProjectIntelligence extends StudioAnalysis {
  primaryGoal: string;
  recommendedCTA: string;
  recommendedSections: { name: string; priority: 'ESSENCIAL' | 'ALTA' | 'MÉDIA' | 'BAIXA' }[];
  sectionPriorities: { name: string; priority: string }[];
  toneOfVoice: string;
  visualDirection: string;
  contentPriorities: string[];
}

export function buildStudioSnapshot(studioData: StudioData | null): StudioPageSnapshot {
  if (!studioData) {
    return {
      sectionsCount: 0,
      sectionsOrder: [],
      elementsCount: 0,
      hasHero: false,
      hasCTA: false,
      hasTestimonials: false,
      hasContact: false,
      hasPricing: false,
      contentQuality: { hasLoremIpsum: false, hasEmptyHeadlines: false, hasMissingImages: false },
      responsiveWarnings: []
    };
  }

  const sections = studioData.sections || [];
  const elements = sections.flatMap(s => s.elements);
  
  const contentStr = JSON.stringify(studioData).toLowerCase();

  return {
    sectionsCount: sections.length,
    sectionsOrder: sections.map(s => s.type),
    elementsCount: elements.length,
    hasHero: sections.some(s => s.type === 'hero'),
    hasCTA: elements.some(e => e.type === 'button' || e.type === 'whatsapp'),
    hasTestimonials: sections.some(s => s.type === 'testimonial' || s.type === 'testimonials'),
    hasContact: sections.some(s => s.type === 'contact' || s.type === 'form'),
    hasPricing: sections.some(s => s.type === 'pricing' || s.type === 'plans'),
    contentQuality: {
      hasLoremIpsum: contentStr.includes('lorem ipsum'),
      hasEmptyHeadlines: elements.some(e => (e.type === 'title' || e.type === 'subtitle') && (!e.content.text || e.content.text.trim() === '')),
      hasMissingImages: elements.some(e => e.type === 'image' && !e.content.url)
    },
    responsiveWarnings: []
  };
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
    plannedSections: sitePlan?.sections?.map(s => (s as any).name) || undefined,
    primaryCTA: sitePlan?.primary_cta || undefined,
    designSystem: studioData?.design_system || undefined,
    location: undefined,
    products: undefined,
    requirements: undefined,
    notes: undefined,
    template: undefined,
    secondaryCTA: undefined,
    availableAssets: undefined,
    designGuidance: undefined
  };
}

export function generateIntelligence(
  context: ScaleNexusProjectContext, 
  studioData: StudioData | null
): ProjectIntelligence {
  const snapshot = buildStudioSnapshot(studioData);
  const objectives = context.objectives || [];
  const primaryGoal = objectives.length > 0 ? (objectives[0] as string) : 'institutional';
  const niche = context.niche || 'general';
  
  const recommendedCTA = objectives.includes('whatsapp') ? 'Fale no WhatsApp' : 
                         objectives.includes('agendamento') ? 'Agendar agora' : 'Saiba mais';

  const issues: ProjectIntelligence['issues'] = [];
  const strengths: string[] = [];
  const opportunities: string[] = [];

  // 1. Structural Analysis
  if (snapshot.sectionsCount === 0) {
    issues.push({ 
      id: 'empty_canvas',
      severity: 'critical', 
      label: 'Canvas Vazio', 
      description: 'Comece adicionando uma seção Hero para definir a proposta de valor.',
      action: {
        type: 'ADD_SECTION',
        payload: { type: 'hero_modern' },
        explanation: 'O Hero é essencial para qualquer página de nicho comercial.',
        previewLabel: 'Adicionar Hero Moderno',
        reversible: true
      }
    });
  } else {
    if (snapshot.hasHero) strengths.push('Hero definido');
    else issues.push({ 
      id: 'missing_hero',
      severity: 'critical', 
      label: 'Hero ausente', 
      description: 'O site precisa de uma headline clara no topo para prender a atenção.',
      action: {
        type: 'ADD_SECTION',
        payload: { type: 'hero_modern' },
        explanation: 'Adicionar uma seção de impacto no topo da página.',
        previewLabel: 'Adicionar Seção Hero',
        reversible: true
      }
    });
  }

  // 2. Conversion Analysis
  if (!snapshot.hasCTA) {
    issues.push({ 
      id: 'missing_cta',
      severity: 'critical', 
      label: 'Sem CTA principal', 
      description: 'O usuário não tem um caminho claro de conversão. Adicione um botão de ação.',
      action: {
        type: 'ADD_ELEMENT',
        targetId: studioData?.sections[0]?.id,
        payload: { 
          type: 'button',
          content: { text: recommendedCTA },
          styles: { backgroundColor: context.designSystem?.colors?.primary || '#3B82F6', color: '#ffffff' }
        },
        explanation: `Baseado no objetivo "${primaryGoal}", o CTA ideal é "${recommendedCTA}".`,
        previewLabel: `Adicionar Botão: ${recommendedCTA}`,
        reversible: true
      }
    });
  } else {
    strengths.push('CTA principal definido');
  }

  // 3. Niche Analysis
  if (niche === 'hamburgueria' && !snapshot.hasCTA && objectives.includes('whatsapp')) {
    issues.push({
      id: 'hamburgueria_whatsapp',
      severity: 'important',
      label: 'CTA pouco específico',
      description: 'Para hamburguerias, o botão de WhatsApp converte melhor que botões genéricos.',
      action: {
        type: 'UPDATE_CTA',
        payload: { text: 'Pedir no WhatsApp', type: 'whatsapp' },
        explanation: 'WhatsApp é o canal de maior conversão para delivery.',
        previewLabel: 'Trocar para Botão WhatsApp',
        reversible: true
      }
    });
  }

  if (['dentista', 'advocacia', 'academia'].includes(niche) && !snapshot.hasTestimonials) {
    issues.push({
      id: 'niche_social_proof',
      severity: 'recommended',
      label: 'Prova social ausente',
      description: 'Neste nicho, depoimentos aumentam drasticamente a confiança e conversão.',
      action: {
        type: 'ADD_SECTION',
        payload: { type: 'testimonials_grid' },
        explanation: 'Depoimentos de clientes reais geram autoridade.',
        previewLabel: 'Adicionar Depoimentos',
        reversible: true
      }
    });
  }

  // 4. Content Analysis
  if (snapshot.contentQuality.hasLoremIpsum) {
    issues.push({
      id: 'lorem_ipsum_detected',
      severity: 'important',
      label: 'Conteúdo Incompleto',
      description: '"Lorem Ipsum" detectado. Substitua por textos reais antes de publicar.',
      action: {
        type: 'UPDATE_TEXT',
        payload: { suggestion: `Melhore seu negócio ${context.businessName} com ScaleNexus.` },
        explanation: 'Textos reais ajudam no SEO e na conversão.',
        previewLabel: 'Aplicar Sugestão de Texto',
        reversible: true
      }
    });
  }

  // 5. Score Calculation
  let scoreTotal = 50;
  if (snapshot.hasHero) scoreTotal += 15;
  if (snapshot.hasCTA) scoreTotal += 15;
  if (!snapshot.contentQuality.hasLoremIpsum && snapshot.sectionsCount > 0) scoreTotal += 10;
  if (snapshot.hasTestimonials) scoreTotal += 5;
  if (snapshot.hasContact) scoreTotal += 5;
  
  const score = {
    total: Math.min(scoreTotal, 100),
    breakdown: {
      conversion: snapshot.hasCTA ? 90 : 20,
      visual: snapshot.sectionsCount > 0 ? 85 : 0,
      responsiveness: 80,
      content: snapshot.contentQuality.hasLoremIpsum ? 40 : 90,
      structure: snapshot.hasHero && snapshot.hasContact ? 90 : 50
    }
  };

  return {
    score,
    strengths,
    issues,
    opportunities: issues.filter(i => i.severity === 'recommended').map(i => i.description),
    engineVersion: '1.2',
    primaryGoal,
    recommendedCTA,
    recommendedSections: [
      { name: 'Hero', priority: 'ESSENCIAL' },
      { name: 'Serviços', priority: 'ALTA' },
      { name: 'Depoimentos', priority: 'MÉDIA' },
    ],
    sectionPriorities: [],
    toneOfVoice: context.niche === 'hamburgueria' ? 'direto, jovem, apetitoso' : 'profissional e claro',
    visualDirection: context.visualStyle?.join(', ') || 'modern',
    contentPriorities: context.services || [],
  };
}
