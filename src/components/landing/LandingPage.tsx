import { LandingHeader } from "@/components/landing/LandingHeader";
import { LandingFooter } from "@/components/landing/LandingFooter";
import { Button } from "@/components/ui/button";
import { Link } from "@tanstack/react-router";
import { ArrowRight, CheckCircle2, ChevronRight, Zap, Target, Palette, BrainCircuit, LayoutGrid, BarChart3, ShieldCheck, Gauge } from "lucide-react";

export function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-primary/30">
      <LandingHeader />

      {/* Hero */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-halo opacity-50" />
        <div className="max-w-5xl mx-auto px-6 text-center relative z-10">
          <h1 className="text-5xl md:text-7xl font-bold mb-6 tracking-tight">
            Transforme negócios em <span className="text-gradient-brand">crescimento digital.</span>
          </h1>
          <p className="text-lg md:text-xl text-slate-400 mb-10 max-w-2xl mx-auto leading-relaxed">
            A ScaleNexus conecta prospecção, vendas, criação de sites e gestão em uma única plataforma inteligente.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild className="h-14 px-8 rounded-xl font-bold bg-primary hover:bg-primary/90 text-primary-foreground shadow-glow">
              <Link to="/auth">🚀 Começar agora</Link>
            </Button>
            <Button variant="ghost" className="h-14 px-8 rounded-xl font-bold text-slate-300 hover:text-white border border-slate-800 hover:bg-slate-900">
              ▶ Conhecer a ScaleNexus
            </Button>
          </div>
        </div>
      </section>

      {/* Ecossistema */}
      <section id="ecossistema" className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-16">Um ecossistema completo para fazer negócios crescerem.</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: Search, title: "Central de Prospecção", desc: "Encontre novas oportunidades comerciais." },
              { icon: Target, title: "CRM", desc: "Organize leads, propostas e vendas." },
              { icon: Palette, title: "ScaleNexus Studio", desc: "Crie sites profissionais dentro da plataforma." },
              { icon: BrainCircuit, title: "Briefing Inteligente", desc: "Entenda o negócio antes de começar a criação." },
              { icon: LayoutGrid, title: "Site Planner", desc: "Planeje a estrutura estratégica do site." },
              { icon: Gauge, title: "Gestão de Projetos", desc: "Acompanhe cada projeto do início à entrega." },
              { icon: BarChart3, title: "Gestão Financeira", desc: "Controle comissões, saques e resultados." },
              { icon: Zap, title: "Inteligência ScaleNexus", desc: "Prepare-se para a próxima geração de criação inteligente." },
            ].map((item, i) => (
              <div key={i} className="p-6 rounded-2xl bg-card border border-border hover:border-primary/50 transition-all shadow-panel hover:shadow-glow">
                <item.icon className="size-8 text-primary mb-4" />
                <h3 className="font-bold text-lg mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <LandingFooter />
    </div>
  );
}
