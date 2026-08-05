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
  type: string;
  content: any;
  styles: Record<string, any>;
  responsive?: {
    tablet?: Record<string, any>;
    mobile?: Record<string, any>;
  };
}

export interface StudioSection {
  id: string;
  type: string;
  elements: StudioElement[];
  styles: Record<string, any>;
}

export interface StudioData {
  design_system: StudioDesignSystem;
  sections: StudioSection[];
}
