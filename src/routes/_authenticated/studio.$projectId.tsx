import { createFileRoute, Link, useParams } from '@tanstack/react-router';
import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  ArrowLeft, 
  Save, 
  Eye, 
  Undo, 
  Redo, 
  Monitor, 
  Tablet, 
  Smartphone,
  Plus,
  Settings,
  Loader2,
  Trash2,
  Copy,
  ChevronUp,
  ChevronDown
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useStudioData, useSaveStudioData } from '@/lib/studio/hooks';
import { StudioData, StudioSection, StudioElement, Viewport } from '@/types/studio';
import { ElementLibrary } from '@/components/studio/ElementLibrary';
import { SectionRenderer } from '@/components/studio/SectionRenderer';
import { generateId } from '@/lib/studio/utils';

export const Route = createFileRoute('/_authenticated/studio/$projectId' as any)({
  component: VynexaStudioPage,
  head: () => ({
    meta: [{ title: 'VYNEXA Studio — Editor Visual' }],
  }),
});

function VynexaStudioPage() {
  const { projectId } = useParams({ from: '/_authenticated/studio/$projectId' as any });
  const { data: initialData, isLoading } = useStudioData(projectId);
  const saveMutation = useSaveStudioData();
  
  const [data, setData] = useState<StudioData | null>(null);
  const [viewport, setViewport] = useState<Viewport>('desktop');
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [history, setHistory] = useState<StudioData[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Sync with initial data
  useEffect(() => {
    if (initialData && !data) {
      const cloned = JSON.parse(JSON.stringify(initialData));
      setData(cloned);
      setHistory([cloned]);
      setHistoryIndex(0);
    }
  }, [initialData, data]);

  // History Management
  const addToHistory = useCallback((newData: StudioData) => {
    setHistory(prev => {
      const newHistory = prev.slice(0, historyIndex + 1);
      newHistory.push(JSON.parse(JSON.stringify(newData)));
      if (newHistory.length > 50) newHistory.shift();
      return newHistory;
    });
    setHistoryIndex(prev => {
      const currentHistoryLength = historyIndex + 1;
      return currentHistoryLength >= 50 ? 49 : currentHistoryLength;
    });
  }, [historyIndex]);

  const updateData = useCallback((newData: StudioData) => {
    setData(newData);
    addToHistory(newData);

    // Auto-save logic
    setSaveStatus('saving');
    if (autoSaveTimeoutRef.current) clearTimeout(autoSaveTimeoutRef.current);
    autoSaveTimeoutRef.current = setTimeout(async () => {
      try {
        await saveMutation.mutateAsync({ projectId, data: newData });
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 3000);
      } catch (error) {
        setSaveStatus('idle');
      }
    }, 2000);
  }, [addToHistory, projectId, saveMutation]);

  const undo = () => {
    if (historyIndex > 0) {
      const prev = history[historyIndex - 1];
      if (prev) {
        setData(JSON.parse(JSON.stringify(prev)));
        setHistoryIndex(historyIndex - 1);
      }
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      const next = history[historyIndex + 1];
      if (next) {
        setData(JSON.parse(JSON.stringify(next)));
        setHistoryIndex(historyIndex + 1);
      }
    }
  };

  const handleSave = async () => {
    if (!data) return;
    setIsSaving(true);
    try {
      await saveMutation.mutateAsync({ projectId, data });
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading || !data) {
    return (
      <div className="h-screen w-screen bg-slate-950 flex flex-col items-center justify-center gap-4 text-white">
        <Loader2 className="size-10 animate-spin text-primary" />
        <p className="animate-pulse font-medium">Carregando VYNEXA Studio...</p>
      </div>
    );
  }

  const handleAddElement = (type: any) => {
    if (!data) return;
    const targetSectionId = selectedSectionId || (data.sections.length > 0 ? data.sections[0].id : null);
    if (!targetSectionId) return;

    const newData = { ...data, sections: [...data.sections] };
    const sectionIndex = newData.sections.findIndex(s => s.id === targetSectionId);
    if (sectionIndex === -1) return;

    const newElement: StudioElement = {
      id: generateId(),
      type,
      content: { text: type.charAt(0).toUpperCase() + type.slice(1) },
      styles: {}
    };

    newData.sections[sectionIndex] = {
      ...newData.sections[sectionIndex],
      elements: [...newData.sections[sectionIndex].elements, newElement]
    };
    
    updateData(newData);
    setSelectedElementId(newElement.id);
  };

  const handleAddSection = (type: string) => {
    if (!data) return;
    const newData = { ...data, sections: [...data.sections] };
    const newSection: StudioSection = {
      id: generateId(),
      type,
      elements: [],
      styles: {},
      order: newData.sections.length
    };
    newData.sections.push(newSection);
    updateData(newData);
    setSelectedSectionId(newSection.id);
  };

  return (
    <div className="h-screen w-screen bg-slate-900 flex flex-col overflow-hidden text-slate-200">
      {/* TOOLBAR */}
      <header className="h-14 border-b border-slate-800 bg-slate-950 px-4 flex items-center justify-between z-50">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild className="text-slate-400 hover:text-white">
            <Link to={"/_authenticated/projetos/$projectId" as any} params={{ projectId } as any}>
              <ArrowLeft className="size-4 mr-2" /> Sair
            </Link>
          </Button>
          <div className="h-4 w-px bg-slate-800 mx-2" />
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-widest block leading-none mb-1">VYNEXA STUDIO</span>
            <span className="text-sm font-bold text-white leading-none">Editor Visual</span>
          </div>
        </div>

        <div className="flex items-center bg-slate-900 rounded-lg p-1 border border-slate-800">
          <Button 
            variant={viewport === 'desktop' ? 'secondary' : 'ghost'} 
            size="icon" className="size-8"
            onClick={() => setViewport('desktop')}
          >
            <Monitor className="size-4" />
          </Button>
          <Button 
            variant={viewport === 'tablet' ? 'secondary' : 'ghost'} 
            size="icon" className="size-8"
            onClick={() => setViewport('tablet')}
          >
            <Tablet className="size-4" />
          </Button>
          <Button 
            variant={viewport === 'mobile' ? 'secondary' : 'ghost'} 
            size="icon" className="size-8"
            onClick={() => setViewport('mobile')}
          >
            <Smartphone className="size-4" />
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center mr-4">
             <Button variant="ghost" size="icon" className="size-8" onClick={undo} disabled={historyIndex <= 0}>
               <Undo className="size-4" />
             </Button>
             <Button variant="ghost" size="icon" className="size-8" onClick={redo} disabled={historyIndex >= history.length - 1}>
               <Redo className="size-4" />
             </Button>
          </div>
          <Button variant="ghost" size="sm" className="gap-2">
            <Eye className="size-4" /> Visualizar
          </Button>
          <Button 
            size="sm" 
            className="gap-2 bg-primary hover:bg-primary/90 font-bold"
            onClick={handleSave}
            disabled={isSaving || saveStatus === 'saving'}
          >
            {isSaving || saveStatus === 'saving' ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
            {isSaving || saveStatus === 'saving' ? 'Salvando...' : 'Salvar'}
          </Button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* LEFT SIDEBAR - Library */}
        <ElementLibrary 
          onAddElement={handleAddElement}
          onAddSection={handleAddSection}
        />

        {/* CANVAS AREA */}
        <main className="flex-1 bg-slate-800 overflow-auto p-12 flex justify-center custom-scrollbar">
           <div 
             className={cn(
               "bg-white shadow-2xl transition-all duration-300 min-h-[800px] relative rounded-t-lg",
               viewport === 'desktop' && "w-[1200px]",
               viewport === 'tablet' && "w-[768px]",
               viewport === 'mobile' && "w-[375px]"
             )}
           >
             {/* RENDER SECTIONS HERE */}
             {data.sections.length === 0 ? (
               <div className="h-[400px] flex flex-col items-center justify-center text-slate-400 gap-4 border-2 border-dashed border-slate-200 m-8 rounded-2xl">
                 <div className="size-16 bg-slate-50 rounded-full flex items-center justify-center">
                    <Plus className="size-8 text-slate-300" />
                 </div>
                 <div className="text-center">
                    <p className="font-bold text-slate-600">Vamos começar seu projeto</p>
                    <p className="text-sm">Seu canvas está vazio. Comece criando uma seção.</p>
                 </div>
                 <div className="flex gap-2">
                   <Button variant="outline" size="sm" onClick={() => handleAddSection('custom')}>
                     + Criar primeira seção
                   </Button>
                   <Button variant="outline" size="sm">Começar com uma seção pronta</Button>
                 </div>
               </div>
             ) : (
               <div className="flex flex-col">
                 {data.sections.map((section) => {
                   return (
                     <SectionRenderer 
                       key={section.id}
                       section={section}
                       designSystem={data.design_system}
                       selectedElementId={selectedElementId}
                       isSelected={selectedSectionId === section.id}
                       onSelectElement={(id) => {
                         setSelectedElementId(id);
                         setSelectedSectionId(section.id);
                       }}
                       onSelectSection={(id) => {
                         setSelectedSectionId(id);
                         setSelectedElementId(null);
                       }}
                       onMoveSection={(id, dir) => {
                          const newData = { ...data, sections: [...data.sections] };
                          const currentIdx = newData.sections.findIndex(s => s.id === id);
                          if (currentIdx === -1) return;
                          const targetIdx = dir === 'up' ? currentIdx - 1 : currentIdx + 1;
                          if (targetIdx < 0 || targetIdx >= newData.sections.length) return;
                          
                          const temp = newData.sections[currentIdx];
                          newData.sections[currentIdx] = newData.sections[targetIdx];
                          newData.sections[targetIdx] = temp;
                          updateData(newData);
                       }}
                       onDuplicateSection={(id) => {
                          const newData = { ...data, sections: [...data.sections] };
                          const secToDup = newData.sections.find(s => s.id === id);
                          if (!secToDup) return;
                          const newSec = JSON.parse(JSON.stringify(secToDup));
                          newSec.id = generateId();
                          newSec.elements = newSec.elements.map((el: any) => ({ ...el, id: generateId() }));
                          newData.sections.push(newSec);
                          updateData(newData);
                       }}
                       onDeleteSection={(id) => {
                          const newData = { ...data, sections: data.sections.filter(s => s.id !== id) };
                          updateData(newData);
                          if (selectedSectionId === id) setSelectedSectionId(null);
                       }}
                     />
                   );
                 })}
               </div>
             )}
           </div>
        </main>

        {/* RIGHT SIDEBAR - Properties */}
        <aside className="w-80 border-l border-slate-800 bg-slate-950 flex flex-col z-40">
           <div className="h-12 border-b border-slate-800 flex items-center px-4">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Settings className="size-3 text-primary" /> Propriedades
              </h3>
           </div>
           
           <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar">
             {!selectedElementId && !selectedSectionId ? (
               <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-500">
                  <div className="size-12 bg-slate-900 rounded-2xl flex items-center justify-center mb-4 border border-slate-800">
                    <Plus className="size-6 text-slate-700" />
                  </div>
                  <p className="text-xs font-medium uppercase tracking-widest mb-2">Nada selecionado</p>
                  <p className="text-xs leading-relaxed">Selecione um elemento no canvas para editar suas propriedades.</p>
               </div>
             ) : (
               <div className="space-y-6">
                 <div>
                    <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4">Em breve: Editor de Propriedades</h4>
                    <p className="text-xs text-slate-400">Aqui você poderá editar cores, textos, links e estilos do elemento selecionado.</p>
                 </div>
               </div>
             )}
           </div>

           {/* DESIGN SYSTEM GLOBAL SETTINGS */}
           <div className="p-4 border-t border-slate-800 bg-slate-900/30">
              <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4">Estilo Global</h4>
              <div className="flex items-center gap-2 overflow-x-auto pb-2 custom-scrollbar">
                 <div className="size-8 rounded-full bg-primary ring-2 ring-white cursor-pointer" title="Marca" style={{ backgroundColor: data.design_system.colors.primary }}></div>
                 <div className="size-8 rounded-full bg-slate-500 border border-slate-700 cursor-pointer" title="Secundária" style={{ backgroundColor: data.design_system.colors.secondary }}></div>
                 <div className="size-8 rounded-full bg-emerald-500 cursor-pointer" title="Ação" style={{ backgroundColor: data.design_system.colors.accent }}></div>
                 <div className="size-8 rounded-full border border-slate-800 flex items-center justify-center cursor-pointer">
                    <Plus className="size-3 text-slate-500" />
                 </div>
              </div>
           </div>
        </aside>
      </div>

      {/* STATUS BAR */}
      <footer className="h-8 border-t border-slate-800 bg-slate-950 px-4 flex items-center justify-between text-[10px] text-slate-500 font-medium">
         <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <div className={cn("size-1.5 rounded-full", saveStatus === 'saved' ? "bg-emerald-500" : saveStatus === 'saving' ? "bg-amber-500 animate-pulse" : "bg-emerald-500")}></div>
              {saveStatus === 'saved' ? '✓ Salvo agora' : saveStatus === 'saving' ? '● Salvando...' : 'Online'}
            </span>
            <span>Projeto: {projectId}</span>
         </div>
         <div className="flex items-center gap-4">
            <span>Sections: {data.sections.length}</span>
            <span>Viewport: {viewport.toUpperCase()}</span>
         </div>
      </footer>
    </div>
  );
}
