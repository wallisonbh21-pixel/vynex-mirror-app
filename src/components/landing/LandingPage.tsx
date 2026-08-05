import { LandingHeader } from "@/components/landing/LandingHeader";
import { LandingFooter } from "@/components/landing/LandingFooter";
import { Button } from "@/components/ui/button";
import { Link } from "@tanstack/react-router";
import { ArrowRight, CheckCircle2, ChevronRight, Zap, Target, Palette, BrainCircuit, LayoutGrid, BarChart3, ShieldCheck, Gauge, Search } from "lucide-react";

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

      {/* Fluxo Completo */}
      <section id="fluxo" className="py-20 px-6 bg-slate-900/30">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-16">Do primeiro contato à entrega.</h2>
          <div className="flex flex-wrap justify-center gap-4">
            {[
              { id: "01", icon: "🔎", label: "Prospecção" },
              { id: "02", icon: "💬", label: "Lead" },
              { id: "03", icon: "💼", label: "Venda" },
              { id: "04", icon: "📋", label: "Projeto" },
              { id: "05", icon: "🧠", label: "Briefing" },
              { id: "06", icon: "📐", label: "Planejamento" },
              { id: "07", icon: "🎨", label: "Criação" },
              { id: "08", icon: "👤", label: "Aprovação" },
              { id: "09", icon: "🚀", label: "Entrega" },
            ].map((step, i, arr) => (
              <div key={step.id} className="flex items-center">
                <div className="flex flex-col items-center gap-2 group">
                  <div className="size-14 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-xl shadow-panel group-hover:border-primary/50 transition-all">
                    {step.icon}
                  </div>
                  <div className="text-center">
                    <span className="block text-[10px] text-primary font-bold">{step.id}</span>
                    <span className="text-sm font-medium text-slate-300">{step.label}</span>
                  </div>
                </div>
                {i < arr.length - 1 && (
                  <ChevronRight className="size-4 text-slate-700 mx-2 hidden lg:block" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ScaleNexus Studio */}
      <section id="studio" className="py-20 px-6">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl md:text-5xl font-bold mb-6">Crie experiências digitais profissionais.</h2>
            <div className="grid grid-cols-2 gap-4 mb-8">
              {[
                "Templates", "Seções", "Elementos", "Design System", 
                "Responsividade", "Biblioteca", "Edição Visual", "Preview"
              ].map(feat => (
                <div key={feat} className="flex items-center gap-2 text-slate-300">
                  <CheckCircle2 className="size-4 text-primary" />
                  <span className="text-sm font-medium">{feat}</span>
                </div>
              ))}
            </div>
            <Button asChild className="h-12 px-8 rounded-xl font-bold">
              <Link to="/auth">Conhecer o Studio</Link>
            </Button>
          </div>
          <div className="relative rounded-2xl border border-slate-800 bg-slate-900 overflow-hidden shadow-2xl group">
            <img 
              src="https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1200&q=80" 
              alt="ScaleNexus Studio Preview" 
              className="w-full opacity-80 group-hover:scale-105 transition-transform duration-700"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 to-transparent" />
          </div>
        </div>
      </section>

      {/* Inteligência */}
      <section className="py-20 px-6 bg-slate-900/30">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">Antes de criar, a ScaleNexus entende.</h2>
          <div className="grid md:grid-cols-2 gap-12 mt-16 text-left">
            <div className="space-y-4">
              <div className="size-12 rounded-xl bg-primary/20 flex items-center justify-center">
                <BrainCircuit className="size-6 text-primary" />
              </div>
              <h3 className="text-2xl font-bold italic">Briefing Inteligente</h3>
              <p className="text-slate-400 leading-relaxed">
                Transforme informações do negócio em dados estruturados. O primeiro passo para uma estratégia de sucesso.
              </p>
            </div>
            <div className="space-y-4">
              <div className="size-12 rounded-xl bg-accent/20 flex items-center justify-center">
                <LayoutGrid className="size-6 text-accent" />
              </div>
              <h3 className="text-2xl font-bold italic">Site Planner</h3>
              <p className="text-slate-400 leading-relaxed">
                Transforme o briefing em uma estrutura estratégica de site. Planejamento visual antes de qualquer linha de código.
              </p>
            </div>
          </div>
          <div className="mt-16 flex items-center justify-center gap-2 md:gap-4 flex-wrap text-[10px] md:text-xs font-bold uppercase tracking-widest text-slate-500">
            <span>Briefing</span>
            <ArrowRight className="size-3" />
            <span>Estratégia</span>
            <ArrowRight className="size-3" />
            <span>Estrutura</span>
            <ArrowRight className="size-3" />
            <span>Design</span>
            <ArrowRight className="size-3" />
            <span>Aprovação</span>
            <ArrowRight className="size-3" />
            <span>Entrega</span>
          </div>
        </div>
      </section>

      {/* Para quem é */}
      <section id="publico" className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-16">Uma plataforma. Diferentes profissionais.</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { role: "Vendedor", desc: "Encontre oportunidades, gerencie leads e feche negócios.", icon: Target },
              { role: "Criador", desc: "Produza sites profissionais dentro da ScaleNexus.", icon: Palette },
              { role: "Cliente", desc: "Acompanhe, revise e aprove seu projeto.", icon: ShieldCheck },
            ].map(item => (
              <div key={item.role} className="p-8 rounded-3xl bg-slate-900/50 border border-slate-800 text-center">
                <item.icon className="size-10 text-primary mx-auto mb-6" />
                <h3 className="text-xl font-bold mb-3">{item.role}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
          <p className="text-center mt-12 text-slate-500 text-sm font-medium italic">
            🚀 Futuramente: Gestor de Tráfego
          </p>
        </div>
      </section>

      {/* Diferenciais */}
      <section className="py-20 px-6 bg-primary/5">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-16">Por que ScaleNexus?</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { title: "Tudo em um só lugar", icon: Zap },
              { title: "Criação profissional", icon: Palette },
              { title: "Inteligência orientada ao negócio", icon: BrainCircuit },
              { title: "Gestão completa", icon: BarChart3 },
              { title: "Segurança e controle", icon: ShieldCheck },
              { title: "Estrutura preparada para escala", icon: Gauge },
            ].map(diff => (
              <div key={diff.title} className="flex items-center gap-4">
                <div className="size-10 rounded-lg bg-slate-900 flex items-center justify-center border border-slate-800">
                  <diff.icon className="size-5 text-primary" />
                </div>
                <span className="font-bold">{diff.title}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Templates */}
      <section id="templates" className="py-20 px-6 overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-6">Qualidade de nível mundial.</h2>
          <p className="text-slate-400 text-center mb-16 max-w-2xl mx-auto">
            Explore nossa biblioteca de templates profissionais desenvolvidos para alta conversão em diversos nichos.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "🍔 Hamburgueria", img: "https://images.unsplash.com/photo-1571091718767-18b5b1457add?auto=format&fit=crop&w=600&q=80" },
              { label: "🍕 Pizzaria", img: "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=600&q=80" },
              { label: "💪 Academia", img: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=600&q=80" },
              { label: "💈 Barbearia", img: "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=600&q=80" },
              { label: "🦷 Dentista", img: "https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&w=600&q=80" },
              { label: "⚖️ Advocacia", img: "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=600&q=80" },
              { label: "🏠 Imobiliária", img: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=600&q=80" },
              { label: "📸 Fotografia", img: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=600&q=80" },
            ].map(t => (
              <div key={t.label} className="group relative rounded-xl overflow-hidden aspect-[4/3] border border-slate-800">
                <img src={t.img} alt={t.label} className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 to-transparent opacity-60" />
                <div className="absolute bottom-3 left-3">
                  <span className="text-xs font-bold text-white uppercase tracking-wider">{t.label}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-32 px-6">
        <div className="max-w-5xl mx-auto rounded-[3rem] bg-gradient-brand p-12 md:p-20 text-center relative overflow-hidden shadow-glow">
          <div className="absolute inset-0 bg-slate-950/20" />
          <div className="relative z-10">
            <h2 className="text-4xl md:text-6xl font-black mb-6 text-white leading-tight">
              Seu próximo crescimento <br /> começa aqui.
            </h2>
            <p className="text-lg md:text-xl text-white/80 mb-10 max-w-2xl mx-auto">
              Tenha prospecção, vendas, criação e gestão trabalhando em um único ecossistema.
            </p>
            <Button asChild className="h-16 px-10 rounded-2xl font-black bg-white text-slate-950 hover:bg-slate-100 text-lg shadow-2xl transition-all hover:scale-105 active:scale-95">
              <Link to="/auth">🚀 Começar agora</Link>
            </Button>
          </div>
        </div>
      </section>

