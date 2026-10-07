import { useEffect, useState, type CSSProperties } from "react";
import {
  ArrowRight, BarChart3, Bot, Clock, Code2, Database, Globe, Layers, LifeBuoy, Mail, Megaphone, Menu, MessageCircle,
  MessageSquare, PenLine, Repeat, Search, Settings, Sheet, Target, Users, Wallet, Webhook, Workflow, X, Quote, Sparkles,
} from "lucide-react";
import { Reveal, CountUp } from "@/components/templates/imobiliaria-premium/ImobiliariaPremiumSite";
import type { IaAutomacaoContent, IaFlow, IaIcon, IaSectionKey } from "@/lib/templates/ia-automacao/content";

/**
 * Estrutura visual do Template 02 — IA & Automação Empresarial.
 * Todo texto, cor e dado vem de `content`; reaproveita Reveal/CountUp do Template 01.
 */

const ICONS: Record<IaIcon, typeof Bot> = {
  chat: MessageSquare, target: Target, workflow: Workflow, chart: BarChart3, pen: PenLine, lifebuoy: LifeBuoy,
  repeat: Repeat, clock: Clock, layers: Layers, wallet: Wallet, megaphone: Megaphone, settings: Settings, users: Users,
  whatsapp: MessageCircle, crm: Database, mail: Mail, globe: Globe, search: Search, sheet: Sheet, code: Code2, webhook: Webhook, bot: Bot,
};

const STATUS: Record<string, string> = { online: "Online", processando: "Processando", aguardando: "Aguardando" };

function Head({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <Reveal className="mx-auto max-w-3xl text-center">
      <span className="mx-auto mb-5 block h-px w-14 bg-gradient-to-r from-transparent via-[var(--ia-a2)] to-transparent" />
      <h2 className="ia-h text-3xl font-semibold leading-tight tracking-tight sm:text-4xl lg:text-5xl">{title}</h2>
      {subtitle ? <p className="mt-4 text-base text-[var(--ia-muted)] sm:text-lg">{subtitle}</p> : null}
    </Reveal>
  );
}

function IconBox({ icon, className = "" }: { icon: IaIcon; className?: string }) {
  const I = ICONS[icon] ?? Bot;
  return (
    <span className={`inline-flex h-11 w-11 items-center justify-center rounded-xl border border-[var(--ia-line)] bg-[color-mix(in_oklab,var(--ia-a1)_12%,transparent)] text-[var(--ia-a2)] ${className}`}>
      <I className="h-5 w-5" />
    </span>
  );
}

function HeroVisual({ c }: { c: IaAutomacaoContent }) {
  const p = c.hero.panel;
  return (
    <div className="ia-float relative mx-auto w-full max-w-[520px]">
      <div className="absolute -inset-10 rounded-full bg-[radial-gradient(circle,color-mix(in_oklab,var(--ia-a1)_35%,transparent),transparent_65%)] blur-2xl" />
      {/* Núcleo do agente */}
      <div className="relative rounded-3xl border border-[var(--ia-line)] bg-[color-mix(in_oklab,var(--ia-surface)_85%,transparent)] p-5 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <span className="relative inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--ia-a1)] to-[var(--ia-a2)] text-white">
            <Bot className="h-5 w-5" />
            <span className="absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full border-2 border-[var(--ia-surface)] bg-emerald-400" />
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{p.agentName}</p>
            <p className="text-xs text-[var(--ia-a2)]">Ativo agora</p>
          </div>
          <Sparkles className="ml-auto h-4 w-4 text-[var(--ia-violet)]" />
        </div>
        <div className="mt-4 space-y-2.5">
          {p.messages.map((m, i) => (
            <div key={i} className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-[13px] leading-snug ${m.from === "ia" ? "ml-auto bg-[color-mix(in_oklab,var(--ia-a1)_22%,transparent)] text-[var(--ia-text)]" : "bg-white/5 text-[var(--ia-muted)]"}`}>
              {m.text}
            </div>
          ))}
          <div className="ml-auto flex w-14 items-center justify-center gap-1 rounded-2xl bg-[color-mix(in_oklab,var(--ia-a1)_22%,transparent)] py-2.5">
            {[0, 1, 2].map((i) => <span key={i} className="ia-dot h-1.5 w-1.5 rounded-full bg-[var(--ia-a2)]" style={{ animationDelay: `${i * 160}ms` }} />)}
          </div>
        </div>
        {/* Fluxo conectado */}
        <div className="mt-5 flex items-center justify-between gap-1 rounded-2xl border border-[var(--ia-line)] bg-black/20 p-3">
          {p.nodes.map((node, i) => (
            <div key={node} className="flex min-w-0 flex-1 items-center">
              <span className={`truncate rounded-lg border px-2 py-1 text-[11px] font-medium ${i === 1 ? "border-[var(--ia-a2)] text-[var(--ia-a2)]" : "border-[var(--ia-line)] text-[var(--ia-muted)]"}`}>{node}</span>
              {i < p.nodes.length - 1 ? <span className="ia-line mx-1 h-px min-w-3 flex-1" /> : null}
            </div>
          ))}
        </div>
      </div>
      {/* Indicadores flutuantes */}
      <div className="relative mt-4 grid grid-cols-2 gap-3 sm:absolute sm:-bottom-10 sm:-left-8 sm:mt-0 sm:w-[300px]">
        {p.indicators.map((x) => (
          <div key={x.label} className="rounded-2xl border border-[var(--ia-line)] bg-[color-mix(in_oklab,var(--ia-surface)_92%,transparent)] p-3 backdrop-blur-xl">
            <p className="ia-h text-xl font-semibold text-[var(--ia-text)]">{x.value}</p>
            <p className="text-[11px] leading-tight text-[var(--ia-muted)]">{x.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function FlowBuilder({ flow, index }: { flow: IaFlow; index: number }) {
  return (
    <div className="ia-grid relative overflow-hidden rounded-3xl border border-[var(--ia-line)] bg-[var(--ia-surface)] p-5 sm:p-7">
      <div className="mb-6 flex items-center justify-between">
        <p className="text-sm font-semibold"><span className="mr-2 text-[var(--ia-a2)]">Fluxo {String(index + 1).padStart(2, "0")}</span>{flow.title}</p>
        <span className="flex items-center gap-1.5 rounded-full border border-[var(--ia-line)] px-2.5 py-1 text-[11px] text-[var(--ia-muted)]"><span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />Ativo</span>
      </div>
      <div className="flex flex-col items-stretch gap-0 lg:flex-row lg:items-center">
        {flow.steps.map((s, i) => (
          <div key={s} className="flex flex-col items-center lg:flex-1 lg:flex-row">
            <div className={`group relative w-full cursor-grab rounded-xl border bg-[var(--ia-bg)] px-4 py-3 text-center transition-all duration-300 hover:-translate-y-1 hover:border-[var(--ia-a2)] hover:shadow-[0_10px_30px_-10px_var(--ia-a1)] active:cursor-grabbing lg:w-auto lg:min-w-[110px] ${i === 1 ? "border-[color-mix(in_oklab,var(--ia-violet)_60%,transparent)]" : "border-[var(--ia-line)]"}`}>
              <span className="absolute -left-1 top-1/2 hidden h-2 w-2 -translate-y-1/2 rounded-full border border-[var(--ia-a2)] bg-[var(--ia-bg)] lg:block" />
              <span className="absolute -right-1 top-1/2 hidden h-2 w-2 -translate-y-1/2 rounded-full border border-[var(--ia-a2)] bg-[var(--ia-bg)] lg:block" />
              <p className="text-[10px] uppercase tracking-[0.18em] text-[var(--ia-muted)]">Etapa {i + 1}</p>
              <p className="mt-0.5 text-sm font-semibold uppercase tracking-wide">{s}</p>
            </div>
            {i < flow.steps.length - 1 ? (
              <span className="relative block h-7 w-px overflow-hidden bg-[var(--ia-line)] lg:h-px lg:w-auto lg:min-w-6 lg:flex-1">
                <span className="ia-particle absolute h-2 w-2 rounded-full bg-[var(--ia-a2)] shadow-[0_0_10px_var(--ia-a2)]" style={{ animationDelay: `${i * 400}ms` }} />
              </span>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}

export function IaAutomacaoSite({ content: c }: { content: IaAutomacaoContent }) {
  const t = c.theme;
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    const onScroll = () => { setScrolled(window.scrollY > 24); setOffset(window.scrollY); };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const go = (k: IaSectionKey) => { setOpen(false); document.getElementById(`ia-${k}`)?.scrollIntoView({ behavior: "smooth" }); };
  const year = new Date().getFullYear();

  const vars = {
    "--ia-bg": t.background, "--ia-surface": t.surface, "--ia-text": t.text, "--ia-muted": t.muted,
    "--ia-a1": t.accent, "--ia-a2": t.accent2, "--ia-violet": t.violet, "--ia-on": t.accentText,
    "--ia-line": "color-mix(in oklab, " + t.text + " 10%, transparent)",
    "--ia-hf": `'${t.headingFont}', ui-sans-serif, system-ui, sans-serif`,
    fontFamily: `'${t.bodyFont}', ui-sans-serif, system-ui, sans-serif`,
  } as CSSProperties;

  const btnPrimary = "inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--ia-a1)] px-6 py-3.5 text-sm font-semibold text-[var(--ia-on)] shadow-[0_10px_40px_-10px_var(--ia-a1)] transition-all hover:-translate-y-0.5 hover:brightness-110";
  const btnGhost = "inline-flex items-center justify-center gap-2 rounded-xl border border-[var(--ia-line)] bg-white/[0.03] px-6 py-3.5 text-sm font-semibold text-[var(--ia-text)] transition-all hover:border-[var(--ia-a2)] hover:text-[var(--ia-a2)]";

  return (
    <div style={vars} className="min-h-screen overflow-x-hidden bg-[var(--ia-bg)] text-[var(--ia-text)] antialiased">
      <style>{`
        .ia-h{font-family:var(--ia-hf)}
        @keyframes iaFloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-10px)}}
        .ia-float{animation:iaFloat 7s ease-in-out infinite}
        @keyframes iaDot{0%,80%,100%{opacity:.25}40%{opacity:1}}
        .ia-dot{animation:iaDot 1.2s infinite}
        @keyframes iaFlow{0%{background-position:0 0}100%{background-position:40px 0}}
        .ia-line{background:repeating-linear-gradient(90deg,var(--ia-a2) 0 6px,transparent 6px 12px);background-size:40px 1px;animation:iaFlow 1.6s linear infinite;opacity:.7}
        @keyframes iaParticleV{0%{top:-8px;left:-3px}100%{top:100%;left:-3px}}
        @keyframes iaParticleH{0%{left:-8px;top:-3px}100%{left:100%;top:-3px}}
        .ia-particle{animation:iaParticleV 2.2s linear infinite}
        @media(min-width:1024px){.ia-particle{animation-name:iaParticleH}}
        .ia-grid{background-image:radial-gradient(color-mix(in oklab,var(--ia-text) 8%,transparent) 1px,transparent 1px);background-size:22px 22px}
        @media (prefers-reduced-motion: reduce){.ia-float,.ia-dot,.ia-line,.ia-particle{animation:none}}
      `}</style>

      {/* 01 NAVBAR */}
      <header className={`fixed inset-x-0 top-0 z-50 transition-all duration-500 ${scrolled ? "border-b border-[var(--ia-line)] bg-[color-mix(in_oklab,var(--ia-bg)_75%,transparent)] backdrop-blur-xl" : "border-b border-transparent"}`}>
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 sm:h-20 sm:px-8">
          <button onClick={() => go("hero")} className="ia-h flex items-center gap-2 text-lg font-semibold tracking-tight">
            {c.brand.logoUrl ? <img src={c.brand.logoUrl} alt={c.brand.name} className="h-8 w-auto" /> : (
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[var(--ia-a1)] to-[var(--ia-a2)]"><Sparkles className="h-4 w-4 text-white" /></span>
            )}
            {c.brand.name}
          </button>
          <nav className="hidden items-center gap-7 lg:flex">
            {c.nav.items.map((n) => <button key={n.label} onClick={() => go(n.target)} className="text-sm text-[var(--ia-muted)] transition-colors hover:text-[var(--ia-text)]">{n.label}</button>)}
          </nav>
          <button onClick={() => go("cta")} className="hidden rounded-xl border border-[var(--ia-line)] bg-white/[0.04] px-4 py-2.5 text-sm font-semibold transition-all hover:border-[var(--ia-a2)] lg:inline-flex">{c.nav.ctaLabel}</button>
          <button aria-label={open ? "Fechar menu" : "Abrir menu"} onClick={() => setOpen((v) => !v)} className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-[var(--ia-line)] lg:hidden">
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
        {open ? (
          <div className="border-t border-[var(--ia-line)] bg-[var(--ia-bg)] px-5 pb-6 pt-2 lg:hidden">
            {c.nav.items.map((n) => <button key={n.label} onClick={() => go(n.target)} className="block w-full border-b border-[var(--ia-line)] py-4 text-left text-base">{n.label}</button>)}
            <button onClick={() => go("cta")} className={`${btnPrimary} mt-5 w-full`}>{c.nav.ctaLabel}</button>
          </div>
        ) : null}
      </header>

      {/* 02 HERO */}
      <section id="ia-hero" className="relative overflow-hidden pb-24 pt-32 sm:pt-40 lg:pb-32">
        <div className="pointer-events-none absolute inset-0" style={{ transform: `translateY(${offset * 0.25}px)` }}>
          <div className="absolute left-1/2 top-0 h-[600px] w-[900px] -translate-x-1/2 rounded-full bg-[radial-gradient(ellipse,color-mix(in_oklab,var(--ia-a1)_22%,transparent),transparent_70%)]" />
          <div className="absolute right-[10%] top-[30%] h-64 w-64 rounded-full bg-[radial-gradient(circle,color-mix(in_oklab,var(--ia-violet)_14%,transparent),transparent_70%)]" />
        </div>
        <div className="ia-grid pointer-events-none absolute inset-0 opacity-40 [mask-image:radial-gradient(ellipse_at_center,#000_30%,transparent_75%)]" />
        <div className="relative mx-auto grid max-w-7xl items-center gap-16 px-5 sm:px-8 lg:grid-cols-[1.05fr_1fr]">
          <Reveal>
            <span className="inline-flex items-center gap-2 rounded-full border border-[var(--ia-line)] bg-white/[0.03] px-3.5 py-1.5 text-xs text-[var(--ia-a2)]"><span className="h-1.5 w-1.5 rounded-full bg-[var(--ia-a2)]" />{c.hero.eyebrow}</span>
            <h1 className="ia-h mt-6 text-4xl font-semibold leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">{c.hero.title}</h1>
            <p className="mt-6 max-w-xl text-lg text-[var(--ia-muted)]">{c.hero.text}</p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <button onClick={() => go("solutions")} className={btnPrimary}>{c.hero.primaryCta}<ArrowRight className="h-4 w-4" /></button>
              <button onClick={() => go("cta")} className={btnGhost}>{c.hero.secondaryCta}</button>
            </div>
          </Reveal>
          <Reveal delay={200}><HeroVisual c={c} /></Reveal>
        </div>
      </section>

      {/* 03 PROBLEMA */}
      <section id="ia-problem" className="relative py-24">
        <div className="mx-auto max-w-6xl px-5 sm:px-8">
          <Head title={c.problem.title} />
          <div className="mt-14 grid gap-5 md:grid-cols-3">
            {c.problem.items.map((p, i) => (
              <Reveal key={p.id} delay={i * 120}>
                <div className="h-full rounded-2xl border border-[var(--ia-line)] bg-white/[0.02] p-6">
                  <IconBox icon={p.icon} className="text-[var(--ia-muted)]" />
                  <h3 className="ia-h mt-5 text-lg font-semibold">{p.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-[var(--ia-muted)]">{p.text}</p>
                </div>
              </Reveal>
            ))}
          </div>
          <Reveal className="mt-14">
            <div className="relative mx-auto max-w-3xl overflow-hidden rounded-3xl border border-[color-mix(in_oklab,var(--ia-a2)_35%,transparent)] bg-gradient-to-r from-[color-mix(in_oklab,var(--ia-a1)_16%,transparent)] to-[color-mix(in_oklab,var(--ia-a2)_10%,transparent)] p-8 text-center">
              <span className="mx-auto mb-4 block h-10 w-px bg-gradient-to-b from-transparent to-[var(--ia-a2)]" />
              <p className="ia-h text-xl font-medium sm:text-2xl">{c.problem.transformation}</p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* 04 SOLUÇÕES */}
      <section id="ia-solutions" className="py-24">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <Head title={c.solutions.title} subtitle={c.solutions.subtitle} />
          <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {c.solutions.items.map((s, i) => (
              <Reveal key={s.id} delay={(i % 3) * 100}>
                <article className="group relative h-full overflow-hidden rounded-2xl border border-[var(--ia-line)] bg-[var(--ia-surface)] p-7 transition-all duration-500 hover:-translate-y-1.5 hover:border-[color-mix(in_oklab,var(--ia-a2)_45%,transparent)]">
                  <span className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-[radial-gradient(circle,color-mix(in_oklab,var(--ia-a1)_30%,transparent),transparent_70%)] opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                  <IconBox icon={s.icon} className="transition-transform duration-500 group-hover:scale-110" />
                  <h3 className="ia-h mt-6 text-xl font-semibold">{s.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-[var(--ia-muted)]">{s.text}</p>
                  <span className="mt-6 inline-flex items-center gap-1.5 text-sm text-[var(--ia-a2)] opacity-70 transition-all group-hover:gap-2.5 group-hover:opacity-100">Saiba mais <ArrowRight className="h-4 w-4" /></span>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* 05 AGENTES */}
      <section id="ia-agents" className="relative overflow-hidden py-24">
        <div className="pointer-events-none absolute left-1/2 top-1/2 h-[500px] w-[900px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(ellipse,color-mix(in_oklab,var(--ia-a1)_14%,transparent),transparent_70%)]" />
        <div className="relative mx-auto max-w-7xl px-5 sm:px-8">
          <Head title={c.agents.title} subtitle={c.agents.subtitle} />
          <div className="-mx-5 mt-14 flex snap-x snap-mandatory gap-4 overflow-x-auto px-5 pb-4 sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 lg:grid-cols-5">
            {c.agents.items.map((a, i) => (
              <Reveal key={a.id} delay={i * 90} className="w-[78%] shrink-0 snap-center sm:w-auto">
                <article className="group h-full rounded-2xl border border-[var(--ia-line)] bg-[color-mix(in_oklab,var(--ia-surface)_90%,transparent)] p-5 backdrop-blur transition-all duration-500 hover:-translate-y-1.5 hover:border-[color-mix(in_oklab,var(--ia-a2)_45%,transparent)]">
                  <div className="flex items-center justify-between">
                    <span className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-[var(--ia-line)] bg-gradient-to-br from-[color-mix(in_oklab,var(--ia-a1)_35%,transparent)] to-[color-mix(in_oklab,var(--ia-violet)_20%,transparent)]"><Bot className="h-5 w-5 text-[var(--ia-a2)]" /></span>
                    <span className="flex items-center gap-1.5 rounded-full bg-white/[0.04] px-2.5 py-1 text-[11px] text-[var(--ia-muted)]">
                      <span className={`h-1.5 w-1.5 rounded-full ${a.status === "online" ? "bg-emerald-400" : a.status === "processando" ? "animate-pulse bg-[var(--ia-a2)]" : "bg-amber-400"}`} />{STATUS[a.status]}
                    </span>
                  </div>
                  <h3 className="ia-h mt-5 text-base font-semibold">{a.name}</h3>
                  <p className="text-xs text-[var(--ia-a2)]">{a.role}</p>
                  <p className="mt-3 text-sm leading-relaxed text-[var(--ia-muted)]">{a.text}</p>
                  <p className="mt-4 border-t border-[var(--ia-line)] pt-3 text-xs text-[var(--ia-muted)]">{a.metric}</p>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* 06-07 AUTOMAÇÕES / FLUXOS */}
      <section id="ia-automations" className="py-24">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <Head title={c.automations.title} subtitle={c.automations.subtitle} />
          <div className="mt-14 grid gap-6">
            {c.automations.flows.map((f, i) => <Reveal key={f.id} delay={i * 150}><FlowBuilder flow={f} index={i} /></Reveal>)}
          </div>
        </div>
      </section>

      {/* 08 INTEGRAÇÕES */}
      <section id="ia-integrations" className="py-24">
        <div className="mx-auto max-w-6xl px-5 sm:px-8">
          <Head title={c.integrations.title} subtitle={c.integrations.subtitle} />
          <Reveal className="mt-14">
            <div className="relative rounded-3xl border border-[var(--ia-line)] bg-[var(--ia-surface)] p-6 sm:p-10">
              <div className="mx-auto mb-8 flex w-fit items-center gap-2 rounded-2xl border border-[color-mix(in_oklab,var(--ia-a2)_45%,transparent)] bg-[var(--ia-bg)] px-5 py-3 shadow-[0_0_40px_-10px_var(--ia-a2)]">
                <Sparkles className="h-4 w-4 text-[var(--ia-a2)]" /><span className="ia-h font-semibold">{c.brand.name}</span>
              </div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {c.integrations.items.map((it, i) => {
                  const I = ICONS[it.icon] ?? Globe;
                  return (
                    <div key={it.id} className="group flex items-center gap-3 rounded-xl border border-[var(--ia-line)] bg-[var(--ia-bg)] px-4 py-3.5 transition-all duration-300 hover:border-[var(--ia-a2)] hover:shadow-[0_0_24px_-8px_var(--ia-a2)]" style={{ transitionDelay: `${i * 20}ms` }}>
                      <I className="h-5 w-5 text-[var(--ia-muted)] transition-colors group-hover:text-[var(--ia-a2)]" />
                      <span className="text-sm font-medium">{it.label}</span>
                    </div>
                  );
                })}
              </div>
              <p className="mt-6 text-center text-xs text-[var(--ia-muted)]">{c.integrations.disclaimer}</p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* 09 RESULTADOS */}
      <section id="ia-results" className="py-24">
        <div className="mx-auto max-w-6xl px-5 sm:px-8">
          <Head title={c.results.title} subtitle={c.results.subtitle} />
          <div className="mt-14 grid grid-cols-2 gap-4 lg:grid-cols-4">
            {c.results.stats.map((s, i) => (
              <Reveal key={s.label} delay={i * 100}>
                <div className="rounded-2xl border border-[var(--ia-line)] bg-gradient-to-b from-[color-mix(in_oklab,var(--ia-a1)_10%,transparent)] to-transparent p-6 text-center">
                  <p className="ia-h bg-gradient-to-r from-[var(--ia-text)] to-[var(--ia-a2)] bg-clip-text text-4xl font-semibold text-transparent sm:text-5xl"><CountUp value={s.value} prefix={s.prefix} suffix={s.suffix} /></p>
                  <p className="mt-2 text-sm text-[var(--ia-muted)]">{s.label}</p>
                </div>
              </Reveal>
            ))}
          </div>
          <p className="mt-6 text-center text-xs text-[var(--ia-muted)]">{c.results.disclaimer}</p>
        </div>
      </section>

      {/* 10 CASOS DE USO */}
      <section id="ia-useCases" className="py-24">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <Head title={c.useCases.title} subtitle={c.useCases.subtitle} />
          <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {c.useCases.items.map((u, i) => (
              <Reveal key={u.id} delay={(i % 3) * 100}>
                <article className="group h-full rounded-2xl border border-[var(--ia-line)] bg-[var(--ia-surface)] p-6 transition-all duration-500 hover:-translate-y-1 hover:border-[color-mix(in_oklab,var(--ia-a2)_40%,transparent)]">
                  <div className="flex items-center gap-3"><IconBox icon={u.icon} /><h3 className="ia-h text-lg font-semibold">{u.title}</h3></div>
                  <p className="mt-4 text-sm text-[var(--ia-muted)]">{u.text}</p>
                  <div className="mt-5 flex items-center gap-1.5 rounded-xl bg-[var(--ia-bg)] p-2.5">
                    {u.steps.map((s, j) => (
                      <div key={s} className="flex min-w-0 flex-1 items-center gap-1.5">
                        <span className={`min-w-0 flex-1 truncate rounded-md border px-2 py-1 text-center text-[11px] ${j === 1 ? "border-[var(--ia-a2)] text-[var(--ia-a2)]" : "border-[var(--ia-line)] text-[var(--ia-muted)]"}`}>{s}</span>
                        {j < u.steps.length - 1 ? <ArrowRight className="h-3 w-3 shrink-0 text-[var(--ia-muted)] transition-colors group-hover:text-[var(--ia-a2)]" /> : null}
                      </div>
                    ))}
                  </div>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* 11 DEPOIMENTOS */}
      <section id="ia-testimonials" className="py-24">
        <div className="mx-auto max-w-6xl px-5 sm:px-8">
          <Head title={c.testimonials.title} subtitle={c.testimonials.subtitle} />
          <div className="mt-14 grid gap-5 md:grid-cols-3">
            {c.testimonials.items.map((x, i) => (
              <Reveal key={x.id} delay={i * 120}>
                <figure className="flex h-full flex-col rounded-2xl border border-[var(--ia-line)] bg-white/[0.02] p-6">
                  <Quote className="h-6 w-6 text-[var(--ia-violet)]" />
                  <blockquote className="mt-4 flex-1 text-[15px] leading-relaxed">“{x.text}”</blockquote>
                  <figcaption className="mt-6 border-t border-[var(--ia-line)] pt-4 text-sm"><span className="font-semibold">{x.role}</span><span className="text-[var(--ia-muted)]"> · {x.segment}</span></figcaption>
                </figure>
              </Reveal>
            ))}
          </div>
          <p className="mt-6 text-center text-xs text-[var(--ia-muted)]">{c.testimonials.disclaimer}</p>
        </div>
      </section>

      {/* 12 CTA */}
      <section id="ia-cta" className="px-5 py-24 sm:px-8">
        <Reveal>
          <div className="relative mx-auto max-w-6xl overflow-hidden rounded-[2rem] border border-[var(--ia-line)] bg-[linear-gradient(160deg,#061636,var(--ia-bg)_70%)] px-6 py-20 text-center sm:px-12">
            <div className="pointer-events-none absolute left-1/2 top-0 h-80 w-[700px] -translate-x-1/2 rounded-full bg-[radial-gradient(ellipse,color-mix(in_oklab,var(--ia-a1)_45%,transparent),transparent_70%)] blur-xl" />
            <div className="pointer-events-none absolute -bottom-20 right-10 h-60 w-60 rounded-full bg-[radial-gradient(circle,color-mix(in_oklab,var(--ia-violet)_25%,transparent),transparent_70%)]" />
            <div className="ia-grid pointer-events-none absolute inset-0 opacity-30" />
            <div className="relative">
              <h2 className="ia-h mx-auto max-w-3xl text-3xl font-semibold leading-tight sm:text-5xl">{c.cta.title}</h2>
              <p className="mx-auto mt-5 max-w-xl text-lg text-[var(--ia-muted)]">{c.cta.text}</p>
              <a href={`mailto:${c.contact.email}`} className={`${btnPrimary} mt-9 px-8 py-4 text-base`}>{c.cta.buttonLabel}</a>
            </div>
          </div>
        </Reveal>
      </section>

      {/* 13 FOOTER */}
      <footer id="ia-footer" className="border-t border-[var(--ia-line)] pb-10 pt-16">
        <div className="mx-auto grid max-w-7xl gap-10 px-5 sm:px-8 md:grid-cols-2 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <p className="ia-h flex items-center gap-2 text-lg font-semibold"><span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[var(--ia-a1)] to-[var(--ia-a2)]"><Sparkles className="h-4 w-4 text-white" /></span>{c.brand.name}</p>
            <p className="mt-4 max-w-sm text-sm text-[var(--ia-muted)]">{c.footer.description}</p>
            {c.footer.socials.length ? (
              <div className="mt-5 flex gap-3">{c.footer.socials.map((s) => <a key={s.url} href={s.url} target="_blank" rel="noreferrer" className="text-sm text-[var(--ia-muted)] hover:text-[var(--ia-a2)]">{s.label}</a>)}</div>
            ) : null}
          </div>
          {c.footer.columns.map((col) => (
            <div key={col.title}>
              <p className="text-sm font-semibold">{col.title}</p>
              <ul className="mt-4 space-y-2.5">{col.links.map((l) => <li key={l} className="text-sm text-[var(--ia-muted)]">{l}</li>)}</ul>
            </div>
          ))}
          <div>
            <p className="text-sm font-semibold">Contato</p>
            <ul className="mt-4 space-y-2.5 text-sm text-[var(--ia-muted)]">
              <li className="break-all">{c.contact.email}</li><li>{c.contact.phone}</li><li>{c.contact.city}</li><li>{c.contact.hours}</li>
            </ul>
          </div>
        </div>
        <p className="mx-auto mt-12 max-w-7xl border-t border-[var(--ia-line)] px-5 pt-6 text-xs text-[var(--ia-muted)] sm:px-8">© {year} {c.brand.name}. {c.footer.legal}</p>
      </footer>
    </div>
  );
}
