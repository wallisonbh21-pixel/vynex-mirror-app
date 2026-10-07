import { StudioData, StudioSection, StudioElement } from '@/types/studio';
import { generateId } from './utils';
import { LibraryItem } from '@/types/studio-v2';
import { IMOBILIARIA_DEFAULT_CONTENT, IMOBILIARIA_TEMPLATE_ID } from './../templates/imobiliaria-premium/content';
import { imobiliariaToStudioData } from './../templates/imobiliaria-premium/to-studio';
import { IA_AUTOMACAO_DEFAULT_CONTENT, IA_AUTOMACAO_TEMPLATE_ID } from './../templates/ia-automacao/content';
import { iaAutomacaoToStudioData } from './../templates/ia-automacao/to-studio';
import { TECNOLOGIA_SAAS_DEFAULT_CONTENT, TECNOLOGIA_SAAS_TEMPLATE_ID } from './../templates/tecnologia-saas/content';
import { tecnologiaSaasToStudioData } from './../templates/tecnologia-saas/to-studio';

// Helper to create basic elements
const createText = (type: StudioElement['type'], text: string, styles: any = {}): StudioElement => ({
  id: generateId(),
  type,
  content: { text },
  styles: { marginBottom: '1rem', ...styles }
});

const createImage = (url: string, alt: string = '', styles: any = {}): StudioElement => ({
  id: generateId(),
  type: 'image',
  content: { url, alt },
  styles
});

const createButton = (text: string, styles: any = {}): StudioElement => ({
  id: generateId(),
  type: 'button',
  content: { text },
  styles
});

// SECTION TEMPLATES (Reusable blocks)
export const SECTION_TEMPLATES: Record<string, LibraryItem> = {
  // HEROES
  hero_modern: {
    id: 'hero_modern',
    name: 'Hero Moderno',
    category: 'hero',
    type: 'section',
    tags: ['hero', 'modern', 'clean'],
    preview: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=400&q=80',
    structure: {
      id: generateId(),
      type: 'hero',
      order: 0,
      styles: { paddingTop: '8rem', paddingBottom: '8rem', textAlign: 'center' },
      elements: [
        createText('title', 'Crie Sites que Convertem', { fontSize: '4rem', fontWeight: '800' }),
        createText('paragraph', 'A plataforma completa para levar seu negócio ao próximo nível digital.', { fontSize: '1.25rem', color: '#64748b', maxWidth: '600px', margin: '0 auto 2.5rem' }),
        createButton('Começar Agora', { padding: '1rem 2rem' })
      ]
    } as StudioSection
  },
  hero_split: {
    id: 'hero_split',
    name: 'Hero Split Screen',
    category: 'hero',
    type: 'section',
    tags: ['hero', 'split', 'image'],
    preview: 'https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&w=400&q=80',
    structure: {
      id: generateId(),
      type: 'hero',
      order: 0,
      styles: { paddingTop: '6rem', paddingBottom: '6rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4rem', alignItems: 'center' },
      elements: [
        createText('title', 'Inovação em Cada Detalhe', { fontSize: '3.5rem', textAlign: 'left' }),
        createImage('https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&w=800&q=80', 'Office')
      ]
    } as StudioSection
  },
  
  // ABOUT
  about_classic: {
    id: 'about_classic',
    name: 'Sobre Clássico',
    category: 'about',
    type: 'section',
    tags: ['about', 'text', 'history'],
    preview: 'https://images.unsplash.com/photo-152207182399e-b89e7df830c5?auto=format&fit=crop&w=400&q=80',
    structure: {
      id: generateId(),
      type: 'about',
      order: 0,
      styles: { paddingTop: '6rem', paddingBottom: '6rem' },
      elements: [
        createText('subtitle', 'QUEM SOMOS', { color: '#3b82f6' }),
        createText('title', 'Nossa Jornada de Excelência', { fontSize: '2.5rem' }),
        createText('paragraph', 'Há mais de 10 anos entregando soluções digitais que transformam mercados e conectam pessoas.')
      ]
    } as StudioSection
  },
  
  // SERVICES
  services_grid: {
    id: 'services_grid',
    name: 'Grade de Serviços',
    category: 'services',
    type: 'section',
    tags: ['services', 'grid', 'features'],
    preview: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=400&q=80',
    structure: {
      id: generateId(),
      type: 'services',
      order: 0,
      styles: { paddingTop: '6rem', paddingBottom: '6rem', backgroundColor: '#f8fafc' },
      elements: [
        createText('title', 'O Que Fazemos', { textAlign: 'center', marginBottom: '4rem' }),
        { id: generateId(), type: 'container', content: {}, styles: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '2rem' } } as StudioElement
      ]
    } as StudioSection
  },

  // FOOTER
  footer_minimal: {
    id: 'footer_minimal',
    name: 'Footer Minimalista',
    category: 'footer',
    type: 'section',
    tags: ['footer', 'minimal'],
    preview: 'https://images.unsplash.com/photo-1454165833767-0e9ed21aa503?auto=format&fit=crop&w=400&q=80',
    structure: {
      id: generateId(),
      type: 'footer',
      order: 0,
      styles: { padding: '4rem 0', backgroundColor: '#0f172a', color: '#ffffff', textAlign: 'center' },
      elements: [
        createText('paragraph', '© 2026 ScaleNexus. Todos os direitos reservados.', { color: '#94a3b8' })
      ]
    } as StudioSection
  },
  
  // NICHE SPECIFIC SECTIONS
  pizza_menu: {
    id: 'pizza_menu',
    name: 'Cardápio de Pizzas',
    category: 'menu',
    type: 'section',
    tags: ['pizza', 'menu', 'food'],
    preview: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=400&q=80',
    structure: {
      id: generateId(),
      type: 'menu',
      order: 0,
      styles: { padding: '5rem 0' },
      elements: [
        createText('title', 'Nossas Pizzas', { textAlign: 'center' }),
        { id: generateId(), type: 'container', content: {}, styles: { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '2rem', maxWidth: '1000px', margin: '0 auto' } }
      ]
    } as StudioSection
  },
  barber_services: {
    id: 'barber_services',
    name: 'Serviços da Barbearia',
    category: 'services',
    type: 'section',
    tags: ['barber', 'services', 'prices'],
    preview: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=400&q=80',
    structure: {
      id: generateId(),
      type: 'services',
      order: 0,
      styles: { padding: '5rem 0', backgroundColor: '#0f172a' },
      elements: [
        createText('title', 'Serviços & Preços', { textAlign: 'center', color: '#78350F' }),
        createText('paragraph', 'Corte de Cabelo ............ R$ 50', { textAlign: 'center' }),
        createText('paragraph', 'Barba Completa ............ R$ 40', { textAlign: 'center' })
      ]
    } as StudioSection
  },
  dentist_procedures: {
    id: 'dentist_procedures',
    name: 'Procedimentos Odontológicos',
    category: 'services',
    type: 'section',
    tags: ['dentist', 'health', 'odontologia'],
    preview: 'https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&w=400&q=80',
    structure: {
      id: generateId(),
      type: 'services',
      order: 0,
      styles: { padding: '5rem 0' },
      elements: [
        createText('title', 'Nossos Procedimentos', { textAlign: 'center' }),
        { id: generateId(), type: 'container', content: {}, styles: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '2rem' } }
      ]
    } as StudioSection
  }
};


// FULL NICHE TEMPLATES
export const NICHE_TEMPLATES: LibraryItem[] = [
  {
    id: IMOBILIARIA_TEMPLATE_ID,
    name: 'Imobiliária Premium',
    description: 'Template 01 oficial: imobiliárias, corretores e empreendimentos de alto padrão.',
    category: 'Imóveis',
    niche: 'imobiliaria',
    type: 'template',
    tags: ['imobiliaria', 'imoveis', 'premium', 'oficial'],
    preview: IMOBILIARIA_DEFAULT_CONTENT.hero.image,
    structure: imobiliariaToStudioData(IMOBILIARIA_DEFAULT_CONTENT),
    metadata: { forge_context: 'template_01_imobiliaria_premium', preview_route: '/template/imobiliaria-premium' },
  },
  {
    id: IA_AUTOMACAO_TEMPLATE_ID,
    name: 'IA & Automação Empresarial',
    description: 'Template 02 oficial: empresas de inteligência artificial, agentes de IA e automação.',
    category: 'Tecnologia',
    niche: 'ia-automacao',
    type: 'template',
    tags: ['ia', 'automacao', 'agentes', 'saas', 'oficial'],
    preview: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&w=400&q=80',
    structure: iaAutomacaoToStudioData(IA_AUTOMACAO_DEFAULT_CONTENT),
    metadata: { forge_context: 'template_02_ia_automacao', preview_route: '/template/ia-automacao' },
  },
  {
    id: TECNOLOGIA_SAAS_TEMPLATE_ID,
    name: 'Tecnologia & SaaS Premium',
    description: 'Template 03 oficial: empresas de tecnologia, SaaS, plataformas digitais e softwares B2B.',
    category: 'Tecnologia',
    niche: 'tecnologia-saas',
    type: 'template',
    tags: ['saas', 'tecnologia', 'software', 'b2b', 'oficial'],
    preview: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=400&q=80',
    structure: tecnologiaSaasToStudioData(TECNOLOGIA_SAAS_DEFAULT_CONTENT),
    metadata: { forge_context: 'template_03_tecnologia_saas', preview_route: '/template/tecnologia-saas' },
  },
  {
    id: 'tmpl_burger',
    name: 'Hamburgueria Premium',
    description: 'Template focado em conversão para delivery e cardápio visual.',
    category: 'Alimentação',
    niche: 'hamburgueria',
    type: 'template',
    tags: ['food', 'burger', 'delivery', 'dark'],
    preview: 'https://images.unsplash.com/photo-1571091718767-18b5b1457add?auto=format&fit=crop&w=400&q=80',
    structure: {
      design_system: {
        colors: {
          primary: '#FF4D00',
          secondary: '#1A1A1A',
          accent: '#FFD700',
          background: '#0D0D0D',
          surface: '#1A1A1A',
          border: '#333333',
          text: '#FFFFFF',
          textSecondary: '#A0A0A0'
        },
        typography: { headingFont: 'Bebas Neue', bodyFont: 'Inter', headingWeight: '700', bodyWeight: '400' },
        buttons: { style: 'solid', borderRadius: '0.25rem', shadow: 'md', size: 'lg' },
        cards: { borderRadius: '0.5rem', shadow: 'lg', border: false }
      },
      sections: [
        {
          id: generateId(),
          type: 'hero',
          order: 0,
          styles: { paddingTop: '10rem', paddingBottom: '10rem', backgroundColor: '#000000' },
          elements: [
            createText('title', 'O MELHOR BURGER DA CIDADE', { fontSize: '6rem', color: '#FF4D00' }),
            createText('paragraph', 'Sabor artesanal, ingredientes selecionados e entrega rápida.', { fontSize: '1.5rem' }),
            createButton('Pedir no WhatsApp', { backgroundColor: '#25D366' })
          ]
        }
      ]
    } as StudioData
  },
  {
    id: 'tmpl_gym',
    name: 'Academia Performance',
    description: 'Foco em planos, infraestrutura e resultados.',
    category: 'Saúde',
    niche: 'academia',
    type: 'template',
    tags: ['fitness', 'gym', 'health'],
    preview: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=400&q=80',
    structure: {
      design_system: {
        colors: {
          primary: '#EAB308',
          secondary: '#000000',
          accent: '#EF4444',
          background: '#FFFFFF',
          surface: '#F8FAFC',
          border: '#E2E8F0',
          text: '#0F172A',
          textSecondary: '#64748B'
        },
        typography: { headingFont: 'Archivo Black', bodyFont: 'Inter', headingWeight: '900', bodyWeight: '400' },
        buttons: { style: 'solid', borderRadius: '0rem', shadow: 'sm', size: 'lg' },
        cards: { borderRadius: '0rem', shadow: 'md', border: true }
      },
      sections: []
    } as StudioData
  },
  {
    id: 'tmpl_law',
    name: 'Advocacia Especializada',
    description: 'Design sóbrio, elegante e focado em autoridade.',
    category: 'Profissional',
    niche: 'advocacia',
    type: 'template',
    tags: ['law', 'legal', 'corporate'],
    preview: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=400&q=80',
    structure: {
      design_system: {
        colors: {
          primary: '#1E3A8A',
          secondary: '#111827',
          accent: '#B45309',
          background: '#FFFFFF',
          surface: '#F9FAFB',
          border: '#E5E7EB',
          text: '#111827',
          textSecondary: '#4B5563'
        },
        typography: { headingFont: 'Playfair Display', bodyFont: 'Libre Baskerville', headingWeight: '700', bodyWeight: '400' },
        buttons: { style: 'outline', borderRadius: '0.125rem', shadow: 'none', size: 'md' },
        cards: { borderRadius: '0.125rem', shadow: 'sm', border: true }
      },
      sections: []
    } as StudioData
  }
  // Add more niches here to reach 10
];

// Combine everything for easy access
export const LIBRARY_REGISTRY = {
  elements: [
    { type: 'title', label: 'Título', icon: 'Type', description: 'Título principal H1' },
    { type: 'subtitle', label: 'Subtítulo', icon: 'Type', description: 'Subtítulo secundário H2' },
    { type: 'paragraph', label: 'Parágrafo', icon: 'Type', description: 'Bloco de texto longo' },
    { type: 'image', label: 'Imagem', icon: 'ImageIcon', description: 'Upload ou link de imagem' },
    { type: 'button', label: 'Botão', icon: 'MousePointer2', description: 'Chamada para ação' },
    { type: 'whatsapp', label: 'WhatsApp', icon: 'Smartphone', description: 'Botão flutuante ou fixo' },
    { type: 'form', label: 'Formulário', icon: 'CheckSquare', description: 'Captura de leads' },
    { type: 'card', label: 'Card', icon: 'Box', description: 'Recipiente para conteúdo' },
    { type: 'header', label: 'Header', icon: 'Layout', description: 'Menu de navegação' },
    { type: 'footer', label: 'Footer', icon: 'Layout', description: 'Rodapé do site' },
    { type: 'testimonial', label: 'Depoimento', icon: 'Star', description: 'Prova social' },
    { type: 'faq', label: 'FAQ', icon: 'Plus', description: 'Perguntas frequentes' },
    { type: 'contact', label: 'Contato', icon: 'Smartphone', description: 'Informações de contato' }
  ],
  sections: Object.values(SECTION_TEMPLATES),
  templates: NICHE_TEMPLATES
};
