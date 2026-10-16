import { createFileRoute, Link, useParams, redirect } from '@tanstack/react-router';
import { supabase } from '@/integrations/supabase/client';
import { getCurrentRoles } from '@/lib/guard';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
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
  ChevronDown,
  Brain, 
  Info,
  Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useStudioData, useSaveStudioData } from '@/lib/studio/hooks';
import { StudioData, StudioSection, StudioElement, Viewport } from '@/types/studio';
import { LibraryPanel } from '@/components/studio/LibraryPanel';
import { SectionRenderer } from '@/components/studio/SectionRenderer';
import { PropertyPanel } from '@/components/studio/PropertyPanel';
import { PublishSiteButton } from '@/components/studio/PublishSiteButton';
import { AICorePanel } from '@/components/AICorePanel';
import { ForgePanel } from '@/components/ForgePanel';
import { generateId } from '@/lib/studio/utils';
import { SECTION_TEMPLATES } from '@/lib/studio/templates';
import { buildProjectContext, generateIntelligence, AIAction } from '@/lib/ai-core';
import { createBuildPlan, ForgeBuildPlan } from '@/lib/forge';
import { getBriefing } from '@/lib/briefing';
import { getSitePlan } from '@/lib/planner';
import { useQuery } from '@tanstack/react-query';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';


export const Route = createFileRoute('/_authenticated/studio/$projectId')({
  validateSearch: (search: Record<string, unknown>): { publicar?: boolean } =>
    search['publicar'] === true || search['publicar'] === '1' || search['publicar'] === 1 ? { publicar: true } : {},
  beforeLoad: async ({ params }) => {
    const roles = await getCurrentRoles();
    if (roles.includes('admin')) return;
    const fallback = roles.includes('cliente') && !roles.includes('vendedor') ? '/cliente' : '/painel';
    if (!roles.includes('criador')) throw redirect({ to: fallback, replace: true });
    const { data: userData } = await supabase.auth.getUser();
    const { data: project } = await supabase
      .from('projects')
      .select('creator_id')
      .eq('id', params.projectId)
      .maybeSingle();
    if (!project || project.creator_id !== userData.user?.id) {
      throw redirect({ to: '/meus-projetos', replace: true });
    }
  },
  component: ScaleNexusStudioPage,
  head: () => ({
    meta: [{ title: 'ScaleNexus Studio — Editor Visual' }],
  }),
});

function ScaleNexusStudioPage() {
  const { projectId } = useParams({ from: '/_authenticated/studio/$projectId' });
  const { publicar } = Route.useSearch();
  const { data: initialData, isLoading } = useStudioData(projectId);
  const saveMutation = useSaveStudioData();
  
  const [data, setData] = useState<StudioData | null>(null);
  const [viewport, setViewport] = useState<Viewport>('desktop');
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [history, setHistory] = useState<StudioData[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [isPreview, setIsPreview] = useState(false);
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [ignoredIssues, setIgnoredIssues] = useState<string[]>([]);
  const [forgePlan, setForgePlan] = useState<ForgeBuildPlan | null>(null);
  const [isBuildingWithForge, setIsBuildingWithForge] = useState(false);
  const [forgeStepIndex, setForgeStepIndex] = useState(-1);

  const { data: briefing } = useQuery({
    queryKey: ['briefing', projectId],
    queryFn: () => getBriefing(projectId)
  });

  const { data: sitePlan } = useQuery({
    queryKey: ['site-plan', projectId],
    queryFn: () => getSitePlan(projectId)
  });

  const intelligence = useMemo(() => {
    const context = buildProjectContext(projectId, briefing || null, sitePlan || null, data);
    const result = generateIntelligence(context, data);
    return {
      ...result,
      issues: result.issues.filter(i => !ignoredIssues.includes(i.id))
    };
  }, [projectId, briefing, sitePlan, data, ignoredIssues]);

  // Initial Forge Plan Generation
  useEffect(() => {
    if (briefing && sitePlan && !forgePlan) {
      const context = buildProjectContext(projectId, briefing, sitePlan, data);
      const plan = createBuildPlan(context);
      setForgePlan(plan);
    }
  }, [briefing, sitePlan, projectId, data, forgePlan]);

  const runForgeBuild = async (plan: ForgeBuildPlan) => {
    if (!data) return;
    setIsBuildingWithForge(true);
    setForgeStepIndex(0);

    const activeSections = plan?.sections?.filter(s => s.recommended) || [];
    
    // Execute actions one by one with a small delay for visual feedback
    for (let i = 0; i < activeSections.length; i++) {
      setForgeStepIndex(i);
      const section = activeSections[i];
      if (section) {
        await new Promise(resolve => setTimeout(resolve, 800));
        handleAIAction(section.action);
      }
    }

    // After Forge Build, run AI Core Analysis automatically
    await new Promise(resolve => setTimeout(resolve, 500));
    // Trigger analysis update through state sync logic already in place via intelligence useMemo

    setIsBuildingWithForge(false);
    setForgeStepIndex(-1);
  };


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
    setHistoryIndex(prev => prev + 1);
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

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        if (e.shiftKey) {
          redo();
        } else {
          undo();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo]);


  const handleAddElement = (type: StudioElement['type']) => {
    if (!data) return;
    const sections: StudioSection[] = JSON.parse(JSON.stringify(data.sections));
    const targetSectionId = selectedSectionId || (sections.length > 0 ? sections[0]?.id || null : null);
    if (!targetSectionId) return;

    const sectionIndex = sections.findIndex(s => s.id === targetSectionId);
    if (sectionIndex === -1) return;

    const newElement: StudioElement = {
      id: generateId(),
      type,
      content: { text: type.charAt(0).toUpperCase() + type.slice(1) },
      styles: {}
    };

    const targetSection = sections[sectionIndex];
    if (!targetSection) return;

    sections[sectionIndex] = {
      ...targetSection,
      elements: [...targetSection.elements, newElement]
    };
    
    updateData({ ...data, sections });
    setSelectedElementId(newElement.id);
  };

  const handleAddSection = (type: string) => {
    if (!data) return;
    const sections: StudioSection[] = JSON.parse(JSON.stringify(data.sections));
    
    let newSection: StudioSection;
    
    if (SECTION_TEMPLATES[type]) {
      const template = JSON.parse(JSON.stringify(SECTION_TEMPLATES[type]));
      newSection = {
        ...template,
        id: generateId(),
        elements: (template.elements || []).map((el: any) => ({ ...el, id: generateId() })),
        order: sections.length
      } as StudioSection;
    } else {
      newSection = {
        id: generateId(),
        type,
        elements: [],
        styles: {},
        order: sections.length
      };
    }
    
    sections.push(newSection);
    updateData({ ...data, sections });
    setSelectedSectionId(newSection.id);
  };



  const handleUpdateElement = (id: string, updates: Partial<StudioElement>) => {
    if (!data) return;
    const sections = data.sections.map(s => ({
      ...s,
      elements: s.elements.map(el => el.id === id ? { ...el, ...updates } : el)
    }));
    updateData({ ...data, sections });
  };

  const handleUpdateSection = (id: string, updates: Partial<StudioSection>) => {
    if (!data) return;
    const sections = data.sections.map(s => s.id === id ? { ...s, ...updates } : s);
    updateData({ ...data, sections });
  };

  const handleUpdateDesignSystem = (updates: Partial<StudioData['design_system']>) => {
    if (!data) return;
    updateData({ ...data, design_system: { ...data.design_system, ...updates } });
  };

  const handleAIAction = useCallback((action: AIAction) => {
    if (!data) return;
    const clonedData: StudioData = JSON.parse(JSON.stringify(data));
    
    // Safety Layer check - no non-studio modifications allowed
    if (['FINANCEIRO', 'CRM', 'RLS'].some(term => action.explanation.toUpperCase().includes(term))) {
      console.error('Action blocked by AI Safety Layer');
      return;
    }

    try {
      switch (action.type) {
        case 'ADD_SECTION': {
          const type = action.payload.type;
          let newSection: StudioSection;
          if (SECTION_TEMPLATES[type]) {
            const template = JSON.parse(JSON.stringify(SECTION_TEMPLATES[type]));
            newSection = {
              ...template,
              id: generateId(),
              elements: (template.elements || []).map((el: any) => ({ ...el, id: generateId() })),
              order: clonedData.sections.length
            } as StudioSection;
          } else {
            newSection = {
              id: generateId(),
              type: type || 'custom',
              elements: [],
              styles: {},
              order: clonedData.sections.length
            };
          }
          clonedData.sections.push(newSection);
          setSelectedSectionId(newSection.id);
          break;
        }

        case 'ADD_ELEMENT': {
          const { type, content, styles } = action.payload;
          const firstSection = clonedData.sections?.[0];
          const targetSectionId = action.targetId || (firstSection ? firstSection.id : null);
          if (!targetSectionId || !clonedData.sections) throw new Error('No target section');
          
          const sectionIdx = clonedData.sections.findIndex(s => s.id === targetSectionId);
          if (sectionIdx === -1 || !clonedData.sections[sectionIdx]) throw new Error('Target section not found');

          const newElement: StudioElement = {
            id: generateId(),
            type,
            content: content || { text: 'New Element' },
            styles: styles || {}
          };
          clonedData.sections[sectionIdx].elements.push(newElement);
          setSelectedElementId(newElement.id);
          break;
        }

        case 'UPDATE_TEXT': {
          // Find first matching element to apply suggestion or use targetId
          const suggestion = action.payload.suggestion;
          let elementFound = false;
          clonedData.sections.forEach(s => {
            s.elements.forEach(el => {
              if (!elementFound && (el.type === 'title' || el.type === 'subtitle' || el.type === 'paragraph')) {
                if (!action.targetId || el.id === action.targetId) {
                  el.content.text = suggestion;
                  elementFound = true;
                }
              }
            });
          });
          break;
        }

        case 'UPDATE_CTA': {
          const { text, type } = action.payload;
          clonedData.sections.forEach(s => {
            s.elements.forEach(el => {
              if (el.type === 'button' || el.type === 'whatsapp') {
                if (!action.targetId || el.id === action.targetId) {
                  el.content.text = text;
                  if (type) el.type = type;
                }
              }
            });
          });
          break;
        }

        default:
          console.warn('Action type not yet implemented in V1.2:', action.type);
          return;
      }

      updateData(clonedData);
      // Small toast or visual feedback could go here
    } catch (error) {
      console.error('AI Action failed:', error);
    }
  }, [data, updateData]);

  if (isLoading || !data) {
    return (
      <div className="h-screen w-screen bg-slate-950 flex flex-col items-center justify-center gap-4 text-white">
        <Loader2 className="size-10 animate-spin text-primary" />
        <p className="animate-pulse font-medium">Carregando ScaleNexus Studio...</p>
      </div>
    );
  }


  const selectedElement = data.sections.flatMap(s => s.elements).find(el => el.id === selectedElementId) || null;
  const selectedSection = data.sections.find(s => s.id === selectedSectionId) || null;

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
            <span className="text-xs font-bold text-slate-500 uppercase tracking-widest block leading-none mb-1">ScaleNexus STUDIO</span>
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
          <div className="h-4 w-px bg-slate-800 mx-1" />
          
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="sm" className="gap-2 text-brand-400 hover:text-brand-300 hover:bg-brand-500/10">
                <Sparkles className="size-4" /> Forge AI
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[450px] p-0 bg-slate-950 border-slate-800 shadow-2xl mr-4 overflow-hidden" align="end" sideOffset={12}>
              <Tabs defaultValue="forge" className="w-full">
                <div className="px-4 pt-4 border-b border-slate-800">
                  <TabsList className="bg-slate-900 border-slate-800">
                    <TabsTrigger value="forge" className="gap-2">
                      <Sparkles className="size-3" /> Forge
                    </TabsTrigger>
                    <TabsTrigger value="intelligence" className="gap-2">
                      <Brain className="size-3" /> AI Core
                    </TabsTrigger>
                  </TabsList>
                </div>
                <TabsContent value="forge" className="m-0 max-h-[600px] overflow-y-auto custom-scrollbar">
                  {forgePlan && (
                    <ForgePanel 
                      context={buildProjectContext(projectId, briefing || null, sitePlan || null, data)}
                      plan={forgePlan}
                      onUpdatePlan={setForgePlan}
                      onStartBuild={runForgeBuild}
                      isBuilding={isBuildingWithForge}
                      currentStepIndex={forgeStepIndex}
                    />
                  )}
                </TabsContent>
                <TabsContent value="intelligence" className="m-0 max-h-[600px] overflow-y-auto custom-scrollbar p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold flex items-center gap-2 text-sm">
                      <Brain className="size-4 text-brand-400" /> AI Core V1.2
                    </h3>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-brand-500/10 text-brand-400 uppercase tracking-tighter">ATIVO</span>
                  </div>
                  <AICorePanel 
                    intelligence={intelligence} 
                    onAccept={handleAIAction}
                    onIgnore={(id) => setIgnoredIssues(prev => [...prev, id])}
                    onUndoLast={undo}
                    history={history}
                  />
                </TabsContent>
              </Tabs>
            </PopoverContent>
          </Popover>

          <Button variant={isPreview ? "secondary" : "ghost"} size="sm" className="gap-2" onClick={() => setIsPreview(!isPreview)}>
            <Eye className="size-4" /> {isPreview ? 'Editar' : 'Preview do rascunho'}
          </Button>

          <PublishSiteButton
            projectId={projectId}
            defaultName={(briefing as any)?.company_name || 'meu-site'}
            autoOpen={!!publicar && !!data}
            onSaveBeforePublish={async () => {
              if (!data) throw new Error('Nada para publicar');
              await saveMutation.mutateAsync({ projectId, data });
            }}
          />

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
        {!isPreview && (
          <LibraryPanel 
            onAddElement={handleAddElement}
            onAddSection={(sec) => {
              if (!data) return;
              const sections = [...data.sections, { ...sec, id: generateId(), order: data.sections.length }];
              updateData({ ...data, sections });
            }}
            onApplyTemplate={(templateData) => {
              updateData(templateData as StudioData);
            }}
            hasContent={data.sections.length > 0}
            projectId={projectId}

            onUpdateDesignSystem={handleUpdateDesignSystem}
            designSystem={data.design_system}
          />
        )}



        {/* CANVAS AREA */}
        <main className={cn("flex-1 bg-slate-800 overflow-auto flex justify-center custom-scrollbar", !isPreview ? "p-12" : "p-0")}>

           <div 
             className={cn(
               "bg-white transition-all duration-300 min-h-[800px] relative",
               !isPreview && "shadow-2xl rounded-t-lg",

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
                       selectedElementId={isPreview ? null : selectedElementId}
                       isSelected={!isPreview && selectedSectionId === section.id}
                       onSelectElement={(id) => {
                         if (isPreview) return;
                         setSelectedElementId(id);
                         setSelectedSectionId(section.id);
                       }}
                       onSelectSection={(id) => {
                         if (isPreview) return;
                         setSelectedSectionId(id);
                         setSelectedElementId(null);
                       }}

                       onMoveSection={(id, dir) => {
                          if (!data) return;
                          const sections: StudioSection[] = JSON.parse(JSON.stringify(data.sections));
                          const idx = sections.findIndex(s => s.id === id);
                          if (idx === -1) return;
                          const targetIdx = dir === 'up' ? idx - 1 : idx + 1;
                          if (targetIdx < 0 || targetIdx >= sections.length) return;
                          
                          const sectionA = sections[idx];
                          const sectionB = sections[targetIdx];
                          if (sectionA && sectionB) {
                            sections[idx] = sectionB;
                            sections[targetIdx] = sectionA;
                            updateData({ ...data, sections });
                          }

                       }}
                       onDuplicateSection={(id) => {
                          if (!data) return;
                          const sections: StudioSection[] = JSON.parse(JSON.stringify(data.sections));
                          const secToDup = sections.find(s => s.id === id);
                          if (!secToDup) return;
                          const newSec = JSON.parse(JSON.stringify(secToDup));
                          newSec.id = generateId();
                          newSec.elements = newSec.elements.map((el: any) => ({ ...el, id: generateId() }));
                          sections.push(newSec);
                          updateData({ ...data, sections });
                       }}
                       onDeleteSection={(id) => setPendingDeleteId(id)}

                     />
                   );
                 })}
               </div>
             )}
           </div>
        </main>

        {/* RIGHT SIDEBAR - Properties */}
        {!isPreview && (
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
               <PropertyPanel 
                 element={selectedElement}
                 section={selectedSection}
                 designSystem={data.design_system}
                 onUpdateElement={handleUpdateElement}
                 projectId={projectId}
                 onUpdateSection={handleUpdateSection}
                 onUpdateDesignSystem={handleUpdateDesignSystem}
               />
             )}
           </div>

           {/* DESIGN SYSTEM GLOBAL SETTINGS */}
           <div className="p-4 border-t border-slate-800 bg-slate-900/30">
              <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4">Estilo Global</h4>
              <div className="flex items-center gap-2 overflow-x-auto pb-2 custom-scrollbar">
                 <div className="size-8 rounded-full ring-2 ring-white cursor-pointer" title="Marca" style={{ backgroundColor: data.design_system.colors.primary }}></div>
                 <div className="size-8 rounded-full border border-slate-700 cursor-pointer" title="Secundária" style={{ backgroundColor: data.design_system.colors.secondary }}></div>
                 <div className="size-8 rounded-full cursor-pointer" title="Ação" style={{ backgroundColor: data.design_system.colors.accent }}></div>
                 <div className="size-8 rounded-full border border-slate-800 flex items-center justify-center cursor-pointer">
                    <Plus className="size-3 text-slate-500" />
                 </div>
              </div>
           </div>
          </aside>
        )}

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
      <AlertDialog open={!!pendingDeleteId} onOpenChange={(o) => { if (!o) setPendingDeleteId(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir seção?</AlertDialogTitle>
            <AlertDialogDescription>Esta seção será removida do rascunho do site.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                const id = pendingDeleteId;
                setPendingDeleteId(null);
                if (!data || !id) return;
                const sections = data.sections.filter(s => s.id !== id);
                updateData({ ...data, sections });
                if (selectedSectionId === id) setSelectedSectionId(null);
              }}
            >
              Excluir seção
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
