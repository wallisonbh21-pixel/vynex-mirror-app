import React from 'react';
import { StudioElement, StudioDesignSystem } from '@/types/studio';
import { cn } from '@/lib/utils';
import { isSafeImageUrl } from '@/lib/studio/site-images';
import { EffectWrapper } from './EffectWrapper';

interface ElementRendererProps {
  element: StudioElement;
  designSystem: StudioDesignSystem;
  isSelected?: boolean;
  onSelect?: (id: string) => void;
  readOnly?: boolean | undefined;
}

export function ElementRenderer(props: ElementRendererProps) {
  const { type, effects } = props.element;
  const inline = type === 'button' || type === 'whatsapp';
  return (
    <EffectWrapper effects={effects} inline={inline}>
      <BaseElement {...props} />
    </EffectWrapper>
  );
}

function BaseElement({ element, designSystem, isSelected, onSelect, readOnly }: ElementRendererProps) {
  const { type, content, styles } = element;

  const handleClick = (e: React.MouseEvent) => {
    if (readOnly) return;
    e.stopPropagation();
    onSelect?.(element.id);
  };

  const commonClasses = cn(
    "relative transition-all duration-200",
    !readOnly && isSelected && "ring-2 ring-primary ring-offset-2 z-10",
    !readOnly && "hover:ring-1 hover:ring-primary/50 cursor-pointer"
  );

  const getFontFamily = (type: 'heading' | 'body') => {
    return type === 'heading' ? designSystem.typography.headingFont : designSystem.typography.bodyFont;
  };

  const getFontWeight = (type: 'heading' | 'body') => {
    return type === 'heading' ? designSystem.typography.headingWeight : designSystem.typography.bodyWeight;
  };

  switch (type) {
    case 'title':
      return (
        <h1 
          className={cn(commonClasses)} 
          style={{ 
            fontSize: styles['fontSize'] || '2.5rem',
            color: styles['color'] || designSystem.colors.text,
            textAlign: styles['textAlign'] || 'left',
            fontFamily: getFontFamily('heading'),
            fontWeight: getFontWeight('heading'),
            marginBottom: styles['marginBottom'] || '1rem'
          }}
          onClick={handleClick}
        >
          {content.text || 'Título'}
        </h1>
      );
    
    case 'subtitle':
      return (
        <h2 
          className={cn(commonClasses)} 
          style={{ 
            fontSize: styles['fontSize'] || '1.5rem',
            color: styles['color'] || designSystem.colors.textSecondary,
            textAlign: styles['textAlign'] || 'left',
            fontFamily: getFontFamily('heading'),
            fontWeight: getFontWeight('heading'),
            marginBottom: styles['marginBottom'] || '0.75rem'
          }}
          onClick={handleClick}
        >
          {content.text || 'Subtítulo'}
        </h2>
      );

    case 'paragraph':
      return (
        <p 
          className={commonClasses} 
          style={{ 
            fontSize: styles['fontSize'] || '1rem',
            color: styles['color'] || designSystem.colors.text,
            textAlign: styles['textAlign'] || 'left',
            fontFamily: getFontFamily('body'),
            fontWeight: getFontWeight('body'),
            lineHeight: styles['lineHeight'] || '1.6',
            marginBottom: styles['marginBottom'] || '1rem'
          }}
          onClick={handleClick}
        >
          {content.text || 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.'}
        </p>
      );

    case 'button':
      return (
        <button 
          className={cn(commonClasses, "px-6 py-3 transition-all")} 
          style={{ 
            backgroundColor: styles['backgroundColor'] || designSystem.colors.primary,
            color: styles['color'] || '#FFFFFF',
            borderRadius: styles['borderRadius'] || designSystem.buttons.borderRadius,
            fontSize: styles['fontSize'] || '1rem',
            fontWeight: getFontWeight('body'),
            display: 'inline-block',
            boxShadow: designSystem.buttons.shadow === 'sm' ? '0 1px 2px 0 rgb(0 0 0 / 0.05)' : 'none'
          }}
          onClick={handleClick}
        >
          {content.text || 'Botão'}
        </button>
      );

    case 'image': {
      const removed = content.removed === true;
      if (removed) {
        // Estado vazio: no site publicado some ou vira espaço neutro; no Studio fica visível para edição.
        if (readOnly && content.emptyMode !== 'placeholder') return null;
        return (
          <div
            className={cn(commonClasses, "w-full flex items-center justify-center text-center")}
            style={{
              aspectRatio: '16 / 9',
              maxWidth: styles['maxWidth'] || '100%',
              borderRadius: styles['borderRadius'] || '12px',
              background: `linear-gradient(135deg, ${designSystem.colors.surface}, ${designSystem.colors.background})`,
              border: readOnly ? 'none' : `2px dashed ${designSystem.colors.border}`,
              color: designSystem.colors.textSecondary,
            }}
            onClick={handleClick}
          >
            {!readOnly && <span className="text-xs px-3">Imagem removida — selecione para enviar outra ou restaurar</span>}
          </div>
        );
      }
      const safe = isSafeImageUrl(content.url) ? content.url : undefined;
      return (
        <div className={commonClasses} onClick={handleClick}>
          <img 
            src={safe || 'https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?auto=format&fit=crop&w=800&q=80'} 
            alt={content.alt || ''} 
            loading="lazy"
            className="w-full h-auto object-cover"
            style={{
              borderRadius: styles['borderRadius'] || '0px',
              maxWidth: styles['maxWidth'] || '100%'
            }}
          />
        </div>
      );
    }

    case 'whatsapp':
      return (
        <button 
          className={cn(commonClasses, "px-6 py-3 font-bold flex items-center gap-2 bg-[#25D366] text-white shadow-lg")} 
          style={{ 
            borderRadius: '50px',
          }}
          onClick={handleClick}
        >
          <span className="text-xl">📱</span>
          {content.text || 'WhatsApp'}
        </button>
      );

    case 'form':
      return (
        <div className={cn(commonClasses, "p-6 bg-slate-50 border rounded-xl")} onClick={handleClick}>
          <div className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase">Nome</label>
              <div className="h-10 border bg-white rounded-md"></div>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase">E-mail</label>
              <div className="h-10 border bg-white rounded-md"></div>
            </div>
            <button className="w-full px-4 py-2 bg-blue-600 text-white rounded font-medium opacity-50" disabled>Enviar Mensagem</button>
          </div>
        </div>
      );

    default:
      return <div onClick={handleClick} className={commonClasses}>Elemento {type}</div>;
  }
}
