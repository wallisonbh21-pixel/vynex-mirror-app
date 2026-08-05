import { StudioDesignPreset } from '@/types/studio-v2';

export const DESIGN_PRESETS: StudioDesignPreset[] = [
  {
    id: 'scalenexus-modern',
    name: 'ScaleNexus Modern',
    preview: '/previews/presets/modern.jpg',
    design_system: {
      colors: {
        primary: '#3B82F6',
        secondary: '#1E293B',
        accent: '#10B981',
        background: '#FFFFFF',
        surface: '#F8FAFC',
        border: '#E2E8F0',
        text: '#0F172A',
        textSecondary: '#64748B'
      },
      typography: {
        headingFont: 'Inter',
        bodyFont: 'Inter',
        headingWeight: '700',
        bodyWeight: '400'
      },
      buttons: {
        style: 'solid',
        borderRadius: '0.5rem',
        shadow: 'sm',
        size: 'md'
      }
    }
  },
  {
    id: 'scalenexus-dark',
    name: 'ScaleNexus Dark',
    preview: '/previews/presets/dark.jpg',
    design_system: {
      colors: {
        primary: '#6366F1',
        secondary: '#0F172A',
        accent: '#F59E0B',
        background: '#020617',
        surface: '#0F172A',
        border: '#1E293B',
        text: '#F8FAFC',
        textSecondary: '#94A3B8'
      },
      typography: {
        headingFont: 'Outfit',
        bodyFont: 'Inter',
        headingWeight: '800',
        bodyWeight: '400'
      },
      buttons: {
        style: 'solid',
        borderRadius: '1rem',
        shadow: 'md',
        size: 'md'
      }
    }
  }
];
