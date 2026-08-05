import { StudioDesignSystem, StudioElement, StudioSection, StudioData } from './studio';

export interface LibraryItem {
  id: string;
  name: string;
  category: string;
  niche?: string;
  type: 'template' | 'section' | 'component';
  tags: string[];
  preview: string;
  structure: StudioData | StudioSection | StudioElement;
  metadata?: Record<string, any>;
}

export type StudioTab = 'elements' | 'sections' | 'templates' | 'styles' | 'favorites';

export interface StudioDesignPreset {
  id: string;
  name: string;
  design_system: Partial<StudioDesignSystem>;
  preview: string;
}
