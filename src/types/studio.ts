export type Viewport = 'desktop' | 'tablet' | 'mobile';

export interface StudioDesignSystem {
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    text: string;
  };
  fonts: {
    heading: string;
    body: string;
  };
  spacing: 'compact' | 'normal' | 'loose';
  borderRadius: string;
}

export interface StudioElement {
  id: string;
  type: 'title' | 'subtitle' | 'paragraph' | 'image' | 'button' | 'link' | 'card' | 'whatsapp' | 'form' | 'icon' | 'container' | 'columns';
  content: any;
  styles: Record<string, any>;
  responsive?: {
    tablet?: Record<string, any>;
    mobile?: Record<string, any>;
  };
}

export interface StudioSection {
  id: string;
  type: string; // e.g., 'hero', 'about', 'services', 'custom'
  elements: StudioElement[];
  styles: Record<string, any>;
  order: number;
}

export interface StudioData {
  design_system: StudioDesignSystem;
  sections: StudioSection[];
}

export interface StudioState {
  data: StudioData;
  viewport: Viewport;
  selectedElementId: string | null;
  selectedSectionId: string | null;
  history: StudioData[];
  historyIndex: number;
}
