export type Viewport = 'desktop' | 'tablet' | 'mobile';

export interface StudioDesignSystem {
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    surface: string;
    border: string;
    text: string;
    textSecondary: string;
  };
  typography: {
    headingFont: string;
    bodyFont: string;
    headingWeight: string;
    bodyWeight: string;
  };
  buttons: {
    style: 'solid' | 'outline' | 'ghost';
    borderRadius: string;
    shadow: string;
    size: 'sm' | 'md' | 'lg';
  };
  cards: {
    borderRadius: string;
    shadow: string;
    border: boolean;
  };
}

export interface StudioElement {
  id: string;
  type: 'title' | 'subtitle' | 'paragraph' | 'image' | 'button' | 'link' | 'card' | 'whatsapp' | 'form' | 'icon' | 'container' | 'columns' | 'header' | 'footer' | 'testimonial' | 'faq' | 'contact';
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
