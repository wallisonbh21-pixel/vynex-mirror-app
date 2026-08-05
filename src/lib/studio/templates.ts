import { StudioSection } from '@/types/studio';
import { generateId } from './utils';

export const SECTION_TEMPLATES: Record<string, Partial<StudioSection>> = {
  hero: {
    type: 'hero',
    styles: {
      paddingTop: '8rem',
      paddingBottom: '8rem',
      layout: 'centered',
      backgroundColor: '#f8fafc'
    },
    elements: [
      {
        id: generateId(),
        type: 'title',
        content: { text: 'Transforme seu negócio digital' },
        styles: { fontSize: '4rem', textAlign: 'center', marginBottom: '1.5rem' }
      },
      {
        id: generateId(),
        type: 'paragraph',
        content: { text: 'Crie sites profissionais em minutos com o VYNEXA Studio. A solução completa para criadores exigentes.' },
        styles: { fontSize: '1.25rem', textAlign: 'center', marginBottom: '2.5rem', color: '#64748b' }
      },
      {
        id: generateId(),
        type: 'button',
        content: { text: 'Começar Agora' },
        styles: { textAlign: 'center' }
      }
    ]
  },
  about: {
    type: 'about',
    styles: {
      paddingTop: '6rem',
      paddingBottom: '6rem',
    },
    elements: [
      {
        id: generateId(),
        type: 'subtitle',
        content: { text: 'NOSSA HISTÓRIA' },
        styles: { color: '#3b82f6', marginBottom: '1rem' }
      },
      {
        id: generateId(),
        type: 'title',
        content: { text: 'Paixão por criar o extraordinário' },
        styles: { fontSize: '3rem', marginBottom: '2rem' }
      },
      {
        id: generateId(),
        type: 'paragraph',
        content: { text: 'Desde 2024, a VYNEXA tem liderado a revolução no mercado de criação de sites, oferecendo ferramentas que potencializam o talento humano.' },
        styles: { fontSize: '1.1rem', lineHeight: '1.8' }
      }
    ]
  },
  services: {
    type: 'services',
    styles: {
      paddingTop: '6rem',
      paddingBottom: '6rem',
      backgroundColor: '#0f172a'
    },
    elements: [
      {
        id: generateId(),
        type: 'title',
        content: { text: 'Nossos Serviços' },
        styles: { textAlign: 'center', color: '#ffffff', marginBottom: '4rem' }
      },
      {
        id: generateId(),
        type: 'card',
        content: { text: 'Criação de Sites' },
        styles: {}
      }
    ]
  }
};
