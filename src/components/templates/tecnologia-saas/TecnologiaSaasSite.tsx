import { useEffect, useState, type CSSProperties } from "react";
import {
  Activity, ArrowRight, BarChart3, Bell, Brain, Check, ChevronDown, ChevronLeft, ChevronRight, Clock, Database, Eye, FileText,
  KeyRound, Layers, Menu, MessageSquare, Plug, Server, Settings, ShieldCheck, SlidersHorizontal, TrendingUp, Unlink, Users, Workflow, X, Hexagon, Quote,
} from "lucide-react";
import { Reveal, CountUp } from "@/components/templates/imobiliaria-premium/ImobiliariaPremiumSite";
import type { SaasIcon, SaasSectionKey, TecnologiaSaasContent } from "@/lib/templates/tecnologia-saas/content";

/**
 * Estrutura visual do Template 03 — Tecnologia & SaaS Premium.
 * Todo texto, cor e dado vem de `content`; reaproveita Reveal/CountUp do Template 01.
 */

const ICONS: Record<SaasIcon, typeof Layers> = {
  layers: Layers, unlink: Unlink, eye: Eye, clock: Clock, brain: Brain, workflow: Workflow, chart: BarChart3, users: Users,
  file: FileText, message: MessageSquare, bell: Bell, sliders: SlidersHorizontal, shield: ShieldCheck, key: KeyRound,
  activity: Activity, database: Database, server: Server, plug: Plug, settings: Settings, trending: TrendingUp,
};

function Ico({ icon, className = "h-5 w-5" }: { icon: SaasIcon; className?: string }) {
  const I = ICONS[icon] ?? Layers;
  return <I className={className} />;
}

function Head({ title, subtitle, eyebrow }: { title: string; subtitle?: string; eyebrow?: string }) {
  return (
    <Reveal className="mx-auto max-w-3xl text-center">
      {eyebrow ? <p className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--sx-a2)]">{eyebrow}</p> : null}
      <h2 className="sx-h text-3xl font-semibold leading-[1.1] tracking-tight sm:text-4xl lg:text-[3.1rem]">{title}</h2>
      {subtitle ? <p className="mt-5 text-base text-[var(--sx-muted)] sm:text-lg">{subtitle}</p> : null}
    </Reveal>
  );
}

function Spark({ data, className = "" }: { data: number[]; className?: string }) {
  const max = Math.max(...data), min = Math.min(...data);
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * 100},${38 - ((v - min) / (max - min || 1)) * 34}`).join(" ");
  return (
    <svg viewBox="0 0 100 40" preserveAspectRatio="none" className={className}>
      <defs><linearGradient id="sxg" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="var(--sx-a1)" stopOpacity=".45" /><stop offset="1" stopColor="var(--sx-a1)" stopOpacity="0" /></linearGradient></defs>
      <polygon points={`0,40 ${pts} 100,40`} fill="url(#sxg)" />
      <polyline points={pts} fill="none" stroke="var(--sx-a2)" strokeWidth="1.2" vectorEffect="non-scaling-stroke" className="sx-draw" />
    </svg>
  );
}

function Bars({ data }: { data: number[] }) {
  const max = Math.max(...data);
  return (
    <div className="flex h-24 items-end gap-1.5">
      {data.map((v, i) => <span key={i} className="flex-1 rounded-t bg-gradient-to-t from-[color-mix(in_oklab,var(--sx-a1)_35%,transparent)] to-[var(--sx-a1)] transition-all duration-700" style={{ height: `${(v / max) * 100}%` }} />)}
    </div>
  );
}

function WindowBar({ title }: { title: string }) {
  return (
    <div className="flex items-center gap-2 border-b border-[var(--sx-line)] px-4 py-2.5">
      <span className="h-2.5 w-2.5 rounded-full bg-white/15" /><span className="h-2.5 w-2.5 rounded-full bg-white/15" /><span className="h-2.5 w-2.5 rounded-full bg-white/15" />
      <span className="ml-3 truncate text-[11px] text-[var(--sx-muted)]">{title}</span>
    </div>
  );
}

function HeroMock({ c, offset }: { c: TecnologiaSaasContent; offset: number }) {
  const m = c.hero.mock;
  return (
    <div className="relative mx-auto w-full max-w-[600px]" style={{ transform: `translateY(${offset * -0.06}px)` }}>
      <div className="pointer-events-none absolute -inset-12 rounded-full bg-[radial-gradient(circle,color-mix(in_oklab,var(--sx-a1)_30%,transparent),transparent_65%)] blur-2xl" />
      <div className="sx-card relative overflow-hidden rounded-2xl shadow-[0_40px_100px_-30px_rgba(0,0,0,.9)]">
        <WindowBar title={m.appName} />
        <div className="flex">
          <aside className="hidden w-32 shrink-0 border-r border-[var(--sx-line)] p-3 sm:block">
            {m.menu.map((x, i) => <p key={x} className={`mb-1 truncate rounded-md px-2 py-1.5 text-[11px] ${i === 0 ? "bg-[color-mix(in_oklab,var(--sx-a1)_18%,transparent)] text-[var(--sx-text)]" : "text-[var(--sx-muted)]"}`}>{x}</p>)}
          </aside>
          <div className="min-w-0 flex-1 p-4">
            <div className="grid grid-cols-3 gap-2">
              {m.kpis.map((k) => (
                <div key={k.label} className="min-w-0 rounded-lg border border-[var(--sx-line)] bg-white/[0.02] p-2.5">
                  <p className="truncate text-[10px] text-[var(--sx-muted)]">{k.label}</p>
                  <p className="sx-h truncate text-sm font-semibold">{k.value}</p>
                  <p className="text-[10px] text-emerald-400">{k.delta}</p>
                </div>
              ))}
            </div>
            <div className="mt-3 rounded-lg border border-[var(--sx-line)] bg-white/[0.02] p-3">
              <p className="mb-2 text-[10px] text-[var(--sx-muted)]">Crescimento — últimos 12 meses</p>
              <Spark data={m.chart} className="h-20 w-full" />
            </div>
          </div>
        </div>
      </div>
      {/* janelas flutuantes */}
      <div className="sx-float sx-card absolute -left-4 bottom-6 hidden w-52 rounded-xl p-3 sm:block">
        <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-[var(--sx-muted)]">Atividade recente</p>
        {m.activity.map((a) => <p key={a} className="flex items-center gap-2 py-1 text-[11px]"><span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--sx-a2)]" /><span className="truncate">{a}</span></p>)}
      </div>
      <div className="sx-float sx-card absolute -right-3 -top-5 flex items-center gap-2.5 rounded-xl px-3.5 py-2.5" style={{ animationDelay: "1.5s" }}>
        <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-[color-mix(in_oklab,var(--sx-a1)_25%,transparent)] text-[var(--sx-a2)]"><Bell className="h-3.5 w-3.5" /></span>
        <span className="text-[11px] font-medium">{m.notification}</span>
      </div>
    </div>
  );
}

export function TecnologiaSaasSite({ content: c }: { content: TecnologiaSaasContent }) {
  const t = c.theme;
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [offset, setOffset] = useState(0);
  const [tab, setTab] = useState(0);
  const [faq, setFaq] = useState<number | null>(0);
  const [slide, setSlide] = useState(0);

  useEffect(() => {
    const onScroll = () => { setScrolled(window.scrollY > 24); setOffset(Math.min(window.scrollY, 900)); };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const go = (k: SaasSectionKey) => { setOpen(false); document.getElementById(`sx-${k}`)?.scrollIntoView({ behavior: "smooth" }); };
  const year = new Date().getFullYear();
  const tItems = c.testimonials.items;
  const activeTab = c.product.tabs[tab] ?? c.product.tabs[0];

  const vars = {
    "--sx-bg": t.background, "--sx-surface": t.surface, "--sx-text": t.text, "--sx-muted": t.muted,
    "--sx-a1": t.accent, "--sx-a2": t.accent2, "--sx-violet": t.violet, "--sx-on": t.accentText,
    "--sx-line": `color-mix(in oklab, ${t.text} 9%, transparent)`,
    "--sx-hf": `'${t.headingFont}', ui-sans-serif, system-ui, sans-serif`,
    fontFamily: `'${t.bodyFont}', ui-sans-serif, system-ui, sans-serif`,
  } as CSSProperties;

  const btnPrimary = "inline-flex items-center justify-center gap-2 rounded-lg bg-[var(--sx-a1)] px-6 py-3.5 text-sm font-semibold text-[var(--sx-on)] shadow-[0_10px_40px_-12px_var(--sx-a1)] transition-all hover:-translate-y-0.5 hover:brightness-110";
  const btnGhost = "inline-flex items-center justify-center gap-2 rounded-lg border border-[var(--sx-line)] bg-white/[0.03] px-6 py-3.5 text-sm font-semibold text-[var(--sx-text)] transition-all hover:border-[color-mix(in_oklab,var(--sx-a2)_60%,transparent)]";
  const container = "mx-auto max-w-7xl px-5 sm:px-8";

  return (
    <div style={vars} className="min-h-screen overflow-x-hidden bg-[var(--sx-bg)] text-[var(--sx-text)] antialiased">
      <style>{`
        .sx-h{font-family:var(--sx-hf)}
        .sx-card{background:color-mix(in oklab,var(--sx-surface) 92%,transparent);border:1px solid var(--sx-line);backdrop-filter:blur(14px)}
        @keyframes sxFloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}
        .sx-float{animation:sxFloat 8s ease-in-out infinite}
        @keyframes sxDash{to{stroke-dashoffset:-24}}
        .sx-dash{stroke-dasharray:4 8;animation:sxDash 1.8s linear infinite}
        @keyframes sxPulse{0%,100%{opacity:.35}50%{opacity:1}}
        .sx-pulse{animation:sxPulse 2.6s ease-in-out infinite}
        .sx-grid{background-image:linear-gradient(var(--sx-line) 1px,transparent 1px),linear-gradient(90deg,var(--sx-line) 1px,transparent 1px);background-size:56px 56px}
        @media (prefers-reduced-motion: reduce){.sx-float,.sx-dash,.sx-pulse{animation:none}}
      `}</style>

      {/* 01 NAVBAR */}
      <header className={`fixed inset-x-0 top-0 z-50 transition-all duration-500 ${scrolled ? "border-b border-[var(--sx-line)] bg-[color-mix(in_oklab,var(--sx-bg)_72%,transparent)] backdrop-blur-xl" : "border-b border-transparent"}`}>
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-5 sm:h-[72px] sm:px-8">
          <button onClick={() => go("hero")} className="sx-h flex items-center gap-2 text-lg font-semibold tracking-tight">
            {c.brand.logoUrl ? <img src={c.brand.logoUrl} alt={c.brand.name} className="h-7 w-auto" /> : <Hexagon className="h-6 w-6 text-[var(--sx-a1)]" strokeWidth={2.2} />}
            {c.brand.name}
          </button>
          <nav className="hidden items-center gap-8 lg:flex">
            {c.nav.items.map((n) => <button key={n.label} onClick={() => go(n.target)} className="text-sm text-[var(--sx-muted)] transition-colors hover:text-[var(--sx-text)]">{n.label}</button>)}
          </nav>
          <div className="flex items-center gap-2">
            <button className="hidden px-3 py-2 text-sm font-medium text-[var(--sx-muted)] hover:text-[var(--sx-text)] lg:inline-flex">{c.nav.loginLabel}</button>
            <button onClick={() => go("pricing")} className="rounded-lg bg-[var(--sx-a1)] px-3.5 py-2 text-xs font-semibold text-[var(--sx-on)] transition hover:brightness-110 sm:px-4 sm:text-sm">{c.nav.ctaLabel}</button>
            <button aria-label={open ? "Fechar menu" : "Abrir menu"} onClick={() => setOpen((v) => !v)} className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-[var(--sx-line)] lg:hidden">
              {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
        {open ? (
          <div className="border-t border-[var(--sx-line)] bg-[var(--sx-bg)] px-5 pb-6 pt-2 lg:hidden">
            {c.nav.items.map((n) => <button key={n.label} onClick={() => go(n.target)} className="block w-full border-b border-[var(--sx-line)] py-4 text-left text-base">{n.label}</button>)}
            <button className="mt-4 w-full py-3 text-sm text-[var(--sx-muted)]">{c.nav.loginLabel}</button>
          </div>
        ) : null}
      </header>

      {/* 02 HERO */}
      <section id="sx-hero" className="relative overflow-hidden pb-20 pt-32 sm:pt-40 lg:pb-28">
        <div className="sx-grid pointer-events-none absolute inset-0 opacity-50 [mask-image:radial-gradient(ellipse_at_top,#000_20%,transparent_70%)]" />
        <div className="pointer-events-none absolute left-1/2 top-0 h-[520px] w-[1000px] -translate-x-1/2 rounded-full bg-[radial-gradient(ellipse,color-mix(in_oklab,var(--sx-a1)_20%,transparent),transparent_70%)]" style={{ transform: `translate(-50%, ${offset * 0.2}px)` }} />
        <div className={`relative grid grid-cols-1 items-center gap-16 lg:grid-cols-[1fr_1.05fr] [&>*]:min-w-0 ${container}`}>
          <Reveal>
            <span className="inline-flex max-w-full items-center gap-2 rounded-full border border-[var(--sx-line)] bg-white/[0.03] px-3.5 py-1.5 text-xs text-[var(--sx-muted)]"><span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--sx-a2)]" /><span className="truncate">{c.hero.eyebrow}</span></span>
            <h1 className="sx-h mt-6 text-4xl font-semibold leading-[1.06] tracking-tight sm:text-5xl lg:text-[3.6rem]">{c.hero.title}</h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-[var(--sx-muted)]">{c.hero.text}</p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <button onClick={() => go("pricing")} className={btnPrimary}>{c.hero.primaryCta}<ArrowRight className="h-4 w-4" /></button>
              <button onClick={() => go("showcase")} className={btnGhost}>{c.hero.secondaryCta}</button>
            </div>
            <p className="mt-6 text-xs text-[var(--sx-muted)]">{c.hero.trustNote}</p>
          </Reveal>
          <Reveal delay={200}><HeroMock c={c} offset={offset} /></Reveal>
        </div>
      </section>

      {/* 03 PROVA VISUAL */}
      <section id="sx-showcase" className="relative py-24">
        <div className={container}>
          <Head title={c.showcase.title} subtitle={c.showcase.subtitle} />
          <Reveal className="mt-14">
            <div className="relative">
              <div className="pointer-events-none absolute inset-x-10 -top-10 h-40 rounded-full bg-[color-mix(in_oklab,var(--sx-a1)_25%,transparent)] blur-3xl" />
              <div className="sx-card relative overflow-hidden rounded-2xl">
                <WindowBar title="app.nexora — Visão geral" />
                <div className="grid gap-4 p-4 sm:p-6 lg:grid-cols-3">
                  <div className="grid grid-cols-2 gap-3 lg:col-span-3 lg:grid-cols-4">
                    {c.showcase.kpis.map((k) => (
                      <div key={k.label} className="rounded-xl border border-[var(--sx-line)] bg-white/[0.02] p-4">
                        <p className="text-xs text-[var(--sx-muted)]">{k.label}</p>
                        <p className="sx-h mt-1 text-2xl font-semibold">{k.value}</p>
                        <p className="mt-1 text-xs text-emerald-400">{k.delta}</p>
                      </div>
                    ))}
                  </div>
                  <div className="rounded-xl border border-[var(--sx-line)] bg-white/[0.02] p-4 lg:col-span-2">
                    <p className="mb-3 text-sm font-semibold">Tarefas</p>
                    <div className="divide-y divide-[var(--sx-line)]">
                      {c.showcase.tasks.map((x) => (
                        <div key={x.title} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                          <div className="min-w-0"><p className="truncate">{x.title}</p><p className="truncate text-xs text-[var(--sx-muted)]">{x.owner}</p></div>
                          <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-[11px] ${x.status === "Concluída" ? "bg-emerald-400/10 text-emerald-300" : x.status === "Pendente" ? "bg-white/5 text-[var(--sx-muted)]" : "bg-[color-mix(in_oklab,var(--sx-a1)_18%,transparent)] text-[var(--sx-a2)]"}`}>{x.status}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="rounded-xl border border-[var(--sx-line)] bg-white/[0.02] p-4">
                    <p className="mb-3 text-sm font-semibold">Desempenho semanal</p>
                    <Bars data={c.showcase.performance} />
                    <p className="mb-2 mt-5 text-sm font-semibold">Clientes</p>
                    {c.showcase.clients.map((cl) => (
                      <div key={cl.name} className="flex items-center justify-between gap-2 py-1.5 text-xs">
                        <span className="truncate">{cl.name}</span><span className="shrink-0 text-[var(--sx-muted)]">{cl.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* 04 PROBLEMA — composição horizontal conectada */}
      <section id="sx-problem" className="py-24">
        <div className={container}>
          <Head title={c.problem.title} />
          <div className="relative mt-16">
            <div className="absolute left-[12%] right-[12%] top-7 hidden h-px bg-gradient-to-r from-transparent via-[var(--sx-line)] to-transparent lg:block" />
            <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
              {c.problem.items.map((p, i) => (
                <Reveal key={p.id} delay={i * 120} className="relative text-center">
                  <span className="relative mx-auto inline-flex h-14 w-14 items-center justify-center rounded-full border border-[var(--sx-line)] bg-[var(--sx-bg)] text-[var(--sx-muted)]">
                    <Ico icon={p.icon} />
                    <span className="absolute -right-1 -top-1 h-3 w-3 rounded-full border-2 border-[var(--sx-bg)] bg-rose-400/70" />
                  </span>
                  <h3 className="sx-h mt-5 text-lg font-semibold">{p.title}</h3>
                  <p className="mx-auto mt-2 max-w-[240px] text-sm text-[var(--sx-muted)]">{p.text}</p>
                </Reveal>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 05 SOLUÇÃO — fluxo Equipe → Processos → Dados → Resultados */}
      <section id="sx-solution" className="relative overflow-hidden py-24">
        <div className="pointer-events-none absolute left-1/2 top-1/2 h-[420px] w-[900px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(ellipse,color-mix(in_oklab,var(--sx-a1)_14%,transparent),transparent_70%)]" />
        <div className={`relative ${container}`}>
          <Head title={c.solution.title} subtitle={c.solution.text} />
          <Reveal className="mt-16">
            <div className="sx-card rounded-3xl p-6 sm:p-10">
              <div className="flex flex-col items-center lg:flex-row lg:items-stretch">
                {c.solution.nodes.map((nd, i) => (
                  <div key={nd.id} className="flex w-full flex-col items-center lg:flex-1 lg:flex-row">
                    <div className={`w-full max-w-[260px] rounded-2xl border p-5 text-center transition-all duration-500 hover:-translate-y-1 lg:max-w-none ${i === c.solution.nodes.length - 1 ? "border-[color-mix(in_oklab,var(--sx-a2)_50%,transparent)] bg-[color-mix(in_oklab,var(--sx-a1)_12%,transparent)]" : "border-[var(--sx-line)] bg-[var(--sx-bg)]"}`}>
                      <span className="mx-auto inline-flex h-11 w-11 items-center justify-center rounded-xl bg-[color-mix(in_oklab,var(--sx-a1)_16%,transparent)] text-[var(--sx-a2)]"><Ico icon={nd.icon} /></span>
                      <p className="sx-h mt-3 font-semibold">{nd.label}</p>
                      <p className="mt-1 text-xs text-[var(--sx-muted)]">{nd.text}</p>
                    </div>
                    {i < c.solution.nodes.length - 1 ? (
                      <svg className="h-10 w-4 shrink-0 lg:h-4 lg:w-auto lg:min-w-8 lg:flex-1" viewBox="0 0 100 100" preserveAspectRatio="none">
                        <line x1="50" y1="0" x2="50" y2="100" stroke="var(--sx-a2)" strokeWidth="2" vectorEffect="non-scaling-stroke" className="sx-dash lg:hidden" />
                        <line x1="0" y1="50" x2="100" y2="50" stroke="var(--sx-a2)" strokeWidth="2" vectorEffect="non-scaling-stroke" className="sx-dash hidden lg:inline" />
                      </svg>
                    ) : null}
                  </div>
                ))}
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* 06 RECURSOS — bento */}
      <section id="sx-features" className="py-24">
        <div className={container}>
          <Head title={c.features.title} subtitle={c.features.subtitle} />
          <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {c.features.items.map((f, i) => {
              const lg = f.size === "lg";
              return (
                <Reveal key={f.id} delay={(i % 4) * 80} className={lg ? "sm:col-span-2" : ""}>
                  <article className={`group relative h-full overflow-hidden rounded-2xl border border-[var(--sx-line)] p-6 transition-all duration-500 hover:-translate-y-1 hover:border-[color-mix(in_oklab,var(--sx-a2)_40%,transparent)] ${lg ? "bg-gradient-to-br from-[color-mix(in_oklab,var(--sx-a1)_12%,var(--sx-surface))] to-[var(--sx-surface)] sm:p-8" : "bg-[var(--sx-surface)]"}`}>
                    <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--sx-line)] text-[var(--sx-a2)] transition-transform duration-500 group-hover:scale-110"><Ico icon={f.icon} /></span>
                    <h3 className={`sx-h mt-5 font-semibold ${lg ? "text-2xl" : "text-lg"}`}>{f.title}</h3>
                    <p className={`mt-2 text-sm leading-relaxed text-[var(--sx-muted)] ${lg ? "max-w-md" : ""}`}>{f.text}</p>
                    {lg ? <div className="mt-6 opacity-80 transition-opacity group-hover:opacity-100"><Spark data={i === 0 ? [20, 28, 26, 38, 44, 52, 60] : [60, 52, 48, 36, 30, 22, 14]} className="h-12 w-full" /></div> : null}
                  </article>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* 07 COMO FUNCIONA — linha do tempo */}
      <section id="sx-howItWorks" className="py-24">
        <div className={container}>
          <Head title={c.howItWorks.title} />
          <div className="relative mt-16">
            <div className="absolute bottom-0 left-6 top-0 w-px bg-gradient-to-b from-[var(--sx-a1)] via-[var(--sx-line)] to-transparent md:left-0 md:right-0 md:top-6 md:h-px md:w-auto md:bg-gradient-to-r" />
            <div className="grid gap-12 md:grid-cols-3 md:gap-8">
              {c.howItWorks.steps.map((s, i) => (
                <Reveal key={s.id} delay={i * 180} className="relative pl-20 md:pl-0">
                  <span className="sx-h absolute left-0 top-0 inline-flex h-12 w-12 items-center justify-center rounded-full border border-[color-mix(in_oklab,var(--sx-a2)_50%,transparent)] bg-[var(--sx-bg)] text-sm font-semibold text-[var(--sx-a2)] shadow-[0_0_30px_-8px_var(--sx-a1)] md:relative">{s.number}</span>
                  <h3 className="sx-h mt-1 text-xl font-semibold md:mt-6">{s.title}</h3>
                  <p className="mt-2 max-w-sm text-sm leading-relaxed text-[var(--sx-muted)]">{s.text}</p>
                </Reveal>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 08 INTERFACE / PRODUTO — abas */}
      <section id="sx-product" className="py-24">
        <div className={container}>
          <Head title={c.product.title} subtitle={c.product.subtitle} />
          <Reveal className="mt-12">
            <div className="-mx-5 flex gap-2 overflow-x-auto px-5 pb-2 sm:mx-0 sm:justify-center sm:px-0" role="tablist">
              {c.product.tabs.map((x, i) => (
                <button key={x.id} role="tab" aria-selected={i === tab} onClick={() => setTab(i)} className={`shrink-0 rounded-full border px-4 py-2 text-sm transition-all ${i === tab ? "border-[var(--sx-a1)] bg-[color-mix(in_oklab,var(--sx-a1)_18%,transparent)] text-[var(--sx-text)]" : "border-[var(--sx-line)] text-[var(--sx-muted)] hover:text-[var(--sx-text)]"}`}>{x.label}</button>
              ))}
            </div>
            <div className="sx-card mt-6 overflow-hidden rounded-2xl">
              <WindowBar title={`app.nexora — ${activeTab?.label ?? ""}`} />
              {activeTab ? (
                <div key={activeTab.id} className="animate-in fade-in p-5 duration-500 sm:p-8">
                  <p className="sx-h text-xl font-semibold">{activeTab.heading}</p>
                  <div className="mt-5 grid grid-cols-3 gap-3">
                    {activeTab.metrics.map((m) => (
                      <div key={m.label} className="min-w-0 rounded-xl border border-[var(--sx-line)] bg-white/[0.02] p-3 sm:p-4">
                        <p className="truncate text-xs text-[var(--sx-muted)]">{m.label}</p>
                        <p className="sx-h mt-1 truncate text-lg font-semibold sm:text-2xl">{m.value}</p>
                      </div>
                    ))}
                  </div>
                  <div className="mt-5 divide-y divide-[var(--sx-line)] rounded-xl border border-[var(--sx-line)]">
                    {activeTab.rows.map((r) => (
                      <div key={r.name} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
                        <span className="min-w-0 truncate">{r.name}</span>
                        <span className="hidden text-[var(--sx-muted)] sm:inline">{r.status}</span>
                        <span className="shrink-0 font-semibold text-[var(--sx-a2)]">{r.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          </Reveal>
        </div>
      </section>

      {/* 09 INTEGRAÇÕES — rede */}
      <section id="sx-integrations" className="py-24">
        <div className={container}>
          <Head title={c.integrations.title} subtitle={c.integrations.subtitle} />
          <Reveal className="mt-14">
            <div className="relative mx-auto max-w-4xl">
              <div className="relative mx-auto mb-10 flex h-20 w-20 items-center justify-center rounded-2xl border border-[color-mix(in_oklab,var(--sx-a2)_50%,transparent)] bg-[var(--sx-surface)] shadow-[0_0_60px_-10px_var(--sx-a1)]">
                <Hexagon className="h-9 w-9 text-[var(--sx-a1)]" strokeWidth={2} />
                <span className="sx-pulse absolute inset-0 rounded-2xl border border-[var(--sx-a2)]" />
              </div>
              <svg className="pointer-events-none absolute left-0 right-0 top-10 hidden h-24 w-full sm:block" viewBox="0 0 500 100" preserveAspectRatio="none">
                {[25, 125, 250, 375, 475].map((x) => <path key={x} d={`M250 0 C250 50 ${x} 50 ${x} 100`} fill="none" stroke="var(--sx-a2)" strokeOpacity=".5" strokeWidth="1" vectorEffect="non-scaling-stroke" className="sx-dash" />)}
              </svg>
              <div className="grid grid-cols-2 gap-3 sm:mt-14 sm:grid-cols-5">
                {c.integrations.items.map((it) => (
                  <div key={it} className="group flex items-center justify-center gap-2 rounded-xl border border-[var(--sx-line)] bg-[var(--sx-surface)] px-3 py-3.5 text-sm transition-all duration-300 hover:border-[var(--sx-a2)] hover:shadow-[0_0_24px_-8px_var(--sx-a2)]">
                    <span className="h-1.5 w-1.5 rounded-full bg-[var(--sx-muted)] transition-colors group-hover:bg-[var(--sx-a2)]" />{it}
                  </div>
                ))}
              </div>
              <p className="mt-6 text-center text-xs text-[var(--sx-muted)]">{c.integrations.disclaimer}</p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* 10 SEGURANÇA — camadas */}
      <section id="sx-security" className="py-24">
        <div className={`grid grid-cols-1 items-center gap-14 lg:grid-cols-2 [&>*]:min-w-0 ${container}`}>
          <Reveal>
            <div className="relative mx-auto aspect-square w-full max-w-[400px]">
              {[100, 78, 56, 34].map((s, i) => (
                <span key={s} className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-[32%] border" style={{ width: `${s}%`, height: `${s}%`, borderColor: `color-mix(in oklab, var(--sx-a2) ${18 + i * 14}%, transparent)`, background: `color-mix(in oklab, var(--sx-a1) ${3 + i * 4}%, transparent)` }} />
              ))}
              <span className="absolute left-1/2 top-1/2 inline-flex h-16 w-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-2xl bg-[var(--sx-a1)] text-[var(--sx-on)] shadow-[0_0_50px_-5px_var(--sx-a1)]"><ShieldCheck className="h-7 w-7" /></span>
              {c.security.indicators.map((ind, i) => (
                <div key={ind.label} className="sx-card sx-float absolute rounded-xl px-3 py-2" style={{ animationDelay: `${i}s`, ...[{ left: "0%", top: "12%" }, { right: "0%", top: "40%" }, { left: "8%", bottom: "6%" }][i] }}>
                  <p className="sx-h text-sm font-semibold">{ind.value}</p><p className="text-[10px] text-[var(--sx-muted)]">{ind.label}</p>
                </div>
              ))}
            </div>
          </Reveal>
          <div>
            <Reveal><h2 className="sx-h text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">{c.security.title}</h2><p className="mt-4 text-[var(--sx-muted)]">{c.security.subtitle}</p></Reveal>
            <div className="mt-8 space-y-1">
              {c.security.items.map((s, i) => (
                <Reveal key={s.id} delay={i * 80}>
                  <div className="flex gap-4 border-b border-[var(--sx-line)] py-4">
                    <span className="mt-0.5 text-[var(--sx-a2)]"><Ico icon={s.icon} /></span>
                    <div><p className="font-semibold">{s.title}</p><p className="text-sm text-[var(--sx-muted)]">{s.text}</p></div>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 11 RESULTADOS — faixa */}
      <section id="sx-results" className="py-24">
        <div className={container}>
          <Head title={c.results.title} />
          <Reveal className="mt-14">
            <div className="grid grid-cols-2 overflow-hidden rounded-2xl border border-[var(--sx-line)] lg:grid-cols-4">
              {c.results.stats.map((s, i) => (
                <div key={s.label} className={`p-8 text-center ${i % 2 === 0 ? "border-r" : ""} ${i < 2 ? "border-b lg:border-b-0" : ""} ${i === 1 ? "lg:border-r" : ""} border-[var(--sx-line)]`}>
                  <p className="sx-h text-4xl font-semibold text-[var(--sx-text)] sm:text-5xl"><CountUp value={s.value} prefix={s.prefix} suffix={s.suffix} /></p>
                  <p className="mt-2 text-sm text-[var(--sx-a2)]">{s.label}</p>
                </div>
              ))}
            </div>
          </Reveal>
          <p className="mt-5 text-center text-xs text-[var(--sx-muted)]">{c.results.disclaimer}</p>
        </div>
      </section>

      {/* 12 PLANOS */}
      <section id="sx-pricing" className="py-24">
        <div className={container}>
          <Head title={c.pricing.title} subtitle={c.pricing.subtitle} />
          <div className="mx-auto mt-14 grid max-w-6xl items-stretch gap-5 lg:grid-cols-3">
            {c.pricing.plans.map((p, i) => (
              <Reveal key={p.id} delay={i * 120}>
                <div className={`relative flex h-full flex-col rounded-2xl border p-7 transition-all duration-500 hover:-translate-y-1 ${p.highlighted ? "border-[var(--sx-a1)] bg-gradient-to-b from-[color-mix(in_oklab,var(--sx-a1)_16%,var(--sx-surface))] to-[var(--sx-surface)] shadow-[0_30px_80px_-30px_var(--sx-a1)]" : "border-[var(--sx-line)] bg-[var(--sx-surface)]"}`}>
                  {p.badge ? <span className="absolute -top-3 left-7 rounded-full bg-[var(--sx-a1)] px-3 py-1 text-[11px] font-semibold text-[var(--sx-on)]">{p.badge}</span> : null}
                  <p className="sx-h text-lg font-semibold">{p.name}</p>
                  <p className="mt-1 text-sm text-[var(--sx-muted)]">{p.description}</p>
                  <p className="mt-6"><span className="sx-h text-4xl font-semibold">{p.price}</span><span className="text-sm text-[var(--sx-muted)]">{p.period}</span></p>
                  <ul className="mt-6 flex-1 space-y-3">
                    {p.features.map((f) => <li key={f} className="flex items-start gap-2.5 text-sm"><Check className="mt-0.5 h-4 w-4 shrink-0 text-[var(--sx-a2)]" />{f}</li>)}
                  </ul>
                  <button onClick={() => go("cta")} className={`mt-8 w-full ${p.highlighted ? btnPrimary : btnGhost}`}>{p.ctaLabel}</button>
                </div>
              </Reveal>
            ))}
          </div>
          <p className="mt-6 text-center text-xs text-[var(--sx-muted)]">{c.pricing.disclaimer}</p>
        </div>
      </section>

      {/* 13 DEPOIMENTOS — carrossel */}
      <section id="sx-testimonials" className="py-24">
        <div className={container}>
          <Head title={c.testimonials.title} />
          <Reveal className="mx-auto mt-14 max-w-3xl">
            <div className="sx-card relative rounded-3xl p-8 sm:p-12">
              <Quote className="h-8 w-8 text-[var(--sx-a1)]" />
              {tItems[slide] ? (
                <div key={tItems[slide].id} className="animate-in fade-in duration-500">
                  <p className="sx-h mt-6 text-xl leading-relaxed sm:text-2xl">“{tItems[slide].text}”</p>
                  <div className="mt-8 flex items-center gap-4">
                    <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[var(--sx-a1)] to-[var(--sx-a2)] text-sm font-semibold text-[var(--sx-on)]">{tItems[slide].initials}</span>
                    <div className="min-w-0"><p className="font-semibold">{tItems[slide].name}</p><p className="truncate text-sm text-[var(--sx-muted)]">{tItems[slide].role} · {tItems[slide].company}</p></div>
                  </div>
                </div>
              ) : null}
              <div className="mt-8 flex items-center justify-between">
                <div className="flex gap-2">{tItems.map((x, i) => <button key={x.id} aria-label={`Depoimento ${i + 1}`} onClick={() => setSlide(i)} className={`h-1.5 rounded-full transition-all ${i === slide ? "w-8 bg-[var(--sx-a1)]" : "w-3 bg-white/15"}`} />)}</div>
                <div className="flex gap-2">
                  <button aria-label="Anterior" onClick={() => setSlide((s) => (s - 1 + tItems.length) % tItems.length)} className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[var(--sx-line)] hover:border-[var(--sx-a2)]"><ChevronLeft className="h-4 w-4" /></button>
                  <button aria-label="Próximo" onClick={() => setSlide((s) => (s + 1) % tItems.length)} className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[var(--sx-line)] hover:border-[var(--sx-a2)]"><ChevronRight className="h-4 w-4" /></button>
                </div>
              </div>
            </div>
            <p className="mt-5 text-center text-xs text-[var(--sx-muted)]">{c.testimonials.disclaimer}</p>
          </Reveal>
        </div>
      </section>

      {/* 14 FAQ */}
      <section id="sx-faq" className="py-24">
        <div className="mx-auto max-w-3xl px-5 sm:px-8">
          <Head title={c.faq.title} />
          <div className="mt-12 divide-y divide-[var(--sx-line)] border-y border-[var(--sx-line)]">
            {c.faq.items.map((q, i) => {
              const isOpen = faq === i;
              return (
                <div key={q.id}>
                  <button aria-expanded={isOpen} onClick={() => setFaq(isOpen ? null : i)} className="flex w-full items-center justify-between gap-4 py-5 text-left">
                    <span className="font-medium sm:text-lg">{q.question}</span>
                    <ChevronDown className={`h-5 w-5 shrink-0 text-[var(--sx-muted)] transition-transform duration-300 ${isOpen ? "rotate-180 text-[var(--sx-a2)]" : ""}`} />
                  </button>
                  <div className={`grid transition-all duration-500 ${isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}>
                    <p className="overflow-hidden pb-0 text-[var(--sx-muted)]"><span className="block pb-5">{q.answer}</span></p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 15 CTA FINAL */}
      <section id="sx-cta" className="px-5 py-24 sm:px-8">
        <Reveal>
          <div className="relative mx-auto max-w-6xl overflow-hidden rounded-[2rem] border border-[var(--sx-line)] bg-[linear-gradient(170deg,#071a3d,var(--sx-bg)_75%)] px-6 py-20 text-center sm:px-12 sm:py-24">
            <div className="sx-grid pointer-events-none absolute inset-0 opacity-40 [mask-image:radial-gradient(ellipse_at_center,#000_20%,transparent_70%)]" />
            <div className="pointer-events-none absolute left-1/2 top-0 h-72 w-[700px] -translate-x-1/2 rounded-full bg-[radial-gradient(ellipse,color-mix(in_oklab,var(--sx-a1)_45%,transparent),transparent_70%)] blur-xl" />
            {[12, 30, 70, 86].map((x, i) => <span key={x} className="sx-pulse absolute h-1 w-1 rounded-full bg-[var(--sx-a2)]" style={{ left: `${x}%`, top: `${20 + (i % 2) * 50}%`, animationDelay: `${i * 0.6}s` }} />)}
            <div className="relative">
              <h2 className="sx-h mx-auto max-w-3xl text-3xl font-semibold leading-tight sm:text-5xl">{c.cta.title}</h2>
              <p className="mx-auto mt-5 max-w-xl text-lg text-[var(--sx-muted)]">{c.cta.text}</p>
              <a href={`mailto:${c.contact.email}`} className={`${btnPrimary} mt-9 px-8 py-4 text-base`}>{c.cta.buttonLabel}</a>
            </div>
          </div>
        </Reveal>
      </section>

      {/* 16 FOOTER */}
      <footer id="sx-footer" className="border-t border-[var(--sx-line)] pb-10 pt-16">
        <div className={`grid gap-10 sm:grid-cols-2 lg:grid-cols-6 ${container}`}>
          <div className="sm:col-span-2">
            <p className="sx-h flex items-center gap-2 text-lg font-semibold"><Hexagon className="h-6 w-6 text-[var(--sx-a1)]" strokeWidth={2.2} />{c.brand.name}</p>
            <p className="mt-4 max-w-xs text-sm text-[var(--sx-muted)]">{c.footer.description}</p>
            <p className="mt-4 break-all text-sm text-[var(--sx-muted)]">{c.contact.email}</p>
            {c.footer.socials.length ? <div className="mt-4 flex gap-3">{c.footer.socials.map((s) => <a key={s.url} href={s.url} target="_blank" rel="noreferrer" className="text-sm text-[var(--sx-muted)] hover:text-[var(--sx-a2)]">{s.label}</a>)}</div> : null}
          </div>
          {c.footer.columns.map((col) => (
            <div key={col.title}>
              <p className="text-sm font-semibold">{col.title}</p>
              <ul className="mt-4 space-y-2.5">{col.links.map((l) => <li key={l} className="text-sm text-[var(--sx-muted)]">{l}</li>)}</ul>
            </div>
          ))}
        </div>
        <p className={`mt-12 border-t border-[var(--sx-line)] pt-6 text-xs text-[var(--sx-muted)] ${container}`}>© {year} {c.brand.name}. {c.footer.legal}</p>
      </footer>
    </div>
  );
}
