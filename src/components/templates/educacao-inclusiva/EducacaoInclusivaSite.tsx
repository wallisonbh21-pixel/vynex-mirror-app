import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import {
  ArrowRight, BookOpen, Calendar, ChevronDown, ClipboardList, Compass, Dice5, Eye, Folder, Heart, Home,
  Image as ImageIcon, Lightbulb, List, Mail, MapPin, Menu, MessageCircle, Palette, Phone, Puzzle, School,
  Tablet, Target, TrendingUp, User, X, type LucideIcon,
} from "lucide-react";
import type { EducacaoContent, EduIcon, EduSectionKey } from "@/lib/templates/educacao-inclusiva/content";

const ICONS: Record<EduIcon, LucideIcon> = {
  book: BookOpen, puzzle: Puzzle, calendar: Calendar, compass: Compass, lightbulb: Lightbulb, palette: Palette,
  user: User, heart: Heart, eye: Eye, clipboard: ClipboardList, target: Target, trend: TrendingUp, image: ImageIcon,
  list: List, dice: Dice5, tablet: Tablet, folder: Folder, chat: MessageCircle, school: School, home: Home,
};

function useReducedMotion() {
  const [r, setR] = useState(false);
  useEffect(() => {
    const m = window.matchMedia("(prefers-reduced-motion: reduce)");
    setR(m.matches);
    const f = () => setR(m.matches);
    m.addEventListener("change", f);
    return () => m.removeEventListener("change", f);
  }, []);
  return r;
}

function Reveal({ children, delay = 0, className = "" }: { children: ReactNode; delay?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const io = new IntersectionObserver(([e]) => {
      if (e?.isIntersecting) { setShown(true); io.disconnect(); }
    }, { threshold: 0.12 });
    io.observe(node);
    return () => io.disconnect();
  }, []);
  return (
    <div ref={ref} className={`edu-reveal ${shown ? "is-in" : ""} ${className}`} style={{ transitionDelay: `${delay}ms` }}>
      {children}
    </div>
  );
}

function Heading({ eyebrow, title, subtitle, center }: { eyebrow?: string; title: string; subtitle?: string; center?: boolean }) {
  return (
    <Reveal className={center ? "mx-auto max-w-2xl text-center" : "max-w-2xl"}>
      {eyebrow && <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-[var(--e-primary)]">{eyebrow}</p>}
      <h2 className="edu-h text-3xl leading-tight text-[var(--e-text)] md:text-[2.6rem]">{title}</h2>
      {subtitle && <p className="mt-4 text-base leading-relaxed text-[var(--e-muted)] md:text-lg">{subtitle}</p>}
    </Reveal>
  );
}

export function EducacaoInclusivaSite({ content: c }: { content: EducacaoContent }) {
  const t = c.theme;
  const reduced = useReducedMotion();
  const [scrolled, setScrolled] = useState(false);
  const [menu, setMenu] = useState(false);
  const [offset, setOffset] = useState(0);
  const [openFaq, setOpenFaq] = useState<string | null>(c.faq.items[0]?.id ?? null);

  useEffect(() => {
    const f = () => { setScrolled(window.scrollY > 24); setOffset(window.scrollY); };
    f();
    window.addEventListener("scroll", f, { passive: true });
    return () => window.removeEventListener("scroll", f);
  }, []);

  const go = (target: EduSectionKey) => {
    setMenu(false);
    document.getElementById(`edu-${target}`)?.scrollIntoView({ behavior: reduced ? "auto" : "smooth" });
  };
  const contactHref = `mailto:${c.contact.email}`;
  const on = (k: EduSectionKey) => c.sections.includes(k);
  const parallax = reduced ? 0 : Math.min(offset, 600) * 0.08;

  const vars = {
    "--e-bg": t.background, "--e-surface": t.surface, "--e-alt": t.surfaceAlt, "--e-text": t.text, "--e-muted": t.muted,
    "--e-primary": t.primary, "--e-primary-text": t.primaryText, "--e-sage": t.sage, "--e-accent": t.accent, "--e-line": t.line,
    "--e-hf": `'${t.headingFont}', Georgia, serif`, "--e-bf": `'${t.bodyFont}', system-ui, sans-serif`,
  } as CSSProperties;

  return (
    <div style={vars} className="edu-root min-h-screen overflow-x-hidden bg-[var(--e-bg)] text-[var(--e-text)]">
      <style>{`
        .edu-root{font-family:var(--e-bf)}
        .edu-h{font-family:var(--e-hf);font-weight:500;letter-spacing:-0.01em}
        .edu-root a:focus-visible,.edu-root button:focus-visible{outline:3px solid var(--e-accent);outline-offset:3px;border-radius:12px}
        .edu-reveal{opacity:0;transform:translateY(18px);transition:opacity .7s ease,transform .7s ease}
        .edu-reveal.is-in{opacity:1;transform:none}
        @keyframes eduFloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}
        .edu-float{animation:eduFloat 7s ease-in-out infinite}
        .edu-float-2{animation:eduFloat 9s ease-in-out infinite 1.2s}
        @keyframes eduLine{from{transform:scaleX(0)}to{transform:scaleX(1)}}
        @keyframes eduLineV{from{transform:scaleY(0)}to{transform:scaleY(1)}}
        .is-in .edu-line{animation:eduLine 1.4s ease forwards}
        .is-in .edu-line-v{animation:eduLineV 1.4s ease forwards}
        @media (prefers-reduced-motion: reduce){
          .edu-reveal{opacity:1;transform:none;transition:none}
          .edu-float,.edu-float-2{animation:none}
          .is-in .edu-line,.is-in .edu-line-v{animation:none;transform:none}
        }
      `}</style>

      {/* 01 NAVBAR */}
      <header className={`fixed inset-x-0 top-0 z-50 transition-all ${scrolled ? "border-b border-[var(--e-line)] bg-[var(--e-bg)]/85 backdrop-blur-md" : ""}`}>
        <nav aria-label="Principal" className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-5 md:h-20">
          <button onClick={() => go("hero")} className="flex min-w-0 items-center gap-2 text-left">
            <span aria-hidden className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[var(--e-primary)] text-[var(--e-primary-text)]">
              <Heart className="size-4" />
            </span>
            <span className="truncate text-[13px] font-bold uppercase tracking-[0.14em]">{c.brand.name}</span>
          </button>
          <ul className="hidden items-center gap-6 lg:flex">
            {c.nav.items.map((i) => (
              <li key={i.label}><button onClick={() => go(i.target)} className="py-2 text-sm text-[var(--e-muted)] transition-colors hover:text-[var(--e-text)]">{i.label}</button></li>
            ))}
          </ul>
          <a href={contactHref} className="hidden rounded-full bg-[var(--e-primary)] px-5 py-2.5 text-sm font-semibold text-[var(--e-primary-text)] transition-transform hover:-translate-y-0.5 lg:inline-flex">{c.nav.ctaLabel}</a>
          <button aria-label={menu ? "Fechar menu" : "Abrir menu"} aria-expanded={menu} onClick={() => setMenu(!menu)} className="flex size-11 items-center justify-center rounded-full border border-[var(--e-line)] bg-[var(--e-surface)] lg:hidden">
            {menu ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </nav>
        {menu && (
          <div className="border-t border-[var(--e-line)] bg-[var(--e-bg)] px-5 pb-6 pt-2 lg:hidden">
            {c.nav.items.map((i) => (
              <button key={i.label} onClick={() => go(i.target)} className="block w-full border-b border-[var(--e-line)] py-4 text-left text-base">{i.label}</button>
            ))}
            <a href={contactHref} className="mt-4 flex min-h-12 items-center justify-center rounded-full bg-[var(--e-primary)] font-semibold text-[var(--e-primary-text)]">{c.nav.ctaLabel}</a>
          </div>
        )}
      </header>

      <main>
        {/* 02 HERO */}
        {on("hero") && (
          <section id="edu-hero" className="relative px-5 pb-20 pt-28 md:pb-28 md:pt-36">
            <div aria-hidden className="pointer-events-none absolute -left-32 top-20 size-[420px] rounded-full bg-[var(--e-sage)] opacity-20 blur-3xl" />
            <div className="mx-auto grid max-w-6xl items-center gap-14 lg:grid-cols-[1.05fr_1fr]">
              <Reveal>
                <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-[var(--e-line)] bg-[var(--e-surface)] px-4 py-2 text-xs font-semibold text-[var(--e-primary)]">
                  <span aria-hidden className="size-2 rounded-full bg-[var(--e-accent)]" />{c.hero.eyebrow}
                </p>
                <h1 className="edu-h text-[2.3rem] leading-[1.1] md:text-[3.4rem]">{c.hero.title}</h1>
                <p className="mt-6 max-w-xl text-lg leading-relaxed text-[var(--e-muted)]">{c.hero.text}</p>
                <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                  <button onClick={() => go("about")} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[var(--e-primary)] px-7 font-semibold text-[var(--e-primary-text)] transition-transform hover:-translate-y-0.5">
                    {c.hero.primaryCta} <ArrowRight className="size-4" />
                  </button>
                  <a href={contactHref} className="inline-flex min-h-12 items-center justify-center rounded-full border-2 border-[var(--e-primary)] px-7 font-semibold text-[var(--e-primary)] transition-colors hover:bg-[var(--e-surface)]">{c.hero.secondaryCta}</a>
                </div>
              </Reveal>
              <Reveal delay={150} className="relative mx-auto w-full max-w-[520px]">
                <div aria-hidden className="absolute -right-4 -top-6 h-40 w-40 rounded-[46%_54%_60%_40%] bg-[var(--e-accent)] opacity-25" />
                <div aria-hidden className="absolute -bottom-6 -left-6 h-48 w-48 rounded-[60%_40%_45%_55%] bg-[var(--e-sage)] opacity-40" />
                <div className="relative overflow-hidden rounded-[2.5rem_2.5rem_2.5rem_8rem] border-8 border-[var(--e-surface)] shadow-xl" style={{ transform: `translateY(${-parallax}px)` }}>
                  <img src={c.hero.imageUrl} alt={c.hero.imageAlt} className="aspect-[4/4.4] w-full object-cover" />
                </div>
                {c.hero.cards[0] && (
                  <div className="edu-float absolute -left-3 top-10 max-w-[210px] rounded-2xl border border-[var(--e-line)] bg-[var(--e-surface)] p-4 shadow-lg sm:-left-10">
                    <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[var(--e-primary)]"><Target className="size-3.5" />{c.hero.cards[0].label}</p>
                    <p className="mt-1 text-sm">{c.hero.cards[0].value}</p>
                  </div>
                )}
                {c.hero.cards[1] && (
                  <div className="edu-float-2 absolute -right-2 bottom-10 max-w-[220px] rounded-2xl border border-[var(--e-line)] bg-[var(--e-surface)] p-4 shadow-lg sm:-right-8">
                    <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[var(--e-accent)]"><TrendingUp className="size-3.5" />{c.hero.cards[1].label}</p>
                    <p className="mt-1 text-sm">{c.hero.cards[1].value}</p>
                    <div className="mt-2 h-1.5 rounded-full bg-[var(--e-alt)]"><div className="h-full w-2/3 rounded-full bg-[var(--e-sage)]" /></div>
                  </div>
                )}
              </Reveal>
            </div>
          </section>
        )}

        {/* 03 APRESENTAÇÃO */}
        {on("about") && (
          <section id="edu-about" className="bg-[var(--e-surface)] px-5 py-20 md:py-28">
            <div className="mx-auto grid max-w-6xl items-center gap-12 md:grid-cols-[0.9fr_1.1fr]">
              <Reveal className="relative">
                <img src={c.professional.photoUrl} alt={c.professional.photoAlt} className="aspect-[4/5] w-full rounded-[3rem_3rem_3rem_1rem] object-cover" />
                <blockquote className="absolute -bottom-6 right-4 max-w-[260px] rounded-2xl bg-[var(--e-primary)] p-5 text-[var(--e-primary-text)] shadow-lg">
                  <p className="edu-h text-lg leading-snug">“{c.professional.quote}”</p>
                </blockquote>
              </Reveal>
              <div>
                <Heading eyebrow="Sobre" title={c.about.title} />
                <Reveal delay={100}>
                  <p className="mt-6 text-lg leading-relaxed">{c.professional.bio}</p>
                  <p className="mt-4 leading-relaxed text-[var(--e-muted)]">{c.about.text}</p>
                  <div className="mt-8 rounded-3xl border border-[var(--e-line)] bg-[var(--e-bg)] p-6">
                    <p className="edu-h text-2xl">{c.professional.name}</p>
                    <p className="text-sm text-[var(--e-muted)]">{c.professional.role}</p>
                    <dl className="mt-5 grid gap-4 sm:grid-cols-2">
                      <div><dt className="text-xs font-bold uppercase tracking-wider text-[var(--e-primary)]">Formação</dt><dd className="mt-1 text-sm">{c.professional.education}</dd></div>
                      <div><dt className="text-xs font-bold uppercase tracking-wider text-[var(--e-primary)]">Experiência</dt><dd className="mt-1 text-sm">{c.professional.experience}</dd></div>
                    </dl>
                    <ul className="mt-5 flex flex-wrap gap-2" aria-label="Especializações">
                      {c.professional.specializations.map((s) => <li key={s} className="rounded-full bg-[var(--e-alt)] px-3 py-1.5 text-xs">{s}</li>)}
                    </ul>
                  </div>
                </Reveal>
              </div>
            </div>
          </section>
        )}

        {/* 04 COMO FUNCIONA */}
        {on("process") && (
          <section id="edu-process" className="px-5 py-20 md:py-28">
            <div className="mx-auto max-w-6xl">
              <Heading eyebrow="Como funciona" title={c.process.title} subtitle={c.process.subtitle} center />
              <Reveal className="relative mt-16">
                <div aria-hidden className="edu-line absolute left-[12%] right-[12%] top-8 hidden h-0.5 origin-left bg-[var(--e-sage)] md:block" />
                <div aria-hidden className="edu-line-v absolute bottom-8 left-8 top-8 w-0.5 origin-top bg-[var(--e-sage)] md:hidden" />
                <ol className="relative grid gap-10 md:grid-cols-4 md:gap-6">
                  {c.process.steps.map((s) => (
                    <li key={s.id} className="flex gap-5 md:flex-col md:items-center md:text-center">
                      <span className="edu-h relative z-10 flex size-16 shrink-0 items-center justify-center rounded-full border-4 border-[var(--e-bg)] bg-[var(--e-primary)] text-xl text-[var(--e-primary-text)]">{s.number}</span>
                      <div className="pt-2 md:pt-4">
                        <h3 className="edu-h text-xl">{s.title}</h3>
                        <p className="mt-2 text-sm leading-relaxed text-[var(--e-muted)]">{s.text}</p>
                      </div>
                    </li>
                  ))}
                </ol>
              </Reveal>
            </div>
          </section>
        )}

        {/* 05 ÁREAS DE APOIO */}
        {on("areas") && (
          <section id="edu-areas" className="bg-[var(--e-alt)] px-5 py-20 md:py-28">
            <div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-[0.8fr_1.2fr]">
              <div className="lg:sticky lg:top-28 lg:self-start">
                <Heading eyebrow="Acompanhamento" title={c.areas.title} subtitle={c.areas.subtitle} />
              </div>
              <ul className="grid gap-x-8 gap-y-2 sm:grid-cols-2">
                {c.areas.items.map((a, i) => {
                  const Icon = ICONS[a.icon];
                  return (
                    <li key={a.id}>
                      <Reveal delay={(i % 2) * 80} className="flex gap-4 border-b border-[var(--e-line)] py-5">
                        <span aria-hidden className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-[var(--e-surface)] text-[var(--e-primary)]"><Icon className="size-5" /></span>
                        <div><h3 className="font-bold">{a.title}</h3><p className="mt-1 text-sm leading-relaxed text-[var(--e-muted)]">{a.text}</p></div>
                      </Reveal>
                    </li>
                  );
                })}
              </ul>
            </div>
          </section>
        )}

        {/* 06 ABORDAGEM */}
        {on("approach") && (
          <section id="edu-approach" className="relative overflow-hidden bg-[var(--e-primary)] px-5 py-20 text-[var(--e-primary-text)] md:py-28">
            <div aria-hidden className="absolute -right-24 -top-24 size-80 rounded-full bg-[var(--e-sage)] opacity-20" />
            <div className="relative mx-auto max-w-6xl">
              <Reveal className="max-w-2xl">
                <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] opacity-80">Abordagem individualizada</p>
                <h2 className="edu-h text-3xl leading-tight md:text-[2.6rem]">{c.approach.title}</h2>
                <p className="mt-4 text-lg opacity-85">{c.approach.subtitle}</p>
              </Reveal>
              <Reveal delay={100}>
                <ol className="mt-12 flex flex-col items-start gap-3 md:flex-row md:flex-wrap md:items-center" aria-label="Etapas do método">
                  {c.approach.flow.map((f, i) => (
                    <li key={f} className="flex items-center gap-3 md:flex-row">
                      <span className={`rounded-full px-5 py-2.5 text-sm font-semibold ${i === 0 || i === c.approach.flow.length - 1 ? "bg-[var(--e-surface)] text-[var(--e-primary)]" : "border border-current/40 bg-white/10"}`}>{f}</span>
                      {i < c.approach.flow.length - 1 && <ArrowRight aria-hidden className="size-4 rotate-90 opacity-70 md:rotate-0" />}
                    </li>
                  ))}
                </ol>
              </Reveal>
              <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
                {c.approach.elements.map((e, i) => {
                  const Icon = ICONS[e.icon];
                  return (
                    <Reveal key={e.id} delay={i * 70} className={`rounded-3xl bg-white/10 p-6 backdrop-blur-sm transition-transform hover:-translate-y-1 ${i % 2 ? "lg:mt-8" : ""}`}>
                      <Icon aria-hidden className="size-6" />
                      <h3 className="edu-h mt-4 text-lg">{e.title}</h3>
                      <p className="mt-2 text-sm opacity-85">{e.text}</p>
                    </Reveal>
                  );
                })}
              </div>
            </div>
          </section>
        )}

        {/* 07 DIÁRIO */}
        {on("journal") && (
          <section id="edu-journal" className="px-5 py-20 md:py-28">
            <div className="mx-auto max-w-6xl">
              <Heading eyebrow="Rotina e acompanhamento" title={c.journal.title} subtitle={c.journal.subtitle} center />
              <Reveal className="mx-auto mt-12 max-w-4xl overflow-hidden rounded-[2rem] border border-[var(--e-line)] bg-[var(--e-surface)] shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--e-line)] bg-[var(--e-alt)] px-6 py-4">
                  <div className="flex items-center gap-3">
                    <span aria-hidden className="flex size-10 items-center justify-center rounded-full bg-[var(--e-sage)] text-[var(--e-primary-text)]"><User className="size-5" /></span>
                    <div><p className="font-bold">{c.journal.studentLabel}</p><p className="text-xs text-[var(--e-muted)]">Diário de acompanhamento</p></div>
                  </div>
                  <span className="rounded-full bg-[var(--e-surface)] px-3 py-1 text-xs font-semibold text-[var(--e-primary)]">{c.journal.week}</span>
                </div>
                <div className="grid md:grid-cols-[1.4fr_1fr]">
                  <ul className="divide-y divide-[var(--e-line)]">
                    {c.journal.entries.map((e) => {
                      const Icon = ICONS[e.icon];
                      return (
                        <li key={e.label} className="flex gap-4 px-6 py-4">
                          <Icon aria-hidden className="mt-0.5 size-5 shrink-0 text-[var(--e-primary)]" />
                          <div><p className="text-xs font-bold uppercase tracking-wider text-[var(--e-muted)]">{e.label}</p><p className="mt-1 text-sm">{e.text}</p></div>
                        </li>
                      );
                    })}
                  </ul>
                  <div className="border-t border-[var(--e-line)] bg-[var(--e-bg)] p-6 md:border-l md:border-t-0">
                    <p className="text-xs font-bold uppercase tracking-wider text-[var(--e-muted)]">Evolução observada</p>
                    <ul className="mt-5 space-y-5">
                      {c.journal.progress.map((p) => (
                        <li key={p.label}>
                          <div className="flex justify-between text-sm"><span>{p.label}</span><span className="font-semibold">{p.value}%</span></div>
                          <div className="mt-2 h-2 rounded-full bg-[var(--e-alt)]" role="progressbar" aria-label={p.label} aria-valuenow={p.value} aria-valuemin={0} aria-valuemax={100}>
                            <div className="h-full rounded-full bg-[var(--e-primary)]" style={{ width: `${p.value}%` }} />
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </Reveal>
              <p className="mt-5 text-center text-xs text-[var(--e-muted)]">{c.journal.disclaimer}</p>
            </div>
          </section>
        )}

        {/* 08 RECURSOS */}
        {on("resources") && (
          <section id="edu-resources" className="bg-[var(--e-surface)] px-5 py-20 md:py-28">
            <div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-2">
              <div>
                <Heading eyebrow="Recursos" title={c.resources.title} subtitle={c.resources.subtitle} />
                <ul className="mt-10 grid gap-3 sm:grid-cols-2">
                  {c.resources.items.map((r, i) => {
                    const Icon = ICONS[r.icon];
                    return (
                      <li key={r.id}>
                        <Reveal delay={i * 60} className="flex h-full gap-3 rounded-2xl bg-[var(--e-bg)] p-4 transition-colors hover:bg-[var(--e-alt)]">
                          <Icon aria-hidden className="mt-0.5 size-5 shrink-0 text-[var(--e-accent)]" />
                          <div><h3 className="text-sm font-bold">{r.title}</h3><p className="mt-1 text-xs leading-relaxed text-[var(--e-muted)]">{r.text}</p></div>
                        </Reveal>
                      </li>
                    );
                  })}
                </ul>
              </div>
              <Reveal delay={120} className="relative order-first lg:order-none">
                <div aria-hidden className="absolute inset-6 -rotate-3 rounded-[3rem] bg-[var(--e-sage)] opacity-30" />
                <img src={c.resources.imageUrl} alt={c.resources.imageAlt} className="relative aspect-[5/4] w-full rounded-[3rem] object-cover" />
              </Reveal>
            </div>
          </section>
        )}

        {/* 09 PARCERIA */}
        {on("partnership") && (
          <section id="edu-partnership" className="px-5 py-20 md:py-28">
            <div className="mx-auto max-w-6xl">
              <Heading eyebrow="Para famílias" title={c.partnership.title} subtitle={c.partnership.subtitle} center />
              <Reveal className="mt-12 flex flex-col items-center justify-center gap-3 sm:flex-row">
                {c.partnership.actors.map((a, i) => {
                  const Icon = ICONS[a.icon];
                  return (
                    <div key={a.label} className="flex flex-col items-center gap-3 sm:flex-row">
                      <div className="flex w-40 flex-col items-center gap-2 rounded-3xl border border-[var(--e-line)] bg-[var(--e-surface)] px-6 py-6">
                        <span aria-hidden className="flex size-14 items-center justify-center rounded-full bg-[var(--e-alt)] text-[var(--e-primary)]"><Icon className="size-6" /></span>
                        <span className="font-bold">{a.label}</span>
                      </div>
                      {i < c.partnership.actors.length - 1 && <span aria-hidden className="text-2xl text-[var(--e-sage)]">↔</span>}
                    </div>
                  );
                })}
              </Reveal>
              <div className="mx-auto mt-12 grid max-w-4xl gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {c.partnership.pillars.map((p, i) => {
                  const Icon = ICONS[p.icon];
                  return (
                    <Reveal key={p.id} delay={i * 70} className="text-center">
                      <Icon aria-hidden className="mx-auto size-5 text-[var(--e-accent)]" />
                      <h3 className="mt-3 font-bold">{p.title}</h3>
                      <p className="mt-1 text-sm text-[var(--e-muted)]">{p.text}</p>
                    </Reveal>
                  );
                })}
              </div>
              <p className="mx-auto mt-12 max-w-2xl rounded-2xl border border-[var(--e-line)] bg-[var(--e-surface)] px-5 py-4 text-center text-sm text-[var(--e-muted)]">{c.partnership.disclaimer}</p>
            </div>
          </section>
        )}

        {/* 10 DEPOIMENTOS */}
        {on("testimonials") && (
          <section id="edu-testimonials" className="bg-[var(--e-alt)] px-5 py-20 md:py-28">
            <div className="mx-auto max-w-6xl">
              <Heading eyebrow="Depoimentos" title={c.testimonials.title} subtitle={c.testimonials.subtitle} />
              <div className="mt-12 grid gap-6 md:grid-cols-3">
                {c.testimonials.items.map((x, i) => (
                  <Reveal key={x.id} delay={i * 90} className={`flex flex-col rounded-[2rem] bg-[var(--e-surface)] p-7 ${i === 1 ? "md:translate-y-8" : ""}`}>
                    <span aria-hidden className="edu-h text-5xl leading-none text-[var(--e-accent)]">“</span>
                    <p className="mt-2 flex-1 leading-relaxed">{x.text}</p>
                    <div className="mt-6 border-t border-[var(--e-line)] pt-4"><p className="font-bold">{x.name}</p><p className="text-sm text-[var(--e-muted)]">{x.relation}</p></div>
                  </Reveal>
                ))}
              </div>
              <p className="mt-14 text-center text-xs text-[var(--e-muted)]">{c.testimonials.disclaimer}</p>
            </div>
          </section>
        )}

        {/* 11 FAQ */}
        {on("faq") && (
          <section id="edu-faq" className="px-5 py-20 md:py-28">
            <div className="mx-auto grid max-w-5xl gap-10 md:grid-cols-[0.7fr_1.3fr]">
              <Heading eyebrow="Dúvidas" title={c.faq.title} />
              <ul className="space-y-3">
                {c.faq.items.map((f) => {
                  const open = openFaq === f.id;
                  return (
                    <li key={f.id} className="rounded-2xl border border-[var(--e-line)] bg-[var(--e-surface)]">
                      <h3>
                        <button aria-expanded={open} aria-controls={`faq-${f.id}`} onClick={() => setOpenFaq(open ? null : f.id)} className="flex min-h-14 w-full items-center justify-between gap-4 px-5 py-4 text-left font-semibold">
                          {f.question}
                          <ChevronDown aria-hidden className={`size-5 shrink-0 text-[var(--e-primary)] transition-transform ${open ? "rotate-180" : ""}`} />
                        </button>
                      </h3>
                      <div id={`faq-${f.id}`} hidden={!open} className="px-5 pb-5 text-sm leading-relaxed text-[var(--e-muted)]">{f.answer}</div>
                    </li>
                  );
                })}
              </ul>
            </div>
          </section>
        )}

        {/* 12 CTA */}
        {on("cta") && (
          <section id="edu-cta" className="px-5 pb-20 md:pb-28">
            <Reveal className="relative mx-auto max-w-5xl overflow-hidden rounded-[2.5rem] bg-[var(--e-primary)] px-6 py-16 text-center text-[var(--e-primary-text)] md:px-16 md:py-20">
              <div aria-hidden className="absolute -left-16 -top-16 size-56 rounded-full bg-[var(--e-sage)] opacity-25" />
              <div aria-hidden className="absolute -bottom-20 -right-10 size-64 rounded-full bg-[var(--e-accent)] opacity-20" />
              <h2 className="edu-h relative mx-auto max-w-2xl text-3xl leading-tight md:text-4xl">{c.cta.title}</h2>
              <p className="relative mx-auto mt-5 max-w-xl text-lg opacity-90">{c.cta.text}</p>
              <a href={contactHref} className="relative mt-9 inline-flex min-h-12 items-center justify-center rounded-full bg-[var(--e-surface)] px-7 font-semibold text-[var(--e-primary)] transition-transform hover:-translate-y-0.5">{c.cta.buttonLabel}</a>
            </Reveal>
          </section>
        )}
      </main>

      {/* 13 FOOTER */}
      {on("footer") && (
        <footer className="border-t border-[var(--e-line)] bg-[var(--e-surface)] px-5 pb-8 pt-16">
          <div className="mx-auto grid max-w-6xl gap-10 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr_1.3fr]">
            <div>
              <p className="text-[13px] font-bold uppercase tracking-[0.14em]">{c.brand.name}</p>
              <p className="mt-3 text-sm text-[var(--e-muted)]">{c.footer.description}</p>
              {c.footer.socials.length > 0 && (
                <ul className="mt-4 flex gap-3">{c.footer.socials.map((s) => <li key={s.label}><a href={s.url} target="_blank" rel="noreferrer" className="text-sm underline">{s.label}</a></li>)}</ul>
              )}
            </div>
            {c.footer.columns.map((col) => (
              <div key={col.title}>
                <p className="text-sm font-bold">{col.title}</p>
                <ul className="mt-3 space-y-2 text-sm text-[var(--e-muted)]">{col.links.map((l) => <li key={l}>{l}</li>)}</ul>
              </div>
            ))}
            <div>
              <p className="text-sm font-bold">Contato</p>
              <ul className="mt-3 space-y-2 text-sm text-[var(--e-muted)]">
                <li className="flex items-start gap-2"><Mail aria-hidden className="mt-0.5 size-4 shrink-0" /><a href={contactHref} className="break-all hover:text-[var(--e-text)]">{c.contact.email}</a></li>
                <li className="flex items-center gap-2"><Phone aria-hidden className="size-4 shrink-0" />{c.contact.phone}</li>
                <li className="flex items-center gap-2"><MapPin aria-hidden className="size-4 shrink-0" />{c.contact.city}</li>
              </ul>
            </div>
          </div>
          <p className="mx-auto mt-12 max-w-6xl border-t border-[var(--e-line)] pt-6 text-xs text-[var(--e-muted)]">© {new Date().getFullYear()} {c.brand.name} · {c.footer.legal}</p>
        </footer>
      )}
    </div>
  );
}
