import { supabase } from "@/integrations/supabase/client";
import { BriefingData } from "./briefing";

export type SitePlanSection = {
  id: string;
  number: string;
  icon: string;
  name: string;
  objective: string;
  recommendation: string;
  essential?: boolean;
  recommended?: boolean;
};

export type SitePlanData = {
  id: string;
  project_id: string;
  sections: SitePlanSection[];
  strategy: {
    objective: string;
    audience: string;
    primary_cta: string;
    visual_style: string;
    section_count: number;
  };
  primary_cta: string;
  visual_direction: string;
  completion: number;
  status: 'rascunho' | 'revisado' | 'aprovado';
  created_at: string;
  updated_at: string;
};

export async function saveSitePlan(projectId: string, data: Partial<SitePlanData>) {
  const { error } = await supabase
    .from('project_site_plans')
    .upsert({
      project_id: projectId,
      ...data,
      updated_at: new Date().toISOString()
    });
  if (error) throw error;
}

export async function getSitePlan(projectId: string) {
  const { data, error } = await supabase
    .from('project_site_plans')
    .select('*')
    .eq('project_id', projectId)
    .single();
  
  if (error && error.code !== 'PGRST116') throw error;
  return data as SitePlanData | null;
}

// Rules Engine for Planning
export const NICHE_CONFIGS: Record<string, string[]> = {
  'hamburgueria': ['Hero', 'Produtos em destaque', 'Cardápio', 'Diferenciais', 'Avaliações', 'Galeria', 'WhatsApp', 'Localização', 'Contato'],
  'pizzaria': ['Hero', 'Pizzas em destaque', 'Cardápio', 'Promoções', 'Diferenciais', 'Avaliações', 'Delivery', 'Localização', 'Contato'],
  'academia': ['Hero', 'Benefícios', 'Modalidades', 'Planos', 'Estrutura', 'Professores', 'Depoimentos', 'CTA', 'Localização', 'Contato'],
  'barbearia': ['Hero', 'Serviços', 'Profissionais', 'Galeria', 'Preços', 'Avaliações', 'Agendamento', 'Localização', 'Contato'],
  'dentista': ['Hero', 'Especialidades', 'Procedimentos', 'Equipe', 'Diferenciais', 'Depoimentos', 'FAQ', 'Agendamento', 'Localização', 'Contato'],
  'advocacia': ['Hero', 'Áreas de atuação', 'Sobre o escritório', 'Equipe', 'Diferenciais', 'FAQ', 'Depoimentos', 'CTA', 'Contato'],
  'imobiliaria': ['Hero', 'Imóveis em destaque', 'Busca/portfólio', 'Tipos de imóveis', 'Diferenciais', 'Equipe', 'Depoimentos', 'CTA', 'Contato'],
  'contabilidade': ['Hero', 'Serviços', 'Benefícios', 'Segmentos atendidos', 'Diferenciais', 'Depoimentos', 'FAQ', 'CTA', 'Contato'],
  'fotografia': ['Hero', 'Portfólio', 'Serviços', 'Especialidades', 'Galeria', 'Sobre', 'Depoimentos', 'CTA', 'Contato'],
  'eventos': ['Hero', 'Serviços', 'Tipos de eventos', 'Portfólio', 'Galeria', 'Diferenciais', 'Depoimentos', 'Orçamento', 'Contato'],
  'oficina': ['Hero', 'Serviços', 'Especialidades', 'Diferenciais', 'Avaliações', 'Galeria', 'Localização', 'WhatsApp', 'Contato'],
  'salao': ['Hero', 'Serviços', 'Profissionais', 'Galeria', 'Preços', 'Avaliações', 'Agendamento', 'Localização', 'Contato'],
  'loja': ['Hero', 'Produtos', 'Categorias', 'Destaques', 'Promoções', 'Benefícios', 'Avaliações', 'CTA', 'Contato'],
};

export const OBJECTIVE_PRIORITIES: Record<string, string[]> = {
  'whatsapp': ['CTA', 'WhatsApp', 'Produtos', 'Serviços', 'Diferenciais', 'Depoimentos'],
  'agendamento': ['Serviços', 'Profissionais', 'Benefícios', 'Depoimentos', 'Agendamento'],
  'vendas': ['Produtos', 'Categorias', 'Destaques', 'Benefícios', 'Depoimentos', 'CTA'],
  'leads': ['Benefícios', 'Diferenciais', 'Depoimentos', 'Formulário', 'CTA'],
  'institucional': ['Hero', 'Sobre', 'Serviços', 'Equipe', 'Diferenciais', 'Contato'],
};

export function generateRecommendedPlan(briefing: BriefingData): Partial<SitePlanData> {
  const niche = briefing.niche?.toLowerCase() || 'outros';
  const objectives = briefing.objectives || [];
  
  const nicheSections = NICHE_CONFIGS[niche] || ['Hero', 'Sobre', 'Serviços', 'Diferenciais', 'Depoimentos', 'Contato'];
  
  // Logic to merge niche and objective priorities
  let combinedSections = [...nicheSections];
  objectives.forEach(obj => {
    const priorities = OBJECTIVE_PRIORITIES[obj] || [];
    priorities.forEach(p => {
      if (!combinedSections.some(s => s.toLowerCase().includes(p.toLowerCase()))) {
        // Insert priority sections before contact but after hero
        combinedSections.splice(combinedSections.length - 1, 0, p);
      }
    });
  });

  const sections: SitePlanSection[] = combinedSections.map((name, index) => ({
    id: crypto.randomUUID(),
    number: (index + 1).toString().padStart(2, '0'),
    icon: getIconForSection(name),
    name,
    objective: getObjectiveForSection(name, objectives),
    recommendation: getRecommendationForSection(name, briefing),
    essential: ['hero', 'cta', 'contato'].some(e => name.toLowerCase().includes(e)),
    recommended: ['depoimentos', 'galeria', 'diferenciais'].some(r => name.toLowerCase().includes(r)),
  }));

  return {
    sections,
    strategy: {
      objective: objectives.length > 0 ? (objectives[0] as string) : 'Presença institucional',
      audience: briefing.audience?.target || 'Público geral',
      primary_cta: objectives.includes('whatsapp') ? 'Pedir no WhatsApp' : 'Saiba Mais',
      visual_style: briefing.visualStyle?.join(', ') || 'Moderno e Clean',
      section_count: sections.length
    },
    primary_cta: objectives.includes('whatsapp') ? 'Pedir no WhatsApp' : 'Entrar em Contato',
    visual_direction: briefing.visualStyle?.join(', ') || 'Minimalista',
    completion: 0,
    status: 'rascunho'
  };
}

function getIconForSection(name: string): string {
  const n = name.toLowerCase();
  if (n.includes('hero')) return '🏠';
  if (n.includes('produto') || n.includes('pizzas') || n.includes('burger')) return '🍔';
  if (n.includes('serviço') || n.includes('modalidade')) return '🛠️';
  if (n.includes('sobre') || n.includes('equipe') || n.includes('professores') || n.includes('profissionais')) return '👥';
  if (n.includes('diferencial') || n.includes('benefício')) return '⭐';
  if (n.includes('depoimento') || n.includes('avaliação')) return '💬';
  if (n.includes('galeria') || n.includes('foto')) return '📸';
  if (n.includes('contato')) return '📞';
  if (n.includes('whatsapp')) return '📱';
  if (n.includes('localização')) return '📍';
  if (n.includes('agendamento')) return '📅';
  if (n.includes('faq')) return '❓';
  if (n.includes('cta')) return '🎯';
  return '📦';
}

function getObjectiveForSection(name: string, objectives: string[]): string {
  const n = name.toLowerCase();
  if (n.includes('hero')) return 'Apresentar a empresa e direcionar para a ação principal.';
  if (n.includes('produto')) return 'Mostrar os principais itens oferecidos.';
  if (n.includes('serviço')) return 'Detalhar o que a empresa faz.';
  if (n.includes('diferencial')) return 'Explicar por que escolher esta empresa.';
  if (n.includes('depoimento')) return 'Aumentar a confiança através de prova social.';
  if (n.includes('galeria')) return 'Mostrar visualmente o ambiente ou resultados.';
  if (n.includes('contato')) return 'Encerrar a jornada com canais de atendimento.';
  if (n.includes('whatsapp')) return 'Facilitar o pedido ou dúvida rápida.';
  return 'Complementar a experiência do usuário.';
}

function getRecommendationForSection(name: string, briefing: BriefingData): string {
  const n = name.toLowerCase();
  if (n.includes('hero')) return 'Usar título forte + imagem de impacto + CTA claro.';
  if (n.includes('depoimento')) return 'Use fotos reais e nomes de clientes para maior credibilidade.';
  if (n.includes('diferencial')) return `Destaque os diferenciais citados: ${briefing.differentiators?.join(', ') || 'Exclusividade e Qualidade'}.`;
  return 'Manter design alinhado à identidade visual proposta.';
}
