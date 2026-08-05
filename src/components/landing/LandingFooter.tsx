import { Link } from "@tanstack/react-router";
import { Sparkles, Mail } from "lucide-react";

export function LandingFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-slate-950 border-t border-slate-900 pt-20 pb-10 px-6">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12 mb-20">
        <div className="col-span-1 md:col-span-1">
          <Link to="/" className="flex items-center gap-3 mb-6">
            <span className="flex size-9 items-center justify-center rounded-full bg-gradient-brand text-primary-foreground shadow-glow">
              <Sparkles className="size-4" />
            </span>
            <span className="flex flex-col">
              <span className="text-lg font-bold tracking-tight text-white leading-tight">ScaleNexus</span>
              <span className="text-[9px] tracking-[0.2em] text-slate-400 font-medium uppercase leading-none">
                Digital Business
              </span>
            </span>
          </Link>
          <p className="text-slate-400 text-sm leading-relaxed mb-6">
            Plataforma completa para prospecção, vendas, criação de sites e gestão de projetos digitais em um único ecossistema inteligente.
          </p>
          <div className="flex gap-4">
            <a href="#" className="text-slate-500 hover:text-primary transition-colors"><Mail className="size-5" /></a>
          </div>
        </div>

        <div>
          <h4 className="text-white font-bold mb-6">Produto</h4>
          <ul className="space-y-4">
            <li><a href="#ecossistema" className="text-slate-400 hover:text-white text-sm transition-colors">Recursos</a></li>
            <li><a href="#studio" className="text-slate-400 hover:text-white text-sm transition-colors">ScaleNexus Studio</a></li>
            <li><a href="#templates" className="text-slate-400 hover:text-white text-sm transition-colors">Biblioteca de Templates</a></li>
            <li><a href="#fluxo" className="text-slate-400 hover:text-white text-sm transition-colors">Como funciona</a></li>
          </ul>
        </div>

        <div>
          <h4 className="text-white font-bold mb-6">Empresa</h4>
          <ul className="space-y-4">
            <li><a href="#" className="text-slate-400 hover:text-white text-sm transition-colors">Sobre nós</a></li>
            <li><a href="#" className="text-slate-400 hover:text-white text-sm transition-colors">Carreiras</a></li>
            <li><a href="#" className="text-slate-400 hover:text-white text-sm transition-colors">Blog</a></li>
            <li><a href="#" className="text-slate-400 hover:text-white text-sm transition-colors">Novidades</a></li>
          </ul>
        </div>

        <div>
          <h4 className="text-white font-bold mb-6">Suporte</h4>
          <ul className="space-y-4">
            <li><a href="#" className="text-slate-400 hover:text-white text-sm transition-colors">Central de Ajuda</a></li>
            <li><a href="#" className="text-slate-400 hover:text-white text-sm transition-colors">Documentação</a></li>
            <li><a href="#" className="text-slate-400 hover:text-white text-sm transition-colors">Termos de Uso</a></li>
            <li><a href="#" className="text-slate-400 hover:text-white text-sm transition-colors">Privacidade</a></li>
          </ul>
        </div>
      </div>

      <div className="max-w-7xl mx-auto border-t border-slate-900 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
        <p className="text-slate-500 text-xs">
          © {currentYear} ScaleNexus Digital Business. Todos os direitos reservados.
        </p>
        <div className="flex gap-6">
          <a href="#" className="text-slate-500 hover:text-white text-xs transition-colors">Termos</a>
          <a href="#" className="text-slate-500 hover:text-white text-xs transition-colors">Privacidade</a>
          <a href="#" className="text-slate-500 hover:text-white text-xs transition-colors">Cookies</a>
        </div>
      </div>
    </footer>
  );
}
