import React from 'react';
import { Button } from '@/components/ui/button';
import { 
  Type, 
  Image as ImageIcon, 
  Square, 
  Layout, 
  MousePointer2, 
  MessageSquare, 
  List, 
  HelpCircle, 
  MapPin, 
  Share2, 
  CheckSquare,
  Smartphone,
  CreditCard,
  Briefcase
} from 'lucide-react';

interface ElementLibraryProps {
  onAddElement: (type: any) => void;
  onAddSection: (type: string) => void;
}

export function ElementLibrary({ onAddElement, onAddSection }: ElementLibraryProps) {
  const categories = [
    {
      title: "Estrutura",
      items: [
        { type: 'section', label: 'Seção', icon: <Square className="size-3" /> },
        { type: 'container', label: 'Container', icon: <Layout className="size-3" /> },
      ]
    },
    {
      title: "Conteúdo",
      items: [
        { type: 'title', label: 'Título', icon: <Type className="size-3" /> },
        { type: 'subtitle', label: 'Subtítulo', icon: <Type className="size-3" /> },
        { type: 'paragraph', label: 'Parágrafo', icon: <Type className="size-3" /> },
        { type: 'image', label: 'Imagem', icon: <ImageIcon className="size-3" /> },
      ]
    },
    {
      title: "Interação",
      items: [
        { type: 'button', label: 'Botão', icon: <MousePointer2 className="size-3" /> },
        { type: 'whatsapp', label: 'WhatsApp', icon: <Smartphone className="size-3" /> },
        { type: 'form', label: 'Formulário', icon: <CheckSquare className="size-3" /> },
      ]
    }
  ];

  const sections = [
    { type: 'hero', label: 'Hero Profissional', icon: <Layout className="size-3" /> },
    { type: 'about', label: 'Sobre Nós', icon: <Briefcase className="size-3" /> },
    { type: 'services', label: 'Nossos Serviços', icon: <CreditCard className="size-3" /> },
    { type: 'testimonials', label: 'Depoimentos', icon: <MessageSquare className="size-3" /> },
    { type: 'faq', label: 'FAQ / Dúvidas', icon: <HelpCircle className="size-3" /> },
    { type: 'contact', label: 'Contato', icon: <MapPin className="size-3" /> },
  ];

  return (
    <aside className="w-72 border-r border-slate-800 bg-slate-950 flex flex-col z-40">
      <div className="p-4 border-b border-slate-800">
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">Biblioteca</h3>
        <div className="grid grid-cols-2 gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            className="justify-start gap-2 border-slate-800 bg-slate-900/50 hover:bg-slate-800"
            onClick={() => onAddSection('custom')}
          >
            <Square className="size-3" /> Seção
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className="justify-start gap-2 border-slate-800 bg-slate-900/50 hover:bg-slate-800"
          >
            <Layout className="size-3" /> Grid
          </Button>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar">
        {categories.map((cat) => (
          <div key={cat.title}>
            <h4 className="text-[10px] font-bold text-slate-600 uppercase tracking-widest mb-3">{cat.title}</h4>
            <div className="grid grid-cols-2 gap-2">
              {cat.items.map((item) => (
                <div 
                  key={item.label} 
                  className="p-3 bg-slate-900 rounded-lg border border-slate-800 text-[11px] text-center cursor-pointer hover:border-primary/50 hover:bg-slate-800 transition-colors flex flex-col items-center gap-2 group"
                  onClick={() => onAddElement(item.type)}
                >
                  <div className="text-slate-500 group-hover:text-primary transition-colors">
                    {item.icon}
                  </div>
                  {item.label}
                </div>
              ))}
            </div>
          </div>
        ))}

        <div>
          <h4 className="text-[10px] font-bold text-slate-600 uppercase tracking-widest mb-3">Seções Prontas</h4>
          <div className="space-y-2">
            {sections.map((sec) => (
              <div 
                key={sec.label} 
                className="p-3 bg-slate-900 rounded-lg border border-slate-800 text-[11px] cursor-pointer hover:border-primary/50 hover:bg-slate-800 transition-colors flex items-center justify-between group"
                onClick={() => onAddSection(sec.type)}
              >
                <div className="flex items-center gap-2">
                  <div className="text-slate-500 group-hover:text-primary">
                    {sec.icon}
                  </div>
                  {sec.label}
                </div>
                <div className="size-4 rounded-full bg-slate-800 flex items-center justify-center text-[10px] text-slate-500 group-hover:bg-primary group-hover:text-white transition-all">
                  +
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </aside>
  );
}
