import React, { useState, useMemo } from 'react';
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
  CheckSquare,
  ChevronRight,
  Filter,
  Trash2,
  CheckCircle2,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { StudioTab, LibraryItem } from '@/types/studio-v2';
import { StudioElement, StudioSection, StudioDesignSystem, StudioData } from '@/types/studio';
import { ScrollArea } from '@/components/ui/scroll-area';
import { LIBRARY_REGISTRY } from '@/lib/studio/templates';
import { useStudioFavorites, useToggleFavorite } from '@/lib/studio/hooks';
import { toast } from 'sonner';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";

interface LibraryPanelProps {
  onAddElement: (type: StudioElement['type']) => void;
  onAddSection: (section: StudioSection) => void;
  onApplyTemplate: (data: StudioData) => void;
  onUpdateDesignSystem: (updates: Partial<StudioDesignSystem>) => void;
  designSystem: StudioDesignSystem;
  hasContent: boolean;
}

export function LibraryPanel({ 
  onAddElement, 
  onAddSection, 
  onApplyTemplate,
  onUpdateDesignSystem,
  designSystem,
  hasContent
}: LibraryPanelProps) {
  const [activeTab, setActiveTab] = useState<StudioTab>('elements');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [nicheFilter, setNicheFilter] = useState<string>('all');
  
  const { data: favorites = [] } = useStudioFavorites();
  const toggleFavorite = useToggleFavorite();

  const tabs = [
    { id: 'elements', icon: Box, label: 'Elementos' },
    { id: 'sections', icon: Layout, label: 'Seções' },
    { id: 'templates', icon: Monitor, label: 'Templates' },
    { id: 'styles', icon: Palette, label: 'Estilos' },
    { id: 'favorites', icon: Star, label: 'Favoritos' },
  ];

  const handleFavoriteToggle = (itemId: string, itemType: string) => {
    const isFav = favorites.some(f => f.item_id === itemId && f.item_type === itemType);
    toggleFavorite.mutate({ itemId, itemType, isFavorite: isFav });
    toast.success(isFav ? "Removido dos favoritos" : "Adicionado aos favoritos");
  };

  const filteredItems = useMemo(() => {
    const query = searchQuery.toLowerCase();
    
    if (activeTab === 'elements') {
      return LIBRARY_REGISTRY.elements.filter(el => 
        el.label.toLowerCase().includes(query) || 
        el.description.toLowerCase().includes(query)
      );
    }
    
    if (activeTab === 'sections') {
      return LIBRARY_REGISTRY.sections.filter(sec => {
        const matchesQuery = sec.name.toLowerCase().includes(query) || sec.tags.some(t => t.includes(query));
        const matchesCategory = categoryFilter === 'all' || sec.category === categoryFilter;
        return matchesQuery && matchesCategory;
      });
    }
    
    if (activeTab === 'templates') {
      return LIBRARY_REGISTRY.templates.filter(tmpl => {
        const matchesQuery = tmpl.name.toLowerCase().includes(query) || tmpl.tags.some(t => t.includes(query));
        const matchesNiche = nicheFilter === 'all' || tmpl.niche === nicheFilter;
        return matchesQuery && matchesNiche;
      });
    }

    if (activeTab === 'favorites') {
      const favTemplates = LIBRARY_REGISTRY.templates.filter(t => favorites.some(f => f.item_id === t.id && f.item_type === 'template'));
      const favSections = LIBRARY_REGISTRY.sections.filter(s => favorites.some(f => f.item_id === s.id && f.item_type === 'section'));
      return { templates: favTemplates, sections: favSections };
    }
    
    return [];
  }, [activeTab, searchQuery, categoryFilter, nicheFilter, favorites]);

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

      {/* FILTERS & SEARCH */}
      <div className="p-4 space-y-3 border-b border-slate-800 bg-slate-900/20">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-500" />
          <Input 
            placeholder="Pesquisar na biblioteca..." 
            className="pl-9 bg-slate-900 border-slate-800 text-sm focus:ring-primary/20"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        {activeTab === 'sections' && (
          <div className="flex gap-2 overflow-x-auto pb-1 custom-scrollbar">
            {['all', 'hero', 'about', 'services', 'footer'].map(cat => (
              <Button 
                key={cat} 
                variant="ghost" 
                size="sm" 

                className={cn("text-[10px] uppercase font-bold px-2 h-7 rounded-md border border-transparent", categoryFilter === cat ? "bg-primary/20 text-primary border-primary/30" : "bg-slate-900 text-slate-500 hover:bg-slate-800")}
                onClick={() => setCategoryFilter(cat)}
              >
                {cat === 'all' ? 'Todos' : cat}
              </Button>
            ))}
          </div>
        )}

        {activeTab === 'templates' && (
          <div className="flex gap-2 overflow-x-auto pb-1 custom-scrollbar">
            {['all', 'hamburgueria', 'academia', 'advocacia', 'dentista', 'barbearia', 'salao', 'imobiliaria', 'fotografia', 'oficina', 'contabilidade', 'eventos', 'loja', 'servicos'].map(niche => (
              <Button 
                key={niche} 
                variant="ghost" 
                size="sm" 

                className={cn("text-[10px] uppercase font-bold px-2 h-7 rounded-md border border-transparent", nicheFilter === niche ? "bg-primary/20 text-primary border-primary/30" : "bg-slate-900 text-slate-500 hover:bg-slate-800")}
                onClick={() => setNicheFilter(niche)}
              >
                {niche === 'all' ? 'Todos' : niche}
              </Button>
            ))}
          </div>
        )}
      </div>

      {/* CONTENT AREA */}
      <ScrollArea className="flex-1">
        <div className="p-4">
          {activeTab === 'elements' && <ElementsTab items={filteredItems as any[]} onAddElement={onAddElement} />}
          {activeTab === 'sections' && <SectionsTab items={filteredItems as any[]} onAddSection={onAddSection} onFavorite={handleFavoriteToggle} favorites={favorites} />}
          {activeTab === 'templates' && <TemplatesTab items={filteredItems as any[]} onApplyTemplate={onApplyTemplate} onFavorite={handleFavoriteToggle} favorites={favorites} hasContent={hasContent} />}
          {activeTab === 'styles' && <StylesTab onUpdateDesignSystem={onUpdateDesignSystem} designSystem={designSystem} />}
          {activeTab === 'favorites' && <FavoritesTab items={filteredItems as any} onAddSection={onAddSection} onApplyTemplate={onApplyTemplate} hasContent={hasContent} />}
        </div>

      </ScrollArea>
    </aside>
  );
}

function ElementsTab({ items, onAddElement }: { items: any[], onAddElement: any }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-2">
        {items.map((item) => (
          <div key={item.type} className="group p-3 bg-slate-900 rounded-xl border border-slate-800 hover:border-primary/50 transition-all flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-slate-800 rounded-lg text-slate-500 group-hover:text-primary transition-all">
                <Plus className="size-4" />
              </div>
              <div>
                <span className="text-sm font-bold text-slate-200 block leading-tight">{item.label}</span>
                <span className="text-[10px] text-slate-500">{item.description}</span>
              </div>
            </div>
            <Button size="sm" variant="ghost" className="h-8 px-2 hover:bg-primary/10 hover:text-primary" onClick={() => {
              onAddElement(item.type);
              toast.success(`${item.label} adicionado`);
            }}>
              Adicionar
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}

function SectionsTab({ items, onAddSection, onFavorite, favorites }: { items: any[], onAddSection: any, onFavorite: any, favorites: any[] }) {
  return (
    <div className="space-y-4">
      {items.map((sec) => (
        <div key={sec.id} className="group overflow-hidden rounded-xl border border-slate-800 bg-slate-900 shadow-sm transition-all hover:border-primary/50">
          <div className="aspect-video w-full bg-slate-800 relative overflow-hidden">
            <img src={sec.preview} alt={sec.name} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
            <div className="absolute top-2 right-2 flex gap-1">
              <Button size="icon" variant="secondary" className="size-8 rounded-full shadow-lg" onClick={() => onFavorite(sec.id, 'section')}>
                <Heart className={cn("size-4", favorites.some(f => f.item_id === sec.id) ? "fill-red-500 text-red-500" : "text-slate-600")} />
              </Button>
            </div>
          </div>
          <div className="p-3 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-slate-200 block">{sec.name}</span>
              <div className="flex gap-1 mt-1">
                {sec.tags.slice(0, 2).map((t: string) => (
                  <span key={t} className="text-[8px] uppercase font-bold text-slate-500 px-1 bg-slate-800 rounded">#{t}</span>
                ))}
              </div>
            </div>
            <Button size="sm" className="h-8 px-3 bg-primary/10 text-primary hover:bg-primary/20" onClick={() => {
              onAddSection(sec.structure);
              toast.success("Seção adicionada");
            }}>
              Adicionar
            </Button>
          </div>
        </div>
      ))}
      {items.length === 0 && (
        <div className="py-12 text-center">
          <Layout className="size-8 text-slate-800 mx-auto mb-2" />
          <p className="text-xs text-slate-500">Nenhuma seção encontrada.</p>
        </div>
      )}
    </div>
  );
}

function TemplatesTab({ items, onApplyTemplate, onFavorite, favorites, hasContent }: { items: any[], onApplyTemplate: any, onFavorite: any, favorites: any[], hasContent: boolean }) {
  const [selectedTemplate, setSelectedTemplate] = useState<LibraryItem | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleApplyClick = (tmpl: LibraryItem) => {
    setSelectedTemplate(tmpl);
    if (hasContent) {
      setShowConfirm(true);
    } else {
      onApplyTemplate(tmpl.structure);
      toast.success("Template aplicado com sucesso");
    }
  };

  return (
    <div className="space-y-4">
      {items.map((tmpl) => (
        <div key={tmpl.id} className="group overflow-hidden rounded-xl border border-slate-800 bg-slate-900 shadow-sm transition-all hover:border-primary/50">
          <div className="aspect-[16/10] w-full bg-slate-800 relative overflow-hidden">
            <img src={tmpl.preview} alt={tmpl.name} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
            <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
              <Button size="sm" variant="secondary" className="gap-2 rounded-full">
                <Eye className="size-3" /> Preview
              </Button>
              <Button size="sm" className="gap-2 rounded-full" onClick={() => handleApplyClick(tmpl)}>
                <CheckCircle2 className="size-3" /> Usar
              </Button>
            </div>
            <div className="absolute top-2 right-2">
              <Button size="icon" variant="secondary" className="size-8 rounded-full shadow-lg" onClick={() => onFavorite(tmpl.id, 'template')}>
                <Heart className={cn("size-4", favorites.some(f => f.item_id === tmpl.id) ? "fill-red-500 text-red-500" : "text-slate-600")} />
              </Button>
            </div>
          </div>
          <div className="p-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold text-slate-200">{tmpl.name}</span>
              <span className="text-[10px] text-primary font-bold uppercase">{tmpl.niche}</span>
            </div>
            <p className="text-[10px] text-slate-500 leading-tight">{tmpl.description}</p>
          </div>
        </div>
      ))}

      <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
        <DialogContent className="bg-slate-900 border-slate-800 text-white">
          <DialogHeader>
            <DialogTitle>Substituir conteúdo?</DialogTitle>
            <DialogDescription className="text-slate-400">
              Este projeto já possui conteúdo. Aplicar um novo template irá substituir todo o canvas atual. Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="ghost" onClick={() => setShowConfirm(false)}>Cancelar</Button>
            <Button variant="destructive" onClick={() => {
              if (selectedTemplate) onApplyTemplate(selectedTemplate.structure as StudioData);
              setShowConfirm(false);
              toast.success("Template aplicado");
            }}>Substituir conteúdo</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function StylesTab({ onUpdateDesignSystem, designSystem }: { onUpdateDesignSystem: any, designSystem: StudioDesignSystem }) {
  return (
    <div className="space-y-6">
      <h4 className="text-[10px] font-bold text-slate-600 uppercase tracking-widest mb-3">Identidade Visual</h4>
      <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
        <p className="text-[11px] text-primary font-medium leading-relaxed">As alterações aqui são aplicadas globalmente.</p>
      </div>
      
      <div className="space-y-4">
        <div className="space-y-2">
          <span className="text-[10px] font-bold text-slate-500 uppercase">Cores Principais</span>
          <div className="grid grid-cols-2 gap-2">
            <div className="flex items-center gap-2 p-2 bg-slate-900 rounded-lg border border-slate-800">
              <div className="size-6 rounded" style={{ backgroundColor: designSystem.colors.primary }} />
              <span className="text-[10px] font-medium">Primária</span>
            </div>
            <div className="flex items-center gap-2 p-2 bg-slate-900 rounded-lg border border-slate-800">
              <div className="size-6 rounded" style={{ backgroundColor: designSystem.colors.secondary }} />
              <span className="text-[10px] font-medium">Secundária</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function FavoritesTab({ items, onAddSection, onApplyTemplate, hasContent }: { items: any, onAddSection: any, onApplyTemplate: any, hasContent: boolean }) {
  const { templates = [], sections = [] } = items;

  if (templates.length === 0 && sections.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center py-12 px-6">
        <Heart className="size-8 text-slate-800 mb-4" />
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Sem favoritos</p>
        <p className="text-[11px] text-slate-500 leading-relaxed">Favorite templates e seções para acessá-los rapidamente aqui.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {templates.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">Templates Favoritos</h4>
          <TemplatesTab items={templates} onApplyTemplate={onApplyTemplate} onFavorite={() => {}} favorites={[]} hasContent={hasContent} />
        </div>
      )}
      {sections.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">Seções Favoritas</h4>
          <SectionsTab items={sections} onAddSection={onAddSection} onFavorite={() => {}} favorites={[]} />
        </div>
      )}
    </div>
  );
}
