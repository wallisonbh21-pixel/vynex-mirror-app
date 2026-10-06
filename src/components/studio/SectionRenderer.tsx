import React from 'react';
import { StudioSection, StudioDesignSystem } from '@/types/studio';
import { ElementRenderer } from './ElementRenderer';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ChevronUp, ChevronDown, Copy, Trash2 } from 'lucide-react';

interface SectionRendererProps {
  section: StudioSection;
  designSystem: StudioDesignSystem;
  selectedElementId: string | null;
  onSelectElement: (id: string) => void;
  onSelectSection: (id: string) => void;
  onMoveSection: (id: string, direction: 'up' | 'down') => void;
  onDuplicateSection: (id: string) => void;
  onDeleteSection: (id: string) => void;
  isSelected?: boolean;
  readOnly?: boolean | undefined;
}

export function SectionRenderer({ 
  section, 
  designSystem, 
  selectedElementId,
  onSelectElement,
  onSelectSection,
  onMoveSection,
  onDuplicateSection,
  onDeleteSection,
  isSelected,
  readOnly
}: SectionRendererProps) {
  
  const { styles, elements } = section;

  return (
    <div 
      className={cn(
        "group relative transition-all duration-200",
        isSelected && "ring-2 ring-primary ring-inset z-10"
      )}
      style={{
        backgroundColor: styles['backgroundColor'] || designSystem.colors.background,
        paddingTop: styles['paddingTop'] || '4rem',
        paddingBottom: styles['paddingBottom'] || '4rem',
        backgroundImage: styles['backgroundImage'] ? `url(${styles['backgroundImage']})` : 'none',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        color: styles['backgroundColor'] === '#0f172a' ? '#ffffff' : designSystem.colors.text
      }}

      onClick={() => { if (!readOnly) onSelectSection(section.id); }}
    >
      {/* Section controls */}
      {!readOnly && (
      <div className="absolute right-2 top-2 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-20">
        <Button 
          variant="secondary" size="icon" className="size-8 rounded-lg shadow-md bg-white hover:bg-slate-100 text-slate-900 border"
          onClick={(e) => { e.stopPropagation(); onMoveSection(section.id, 'up'); }}
        >
          <ChevronUp className="size-4" />
        </Button>
        <Button 
          variant="secondary" size="icon" className="size-8 rounded-lg shadow-md bg-white hover:bg-slate-100 text-slate-900 border"
          onClick={(e) => { e.stopPropagation(); onMoveSection(section.id, 'down'); }}
        >
          <ChevronDown className="size-4" />
        </Button>
        <Button 
          variant="secondary" size="icon" className="size-8 rounded-lg shadow-md bg-white hover:bg-slate-100 text-slate-900 border"
          onClick={(e) => { e.stopPropagation(); onDuplicateSection(section.id); }}
        >
          <Copy className="size-4" />
        </Button>
        <Button 
          variant="destructive" size="icon" className="size-8 rounded-lg shadow-md border"
          onClick={(e) => { e.stopPropagation(); onDeleteSection(section.id); }}
        >
          <Trash2 className="size-4" />
        </Button>
      </div>
      )}

      <div className={cn(
        "container mx-auto px-4",
        styles['layout'] === 'centered' && "text-center flex flex-col items-center"
      )}>
        {elements.length === 0 ? (
          <div className="py-20 border-2 border-dashed border-slate-200 rounded-2xl flex items-center justify-center text-slate-400">
            Arraste elementos para esta seção
          </div>
        ) : (
          <div className="space-y-4">
            {elements.map((element) => (
              <ElementRenderer 
                key={element.id}
                element={element}
                designSystem={designSystem}
                isSelected={selectedElementId === element.id}
                onSelect={onSelectElement}
                readOnly={readOnly}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
