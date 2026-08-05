import React from 'react';
import { StudioElement, StudioDesignSystem } from '@/types/studio';
import { cn } from '@/lib/utils';

interface ElementRendererProps {
  element: StudioElement;
  designSystem: StudioDesignSystem;
  isSelected?: boolean;
  onSelect?: (id: string) => void;
}

export function ElementRenderer({ element, designSystem, isSelected, onSelect }: ElementRendererProps) {
  const { type, content, styles } = element;

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect?.(element.id);
  };

  const commonClasses = cn(
    "relative transition-all duration-200",
    isSelected && "ring-2 ring-primary ring-offset-2 z-10",
    "hover:ring-1 hover:ring-primary/50 cursor-pointer"
  );

  switch (type) {
    case 'title':
      return (
        <h1 
          className={cn(commonClasses, "font-bold")} 
          style={{ 
            fontSize: styles.fontSize || '2.5rem',
            color: styles.color || designSystem.colors.text,
            textAlign: styles.textAlign || 'left',
            fontFamily: designSystem.fonts.heading,
            marginBottom: styles.marginBottom || '1rem'
          }}
          onClick={handleClick}
        >
          {content.text || 'Título'}
        </h1>
      );
    
    case 'subtitle':
      return (
        <h2 
          className={cn(commonClasses, "font-semibold")} 
          style={{ 
            fontSize: styles.fontSize || '1.5rem',
            color: styles.color || designSystem.colors.secondary,
            textAlign: styles.textAlign || 'left',
            fontFamily: designSystem.fonts.heading,
            marginBottom: styles.marginBottom || '0.75rem'
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
            fontSize: styles.fontSize || '1rem',
            color: styles.color || designSystem.colors.text,
            textAlign: styles.textAlign || 'left',
            fontFamily: designSystem.fonts.body,
            lineHeight: styles.lineHeight || '1.6',
            marginBottom: styles.marginBottom || '1rem'
          }}
          onClick={handleClick}
        >
          {content.text || 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.'}
        </p>
      );

    case 'button':
      return (
        <button 
          className={cn(commonClasses, "px-6 py-3 font-bold transition-all")} 
          style={{ 
            backgroundColor: styles.backgroundColor || designSystem.colors.primary,
            color: styles.color || '#FFFFFF',
            borderRadius: styles.borderRadius || designSystem.borderRadius,
            fontSize: styles.fontSize || '1rem',
            display: 'inline-block'
          }}
          onClick={handleClick}
        >
          {content.text || 'Botão'}
        </button>
      );

    case 'image':
      return (
        <div className={commonClasses} onClick={handleClick}>
          <img 
            src={content.url || 'https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?auto=format&fit=crop&w=800&q=80'} 
            alt={content.alt || ''} 
            className="w-full h-auto object-cover"
            style={{
              borderRadius: styles.borderRadius || '0px',
              maxWidth: styles.maxWidth || '100%'
            }}
          />
        </div>
      );

    case 'whatsapp':
      return (
        <button 
          className={cn(commonClasses, "px-6 py-3 font-bold flex items-center gap-2 bg-[#25D366] text-white shadow-lg")} 
          style={{ 
            borderRadius: styles.borderRadius || '50px',
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
            <Button className="w-full" disabled>Enviar Mensagem</Button>
          </div>
        </div>
      );

    default:
      return <div onClick={handleClick} className={commonClasses}>Elemento {type}</div>;
  }
}

// Minimal button for the mock form
function Button({ children, className, ...props }: any) {
  return <button className={cn("px-4 py-2 bg-blue-600 text-white rounded font-medium", className)} {...props}>{children}</button>;
}
