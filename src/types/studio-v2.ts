import { StudioDesignSystem, StudioElement, StudioSection, StudioData } from './studio';

export interface LibraryItem {
  id: string;
  name: string;
  description?: string;
  category: string;
  niche?: string;
  type: 'template' | 'section' | 'component';
  tags: string[];
  preview: string;
  structure: StudioData | StudioSection | StudioElement;
  metadata?: {
    icon?: string;
    forge_context?: string;
    [key: string]: any;
  };
}


export type StudioTab = 'elements' | 'sections' | 'templates' | 'styles' | 'favorites';

export interface StudioDesignPreset {
  id: string;
  name: string;
  design_system: Partial<StudioDesignSystem>;
  preview: string;
}
