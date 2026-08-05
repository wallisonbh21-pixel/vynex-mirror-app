import { createFileRoute, Link, useParams } from '@tanstack/react-router';
import { useState, useEffect, useCallback } from 'react';
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
  Layers,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Trash2,
  Copy,
  ChevronUp,
  ChevronDown
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useStudioData, useSaveStudioData } from '@/lib/studio/hooks';
import { StudioData, StudioSection, StudioElement } from '@/types/studio';
import { toast } from 'sonner';

export const Route = createFileRoute('/_authenticated/studio/$projectId')({
  component: VynexaStudioPage,
  head: () => ({
    meta: [{ title: 'VYNEXA Studio — Editor Visual' }],
  }),
});

type Viewport = 'desktop' | 'tablet' | 'mobile';

function VynexaStudioPage() {
  const { projectId } = useParams({ from: '/_authenticated/studio/$projectId' });
  const { data: initialData, isLoading } = useStudioData(projectId);
  const saveMutation = useSaveStudioData();
  
  const [data, setData] = useState<StudioData | null>(null);
  const [viewport, setViewport] = useState<Viewport>('desktop');
  const [selectedElement, setSelectedElement] = useState<string | null>(null);
  const [selectedSection, setSelectedSection] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [history, setHistory] = useState<StudioData[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  // Sync with initial data
  useEffect(() => {
    if (initialData && !data) {
      setData(initialData);
    }
  }, [initialData, data]);

  // History Management
  const addToHistory = useCallback((newData: StudioData) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(JSON.parse(JSON.stringify(newData)));
    if (newHistory.length > 50) newHistory.shift();
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  }, [history, historyIndex]);

  const undo = () => {
    if (historyIndex > 0) {
      const prev = history[historyIndex - 1];
      setData(prev);
      setHistoryIndex(historyIndex - 1);
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      const next = history[historyIndex + 1];
      setData(next);
      setHistoryIndex(historyIndex + 1);
    }
  };

  const handleSave = async () => {
    if (!data) return;
    setIsSaving(true);
    try {
      await saveMutation.mutateAsync({ projectId, data });
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

  return (
    <div className="h-screen w-screen bg-slate-900 flex flex-col overflow-hidden text-slate-200">
      {/* TOOLBAR */}
      <header className="h-14 border-b border-slate-800 bg-slate-950 px-4 flex items-center justify-between z-50">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild className="text-slate-400 hover:text-white">
            <Link to="/projetos/$projectId" params={{ projectId }}>
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
            disabled={isSaving}
          >
            {isSaving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
            {isSaving ? 'Salvando...' : 'Salvar'}
          </Button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* LEFT SIDEBAR - Library */}
        <aside className="w-72 border-r border-slate-800 bg-slate-950 flex flex-col z-40">
          <div className="p-4 border-b border-slate-800">
             <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">Biblioteca</h3>
             <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" size="sm" className="justify-start gap-2 border-slate-800 bg-slate-900/50 hover:bg-slate-800">
                  <Plus className="size-3" /> Seção
                </Button>
                <Button variant="outline" size="sm" className="justify-start gap-2 border-slate-800 bg-slate-900/50 hover:bg-slate-800">
                  <Layers className="size-3" /> Grid
                </Button>
             </div>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar">
             <div>
               <h4 className="text-[10px] font-bold text-slate-600 uppercase tracking-widest mb-3">Elementos Básicos</h4>
               <div className="grid grid-cols-2 gap-2">
                  {['Texto', 'Título', 'Imagem', 'Botão', 'Ícone', 'Espaço'].map(el => (
                    <div key={el} className="p-3 bg-slate-900 rounded-lg border border-slate-800 text-xs text-center cursor-move hover:border-primary/50 hover:bg-slate-800 transition-colors">
                      {el}
                    </div>
                  ))}
               </div>
             </div>
             <div>
               <h4 className="text-[10px] font-bold text-slate-600 uppercase tracking-widest mb-3">Seções Prontas</h4>
               <div className="space-y-2">
                  {['Hero Profissional', 'Sobre Nós', 'Nossos Serviços', 'Depoimentos', 'FAQ'].map(sec => (
                    <div key={sec} className="p-3 bg-slate-900 rounded-lg border border-slate-800 text-xs cursor-move hover:border-primary/50 hover:bg-slate-800 transition-colors flex items-center justify-between group">
                      {sec}
                      <Plus className="size-3 text-slate-600 group-hover:text-primary" />
                    </div>
                  ))}
               </div>
             </div>
          </div>
        </aside>

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
                    <p className="font-bold text-slate-600">Seu canvas está vazio</p>
                    <p className="text-sm">Arraste elementos da biblioteca para começar.</p>
                 </div>
                 <Button variant="outline" size="sm" className="mt-2">Ver Templates</Button>
               </div>
             ) : (
               data.sections.map((section, idx) => (
                 <div key={section.id} className="group relative border-b last:border-b-0 min-h-20">
                    {/* Section controls */}
                    <div className="absolute right-[-60px] top-0 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                       <Button variant="secondary" size="icon" className="size-8 rounded-lg shadow-lg"><ChevronUp className="size-4" /></Button>
                       <Button variant="secondary" size="icon" className="size-8 rounded-lg shadow-lg"><ChevronDown className="size-4" /></Button>
                       <Button variant="secondary" size="icon" className="size-8 rounded-lg shadow-lg"><Copy className="size-4" /></Button>
                       <Button variant="destructive" size="icon" className="size-8 rounded-lg shadow-lg"><Trash2 className="size-4" /></Button>
                    </div>
                    {/* Section content */}
                    <div className="p-10 text-slate-900">
                      #{idx + 1} {section.type}
                    </div>
                 </div>
               ))
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
             {!selectedElement ? (
               <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-500">
                  <div className="size-12 bg-slate-900 rounded-2xl flex items-center justify-center mb-4 border border-slate-800">
                    <Plus className="size-6 text-slate-700" />
                  </div>
                  <p className="text-xs font-medium uppercase tracking-widest mb-2">Nada selecionado</p>
                  <p className="text-xs leading-relaxed">Selecione um elemento no canvas para editar suas propriedades.</p>
               </div>
             ) : (
               <div className="space-y-6">
                 {/* Property groups will go here */}
                 <div>
                    <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4">Dimensões</h4>
                    {/* Form controls */}
                 </div>
               </div>
             )}
           </div>

           {/* DESIGN SYSTEM GLOBAL SETTINGS */}
           <div className="p-4 border-t border-slate-800 bg-slate-900/30">
              <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4">Estilo Global</h4>
              <div className="flex items-center gap-2 overflow-x-auto pb-2 custom-scrollbar">
                 <div className="size-8 rounded-full bg-primary ring-2 ring-white cursor-pointer" title="Marca"></div>
                 <div className="size-8 rounded-full bg-slate-500 border border-slate-700 cursor-pointer" title="Secundária"></div>
                 <div className="size-8 rounded-full bg-emerald-500 cursor-pointer" title="Ação"></div>
                 <div className="size-8 rounded-full border border-slate-700 flex items-center justify-center cursor-pointer">
                    <Plus className="size-3 text-slate-500" />
                 </div>
              </div>
           </div>
        </aside>
      </div>

      {/* STATUS BAR */}
      <footer className="h-8 border-t border-slate-800 bg-slate-950 px-4 flex items-center justify-between text-[10px] text-slate-500 font-medium">
         <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5"><div className="size-1.5 rounded-full bg-emerald-500"></div> Online</span>
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
