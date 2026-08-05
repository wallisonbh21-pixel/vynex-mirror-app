import { Link } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import { Palette, Box, Layout, Monitor } from 'lucide-react';

export default function Index() {
  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl text-center">
        <div className="size-16 bg-primary/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <Palette className="size-8 text-primary" />
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">VYNEXA Studio V2</h1>
        <p className="text-slate-400 mb-8 leading-relaxed">
          Sua plataforma profissional de criação de sites agora com biblioteca premium e design system global.
        </p>
        
        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800">
            <Monitor className="size-5 text-slate-500 mx-auto mb-2" />
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Templates</span>
          </div>
          <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800">
            <Layout className="size-5 text-slate-500 mx-auto mb-2" />
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Seções</span>
          </div>
        </div>

        <Button asChild className="w-full bg-primary hover:bg-primary/90 font-bold h-12 rounded-xl">
          <Link to="/prospeccao">Começar Projeto</Link>
        </Button>
      </div>
    </div>
  );
}
