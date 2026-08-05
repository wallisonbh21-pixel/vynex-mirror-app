import React from 'react';
import { StudioElement, StudioSection, StudioDesignSystem } from '@/types/studio';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';

interface PropertyPanelProps {
  element: StudioElement | null;
  section: StudioSection | null;
  designSystem: StudioDesignSystem;
  onUpdateElement: (id: string, updates: Partial<StudioElement>) => void;
  onUpdateSection: (id: string, updates: Partial<StudioSection>) => void;
  onUpdateDesignSystem: (updates: Partial<StudioDesignSystem>) => void;
}

export function PropertyPanel({ 
  element, 
  section, 
  designSystem, 
  onUpdateElement, 
  onUpdateSection, 
  onUpdateDesignSystem 
}: PropertyPanelProps) {

  if (element) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Editor de {element.type}</h4>
          <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded uppercase">{element.id}</span>
        </div>

        <Tabs defaultValue="content">
          <TabsList className="w-full bg-slate-900 border-slate-800">
            <TabsTrigger value="content" className="flex-1 text-[10px] uppercase">Conteúdo</TabsTrigger>
            <TabsTrigger value="style" className="flex-1 text-[10px] uppercase">Estilo</TabsTrigger>
          </TabsList>

          <TabsContent value="content" className="space-y-4 pt-4">
            {['title', 'subtitle', 'paragraph', 'button', 'whatsapp'].includes(element.type) && (
              <div className="space-y-2">
                <Label className="text-xs text-slate-400">Texto</Label>
                <Input 
                  value={element.content.text || ''} 
                  onChange={(e) => onUpdateElement(element.id, { content: { ...element.content, text: e.target.value } })}
                  className="bg-slate-900 border-slate-800 text-slate-200"
                />
              </div>
            )}
            
            {element.type === 'image' && (
              <div className="space-y-2">
                <Label className="text-xs text-slate-400">URL da Imagem</Label>
                <Input 
                  value={element.content.url || ''} 
                  onChange={(e) => onUpdateElement(element.id, { content: { ...element.content, url: e.target.value } })}
                  className="bg-slate-900 border-slate-800 text-slate-200"
                  placeholder="https://..."
                />
              </div>
            )}

            {element.type === 'button' && (
              <div className="space-y-2">
                <Label className="text-xs text-slate-400">Link (URL)</Label>
                <Input 
                  value={element.content.link || ''} 
                  onChange={(e) => onUpdateElement(element.id, { content: { ...element.content, link: e.target.value } })}
                  className="bg-slate-900 border-slate-800 text-slate-200"
                  placeholder="/"
                />
              </div>
            )}
          </TabsContent>

          <TabsContent value="style" className="space-y-4 pt-4">
             <div className="space-y-2">
                <Label className="text-xs text-slate-400">Tamanho da Fonte</Label>
                <div className="flex gap-2">
                  <Input 
                    value={element.styles['fontSize'] || ''} 
                    onChange={(e) => onUpdateElement(element.id, { styles: { ...element.styles, fontSize: e.target.value } })}
                    className="bg-slate-900 border-slate-800 text-slate-200"
                    placeholder="1rem"
                  />
                </div>
             </div>

             <div className="space-y-2">
                <Label className="text-xs text-slate-400">Cor do Texto</Label>
                <div className="flex gap-2">
                  <div 
                    className="size-10 rounded border border-slate-700 cursor-pointer overflow-hidden"
                    style={{ backgroundColor: element.styles['color'] || designSystem.colors.text }}
                  >
                    <input 
                      type="color" 
                      className="opacity-0 w-full h-full cursor-pointer"
                      value={element.styles['color'] || designSystem.colors.text}
                      onChange={(e) => onUpdateElement(element.id, { styles: { ...element.styles, color: e.target.value } })}
                    />
                  </div>
                  <Input 
                    value={element.styles['color'] || ''} 
                    onChange={(e) => onUpdateElement(element.id, { styles: { ...element.styles, color: e.target.value } })}
                    className="flex-1 bg-slate-900 border-slate-800 text-slate-200"
                  />
                </div>
             </div>

             <div className="space-y-2">
                <Label className="text-xs text-slate-400">Alinhamento</Label>
                <Select 
                  value={element.styles['textAlign'] || 'left'} 
                  onValueChange={(val) => onUpdateElement(element.id, { styles: { ...element.styles, textAlign: val } })}
                >
                  <SelectTrigger className="bg-slate-900 border-slate-800 text-slate-200">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-slate-800 text-slate-200">
                    <SelectItem value="left">Esquerda</SelectItem>
                    <SelectItem value="center">Centro</SelectItem>
                    <SelectItem value="right">Direita</SelectItem>
                  </SelectContent>
                </Select>
             </div>
          </TabsContent>
        </Tabs>
      </div>
    );
  }

  if (section) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Editor de Seção</h4>
          <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded uppercase">{section.id}</span>
        </div>

        <div className="space-y-4">
           <div className="space-y-2">
              <Label className="text-xs text-slate-400">Cor de Fundo</Label>
              <div className="flex gap-2">
                <div 
                  className="size-10 rounded border border-slate-700 cursor-pointer overflow-hidden"
                  style={{ backgroundColor: section.styles['backgroundColor'] || designSystem.colors.background }}
                >
                  <input 
                    type="color" 
                    className="opacity-0 w-full h-full cursor-pointer"
                    value={section.styles['backgroundColor'] || designSystem.colors.background}
                    onChange={(e) => onUpdateSection(section.id, { styles: { ...section.styles, backgroundColor: e.target.value } })}
                  />
                </div>
                <Input 
                  value={section.styles['backgroundColor'] || ''} 
                  onChange={(e) => onUpdateSection(section.id, { styles: { ...section.styles, backgroundColor: e.target.value } })}
                  className="flex-1 bg-slate-900 border-slate-800 text-slate-200"
                />
              </div>
           </div>

           <div className="space-y-2">
              <Label className="text-xs text-slate-400">Espaçamento Superior (Padding)</Label>
              <Input 
                value={section.styles['paddingTop'] || '4rem'} 
                onChange={(e) => onUpdateSection(section.id, { styles: { ...section.styles, paddingTop: e.target.value } })}
                className="bg-slate-900 border-slate-800 text-slate-200"
              />
           </div>

           <div className="space-y-2">
              <Label className="text-xs text-slate-400">Espaçamento Inferior (Padding)</Label>
              <Input 
                value={section.styles['paddingBottom'] || '4rem'} 
                onChange={(e) => onUpdateSection(section.id, { styles: { ...section.styles, paddingBottom: e.target.value } })}
                className="bg-slate-900 border-slate-800 text-slate-200"
              />
           </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
       <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Design System</h4>
       <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-xs text-slate-400">Cor Primária</Label>
            <div className="flex gap-2">
              <div className="size-10 rounded border" style={{ backgroundColor: designSystem.colors.primary }}>
                <input 
                  type="color" className="opacity-0 w-full h-full cursor-pointer"
                  value={designSystem.colors.primary}
                  onChange={(e) => onUpdateDesignSystem({ colors: { ...designSystem.colors, primary: e.target.value } })}
                />
              </div>
              <Input 
                value={designSystem.colors.primary} 
                onChange={(e) => onUpdateDesignSystem({ colors: { ...designSystem.colors, primary: e.target.value } })}
                className="flex-1 bg-slate-900 border-slate-800 text-slate-200"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-xs text-slate-400">Fonte dos Títulos</Label>
            <Input 
              value={designSystem.typography.headingFont} 
              onChange={(e) => onUpdateDesignSystem({ typography: { ...designSystem.typography, headingFont: e.target.value } })}
              className="bg-slate-900 border-slate-800 text-slate-200"
            />
          </div>
       </div>

    </div>
  );
}
