import React, { useState } from 'react';
import { 
  Box, 
  Layout, 
  Monitor, 
  Palette, 
  Star, 
  Search,
  Plus,
  Heart,
  Eye,
  Type,
  Image as ImageIcon,
  MousePointer2,
  Smartphone,
  CheckSquare
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { StudioTab } from '@/types/studio-v2';
import { StudioElement, StudioSection, StudioDesignSystem } from '@/types/studio';
import { ScrollArea } from '@/components/ui/scroll-area';

interface LibraryPanelProps {
  onAddElement: (type: StudioElement['type']) => void;
  onAddSection: (section: StudioSection) => void;
  onApplyTemplate: (data: any) => void;
  onUpdateDesignSystem: (updates: Partial<StudioDesignSystem>) => void;
  designSystem: StudioDesignSystem;
}

export function LibraryPanel({ 
  onAddElement, 
  onAddSection, 
  onApplyTemplate,
  onUpdateDesignSystem,
  designSystem 
}: LibraryPanelProps) {
  const [activeTab, setActiveTab] = useState<StudioTab>('elements');
  const [searchQuery, setSearchQuery] = useState('');

  const tabs = [
    { id: 'elements', icon: Box, label: 'Elementos' },
    { id: 'sections', icon: Layout, label: 'Seções' },
    { id: 'templates', icon: Monitor, label: 'Templates' },
    { id: 'styles', icon: Palette, label: 'Estilos' },
    { id: 'favorites', icon: Star, label: 'Favoritos' },
  ];

  return (
    <aside className="w-[340px] border-r border-slate-800 bg-slate-950 flex flex-col z-40">
      {/* TABS NAV */}
      <div className="flex border-b border-slate-800">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as StudioTab)}
            className={cn(
              "flex-1 flex flex-col items-center justify-center py-3 px-1 transition-all group",
              activeTab === tab.id 
                ? "bg-slate-900/50 text-primary border-b-2 border-primary" 
                : "text-slate-500 hover:text-slate-300 hover:bg-slate-900/30"
            )}
            title={tab.label}
          >
            <tab.icon className={cn("size-5 mb-1 transition-transform group-hover:scale-110", activeTab === tab.id ? "text-primary" : "text-slate-500")} />
            <span className="text-[9px] font-bold uppercase tracking-tight">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* SEARCH */}
      <div className="p-4 border-b border-slate-800 bg-slate-900/20">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-500" />
          <Input 
            placeholder="Pesquisar..." 
            className="pl-9 bg-slate-900 border-slate-800 text-sm focus:ring-primary/20"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* CONTENT AREA */}
      <ScrollArea className="flex-1">
        <div className="p-4">
          {activeTab === 'elements' && <ElementsTab onAddElement={onAddElement} />}
          {activeTab === 'sections' && <SectionsTab onAddSection={onAddSection} searchQuery={searchQuery} />}
          {activeTab === 'templates' && <TemplatesTab onApplyTemplate={onApplyTemplate} searchQuery={searchQuery} />}
          {activeTab === 'styles' && <StylesTab onUpdateDesignSystem={onUpdateDesignSystem} designSystem={designSystem} />}
          {activeTab === 'favorites' && <FavoritesTab />}
        </div>
      </ScrollArea>
    </aside>
  );
}

// Sub-components for each tab
function ElementsTab({ onAddElement }: { onAddElement: any }) {
  const elementCategories = [
    {
      title: "Texto",
      items: [
        { type: 'title', label: 'Título', icon: Type },
        { type: 'subtitle', label: 'Subtítulo', icon: Type },
        { type: 'paragraph', label: 'Parágrafo', icon: Type },
      ]
    },
    {
      title: "Mídia & Ação",
      items: [
        { type: 'image', label: 'Imagem', icon: ImageIcon },
        { type: 'button', label: 'Botão', icon: MousePointer2 },
        { type: 'whatsapp', label: 'WhatsApp', icon: Smartphone },
        { type: 'form', label: 'Formulário', icon: CheckSquare },
      ]
    }
  ];

  return (
    <div className="space-y-6">
      {elementCategories.map((cat) => (
        <div key={cat.title}>
          <h4 className="text-[10px] font-bold text-slate-600 uppercase tracking-widest mb-3">{cat.title}</h4>
          <div className="grid grid-cols-2 gap-2">
            {cat.items.map((item) => (
              <button 
                key={item.label} 
                className="p-3 bg-slate-900 rounded-xl border border-slate-800 text-[11px] text-center cursor-pointer hover:border-primary/50 hover:bg-slate-800 transition-all flex flex-col items-center gap-2 group shadow-sm active:scale-95"
                onClick={() => onAddElement(item.type)}
              >
                <div className="p-2 bg-slate-800 rounded-lg text-slate-500 group-hover:text-primary group-hover:bg-primary/10 transition-all">
                  <item.icon className="size-4" />
                </div>
                <span className="font-medium text-slate-300 group-hover:text-white">{item.label}</span>
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function SectionsTab({ onAddSection, searchQuery }: { onAddSection: any, searchQuery: string }) {
  return (
    <div className="space-y-4">
      <h4 className="text-[10px] font-bold text-slate-600 uppercase tracking-widest mb-3">Seções Profissionais</h4>
      <div className="grid grid-cols-1 gap-3 text-center py-12">
        <Layout className="size-8 text-slate-800 mx-auto mb-2" />
        <p className="text-xs text-slate-500">Nenhuma seção encontrada.</p>
      </div>
    </div>
  );
}

function TemplatesTab({ onApplyTemplate, searchQuery }: { onApplyTemplate: any, searchQuery: string }) {
  return (
    <div className="space-y-4">
      <h4 className="text-[10px] font-bold text-slate-600 uppercase tracking-widest mb-3">Templates por Nicho</h4>
      <div className="grid grid-cols-1 gap-4 text-center py-12">
        <Monitor className="size-8 text-slate-800 mx-auto mb-2" />
        <p className="text-xs text-slate-500">Carregando biblioteca premium...</p>
      </div>
    </div>
  );
}

function StylesTab({ onUpdateDesignSystem, designSystem }: { onUpdateDesignSystem: any, designSystem: StudioDesignSystem }) {
  return (
    <div className="space-y-6">
      <h4 className="text-[10px] font-bold text-slate-600 uppercase tracking-widest mb-3">Identidade Visual</h4>
      <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
        <p className="text-[11px] text-primary font-medium leading-relaxed">As alterações feitas aqui serão aplicadas automaticamente em todos os componentes que utilizam tokens globais.</p>
      </div>
      {/* Styles logic will be expanded in the next step */}
    </div>
  );
}

function FavoritesTab() {
  return (
    <div className="h-full flex flex-col items-center justify-center text-center py-12 px-6">
      <Heart className="size-8 text-slate-800 mb-4" />
      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Sem favoritos</p>
      <p className="text-[11px] text-slate-500 leading-relaxed">Favorite templates e seções para acessá-los rapidamente aqui.</p>
    </div>
  );
}
