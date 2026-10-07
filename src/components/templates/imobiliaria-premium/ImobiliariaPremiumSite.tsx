import { useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { ArrowRight, Bath, BedDouble, Car, Mail, MapPin, Menu, Phone, Ruler, Search, ShieldCheck, UserRound, X, Compass, Quote, MessageCircle } from "lucide-react";
import type { ImobiliariaContent, ImobiliariaSectionKey, Property } from "@/lib/templates/imobiliaria-premium/content";

/**
 * Estrutura visual do Template 01 — Imobiliária Premium.
 * Todo texto, imagem, cor e dado vem de `content` (nada de negócio hardcoded),
 * permitindo que o NexusBuild gere sites de clientes trocando apenas os dados.
 */

export function useReveal<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const io = new IntersectionObserver(([e]) => { if (e?.isIntersecting) { setShown(true); io.disconnect(); } }, { threshold: 0.12 });
    io.observe(node);
    return () => io.disconnect();
  }, []);
  return { ref, shown };
}

export function Reveal({ children, delay = 0, className = "" }: { children: ReactNode; delay?: number; className?: string }) {
  const { ref, shown } = useReveal<HTMLDivElement>();
  return (
    <div ref={ref} className={`transition-all duration-[900ms] ease-out motion-reduce:transition-none ${shown ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"} ${className}`} style={{ transitionDelay: `${delay}ms` }}>
      {children}
    </div>
  );
}

export function CountUp({ value, prefix = "", suffix = "" }: { value: number; prefix?: string | undefined; suffix?: string | undefined }) {
  const { ref, shown } = useReveal<HTMLSpanElement>();
  const [n, setN] = useState(0);
  useEffect(() => {
    if (!shown) return;
    let raf = 0; const start = performance.now();
    const tick = (t: number) => { const p = Math.min(1, (t - start) / 1600); setN(Math.round(value * (1 - Math.pow(1 - p, 3)))); if (p < 1) raf = requestAnimationFrame(tick); };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [shown, value]);
  return <span ref={ref}>{prefix}{n}{suffix}</span>;
}

const ICONS = { user: UserRound, search: Search, map: Compass, shield: ShieldCheck };

function SectionHead({ title, subtitle, center = true }: { title: string; subtitle?: string; center?: boolean }) {
  return (
    <Reveal className={center ? "mx-auto max-w-2xl text-center" : "max-w-2xl"}>
      <span className={`mb-4 block h-px w-12 bg-[var(--rp-accent)] ${center ? "mx-auto" : ""}`} />
      <h2 className="rp-h text-3xl font-light leading-tight tracking-tight sm:text-4xl lg:text-5xl">{title}</h2>
      {subtitle ? <p className="mt-4 text-base text-[var(--rp-muted)] sm:text-lg">{subtitle}</p> : null}
    </Reveal>
  );
}

function PropertyCard({ p }: { p: Property }) {
  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-[var(--rp-line)] bg-[var(--rp-surface)] transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_30px_60px_-25px_rgba(0,0,0,0.8)]">
      <div className="relative aspect-[4/3] overflow-hidden">
        <img src={p.image} alt={p.title} loading="lazy" className="h-full w-full object-cover transition-transform duration-[1200ms] ease-out group-hover:scale-110" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        {p.tag ? <span className="absolute left-4 top-4 rounded-full bg-[var(--rp-accent)] px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-[var(--rp-accent-text)]">{p.tag}</span> : null}
        <span className="absolute bottom-4 left-4 text-2xl font-medium text-white">{p.price}</span>
      </div>
      <div className="flex flex-1 flex-col p-5">
        <h3 className="rp-h text-xl font-normal">{p.title}</h3>
        <p className="mt-1 flex items-center gap-1.5 text-sm text-[var(--rp-muted)]"><MapPin className="size-3.5" />{p.location}</p>
        <div className="mt-5 grid grid-cols-4 gap-2 border-t border-[var(--rp-line)] pt-4 text-xs text-[var(--rp-muted)]">
          <span className="flex items-center gap-1"><BedDouble className="size-3.5" />{p.bedrooms}</span>
          <span className="flex items-center gap-1"><Bath className="size-3.5" />{p.bathrooms}</span>
          <span className="flex items-center gap-1"><Car className="size-3.5" />{p.parking}</span>
          <span className="flex items-center gap-1"><Ruler className="size-3.5" />{p.area}m²</span>
        </div>
        <button type="button" className="mt-5 inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-[var(--rp-accent)]/60 text-sm text-[var(--rp-accent)] transition-colors duration-300 group-hover:bg-[var(--rp-accent)] group-hover:text-[var(--rp-accent-text)]">
          Ver imóvel <ArrowRight className="size-4" />
        </button>
      </div>
    </article>
  );
}

export function ImobiliariaPremiumSite({ content: c }: { content: ImobiliariaContent }) {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [offset, setOffset] = useState(0);
  const [deal, setDeal] = useState(c.search.dealOptions[0] ?? "Comprar");
  const [city, setCity] = useState("");
  const [type, setType] = useState(c.search.typeOptions[0] ?? "");
  const [price, setPrice] = useState(c.search.priceOptions[0] ?? "");
  const [query, setQuery] = useState<{ deal: string; city: string; type: string } | null>(null);

  useEffect(() => {
    const onScroll = () => { setScrolled(window.scrollY > 40); setOffset(Math.min(window.scrollY, 900)); };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const go = (target: ImobiliariaSectionKey) => { setMenuOpen(false); document.getElementById(`rp-${target}`)?.scrollIntoView({ behavior: "smooth" }); };

  const results = useMemo(() => {
    const all = c.featured.properties;
    if (!query) return all.slice(0, 6);
    return all.filter((p) =>
      p.deal === (query.deal.toLowerCase().startsWith("alug") ? "alugar" : "comprar") &&
      (query.type === c.search.typeOptions[0] || p.type === query.type) &&
      (!query.city || p.location.toLowerCase().includes(query.city.toLowerCase())));
  }, [query, c]);

  const vars = {
    "--rp-bg": c.theme.background, "--rp-surface": c.theme.surface, "--rp-text": c.theme.text,
    "--rp-muted": c.theme.muted, "--rp-accent": c.theme.accent, "--rp-accent-text": c.theme.accentText,
    "--rp-line": "rgba(255,255,255,0.08)", "--rp-hf": `'${c.theme.headingFont}', system-ui, sans-serif`,
    fontFamily: `'${c.theme.bodyFont}', system-ui, sans-serif`,
  } as CSSProperties;

  const field = "min-h-12 w-full rounded-xl border border-[var(--rp-line)] bg-white/5 px-4 text-sm text-[var(--rp-text)] outline-none transition focus:border-[var(--rp-accent)]";

  const blocks: Record<ImobiliariaSectionKey, ReactNode> = {
    navbar: (
      <header key="navbar" className={`fixed inset-x-0 top-0 z-50 transition-all duration-500 ${scrolled ? "border-b border-[var(--rp-line)] bg-[color-mix(in_oklab,var(--rp-bg)_72%,transparent)] py-3 shadow-[0_10px_40px_-20px_rgba(0,0,0,0.8)] backdrop-blur-xl" : "py-5"}`}>
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 sm:px-8">
          <button type="button" onClick={() => go("hero")} className="flex items-center gap-2.5 text-left">
            {c.brand.logoUrl ? <img src={c.brand.logoUrl} alt={c.brand.name} className="h-8 w-auto" /> : <span className="flex size-9 items-center justify-center rounded-full border border-[var(--rp-accent)] text-sm text-[var(--rp-accent)] rp-h">{c.brand.name.charAt(0)}</span>}
            <span className="rp-h text-lg tracking-wide text-white">{c.brand.name}</span>
          </button>
          <nav className="hidden items-center gap-8 lg:flex">
            {c.nav.items.map((i) => <button key={i.label} type="button" onClick={() => go(i.target)} className="text-sm text-white/80 transition hover:text-[var(--rp-accent)]">{i.label}</button>)}
          </nav>
          <button type="button" onClick={() => go("cta")} className="hidden min-h-11 rounded-full bg-[var(--rp-accent)] px-6 text-sm font-medium text-[var(--rp-accent-text)] transition hover:brightness-110 lg:inline-flex lg:items-center">{c.nav.ctaLabel}</button>
          <button type="button" aria-label={menuOpen ? "Fechar menu" : "Abrir menu"} onClick={() => setMenuOpen((v) => !v)} className="flex size-11 items-center justify-center rounded-full border border-white/20 text-white lg:hidden">{menuOpen ? <X className="size-5" /> : <Menu className="size-5" />}</button>
        </div>
        <div className={`overflow-hidden transition-[max-height] duration-500 lg:hidden ${menuOpen ? "max-h-[480px]" : "max-h-0"}`}>
          <nav className="mx-5 mt-3 flex flex-col rounded-2xl border border-[var(--rp-line)] bg-[var(--rp-surface)] p-3">
            {c.nav.items.map((i) => <button key={i.label} type="button" onClick={() => go(i.target)} className="min-h-12 rounded-lg px-3 text-left text-[var(--rp-text)] hover:bg-white/5">{i.label}</button>)}
            <button type="button" onClick={() => go("cta")} className="mt-2 min-h-12 rounded-full bg-[var(--rp-accent)] font-medium text-[var(--rp-accent-text)]">{c.nav.ctaLabel}</button>
          </nav>
        </div>
      </header>
    ),
    hero: (
      <section key="hero" id="rp-hero" className="relative flex min-h-[100svh] items-center overflow-hidden">
        <img src={c.hero.image} alt="" className="absolute inset-0 h-[120%] w-full object-cover will-change-transform motion-safe:animate-[rpzoom_24s_ease-out_forwards]" style={{ transform: `translate3d(0, ${offset * 0.3}px, 0)` }} />
        <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/50 to-black/20" />
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--rp-bg)] via-transparent to-black/30" />
        <div className="relative mx-auto w-full max-w-7xl px-5 pb-56 pt-32 sm:px-8 lg:pb-48">
          <Reveal><span className="inline-flex items-center gap-3 text-xs uppercase tracking-[0.3em] text-[var(--rp-accent)]"><span className="h-px w-10 bg-[var(--rp-accent)]" />{c.hero.eyebrow}</span></Reveal>
          <Reveal delay={120}><h1 className="rp-h mt-6 max-w-3xl text-4xl font-light leading-[1.08] text-white sm:text-6xl lg:text-7xl">{c.hero.title}</h1></Reveal>
          <Reveal delay={240}><p className="mt-6 max-w-xl text-base text-white/75 sm:text-lg">{c.hero.text}</p></Reveal>
          <Reveal delay={360} className="mt-9 flex flex-col gap-3 sm:flex-row">
            <button type="button" onClick={() => go("featured")} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[var(--rp-accent)] px-7 font-medium text-[var(--rp-accent-text)] transition hover:gap-3 hover:brightness-110">{c.hero.primaryCta}<ArrowRight className="size-4" /></button>
            <button type="button" onClick={() => go("developments")} className="inline-flex min-h-12 items-center justify-center rounded-full border border-white/30 px-7 text-white backdrop-blur transition hover:border-white hover:bg-white/10">{c.hero.secondaryCta}</button>
          </Reveal>
        </div>
      </section>
    ),
    search: (
      <section key="search" id="rp-search" className="relative z-10 mx-auto -mt-44 max-w-6xl px-5 sm:px-8 lg:-mt-32">
        <Reveal>
          <form onSubmit={(e) => { e.preventDefault(); setQuery({ deal, city, type }); go("featured"); }} className="rounded-3xl border border-white/10 bg-[color-mix(in_oklab,var(--rp-surface)_80%,transparent)] p-4 shadow-[0_40px_80px_-30px_rgba(0,0,0,0.9)] backdrop-blur-2xl sm:p-6">
            <div className="mb-4 flex gap-2">
              {c.search.dealOptions.map((o) => <button key={o} type="button" onClick={() => setDeal(o)} className={`min-h-10 rounded-full px-5 text-sm transition ${deal === o ? "bg-[var(--rp-accent)] text-[var(--rp-accent-text)]" : "text-[var(--rp-muted)] hover:text-[var(--rp-text)]"}`}>{o}</button>)}
            </div>
            <div className="grid gap-3 md:grid-cols-[1.3fr_1fr_1fr_auto]">
              <label className="sr-only" htmlFor="rp-city">{c.search.cityPlaceholder}</label>
              <input id="rp-city" value={city} onChange={(e) => setCity(e.target.value)} placeholder={c.search.cityPlaceholder} className={field} />
              <select aria-label="Tipo de imóvel" value={type} onChange={(e) => setType(e.target.value)} className={field}>{c.search.typeOptions.map((o) => <option key={o} className="bg-[var(--rp-surface)]">{o}</option>)}</select>
              <select aria-label="Faixa de preço" value={price} onChange={(e) => setPrice(e.target.value)} className={field}>{c.search.priceOptions.map((o) => <option key={o} className="bg-[var(--rp-surface)]">{o}</option>)}</select>
              <button type="submit" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[var(--rp-accent)] px-6 font-medium text-[var(--rp-accent-text)] transition hover:brightness-110"><Search className="size-4" />{c.search.buttonLabel}</button>
            </div>
          </form>
        </Reveal>
      </section>
    ),
    featured: (
      <section key="featured" id="rp-featured" className="mx-auto max-w-7xl scroll-mt-24 px-5 py-24 sm:px-8 lg:py-32">
        <SectionHead title={c.featured.title} subtitle={c.featured.subtitle} />
        {query ? (
          <p className="mt-6 text-center text-sm text-[var(--rp-muted)]">
            {results.length} {results.length === 1 ? "imóvel encontrado" : "imóveis encontrados"} ·{" "}
            <button type="button" className="text-[var(--rp-accent)] underline-offset-4 hover:underline" onClick={() => setQuery(null)}>limpar busca</button>
          </p>
        ) : null}
        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {results.map((p, i) => <Reveal key={p.id} delay={(i % 3) * 120}><PropertyCard p={p} /></Reveal>)}
          {results.length === 0 ? <p className="col-span-full text-center text-[var(--rp-muted)]">Nenhum imóvel com esses filtros. Fale com um consultor e encontramos para você.</p> : null}
        </div>
      </section>
    ),
    types: (
      <section key="types" id="rp-types" className="scroll-mt-24 bg-[var(--rp-surface)] py-24 lg:py-32">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <SectionHead title={c.types.title} subtitle={c.types.subtitle} />
          <div className="mt-14 grid grid-cols-2 gap-4 lg:grid-cols-3">
            {c.types.categories.map((cat, i) => (
              <Reveal key={cat.id} delay={(i % 3) * 100}>
                <button type="button" onClick={() => go("featured")} className="group relative block aspect-[4/5] w-full overflow-hidden rounded-2xl text-left sm:aspect-[4/3]">
                  <img src={cat.image} alt={cat.label} loading="lazy" className="absolute inset-0 h-full w-full object-cover transition-transform duration-[1200ms] group-hover:scale-110" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent transition-opacity group-hover:opacity-90" />
                  <div className="absolute inset-x-0 bottom-0 p-4 sm:p-6">
                    <h3 className="rp-h text-xl text-white sm:text-2xl">{cat.label}</h3>
                    <p className="mt-1 flex items-center gap-2 text-xs text-white/70 sm:text-sm">{cat.count}<ArrowRight className="size-3.5 -translate-x-2 opacity-0 transition-all duration-500 group-hover:translate-x-0 group-hover:opacity-100" /></p>
                  </div>
                </button>
              </Reveal>
            ))}
          </div>
        </div>
      </section>
    ),
    developments: (
      <section key="developments" id="rp-developments" className="mx-auto max-w-7xl scroll-mt-24 px-5 py-24 sm:px-8 lg:py-32">
        <SectionHead title={c.developments.title} subtitle={c.developments.subtitle} center={false} />
        <div className="mt-14 grid gap-6 lg:grid-cols-2">
          {c.developments.items.map((d, i) => (
            <Reveal key={d.id} delay={i * 150}>
              <article className="group relative aspect-[4/5] overflow-hidden rounded-3xl sm:aspect-[16/11]">
                <img src={d.image} alt={d.name} loading="lazy" className="absolute inset-0 h-full w-full object-cover transition-transform duration-[1500ms] group-hover:scale-105" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
                <span className="absolute left-5 top-5 rounded-full border border-white/30 bg-black/30 px-4 py-1.5 text-xs uppercase tracking-widest text-white backdrop-blur">{d.status}</span>
                <div className="absolute inset-x-0 bottom-0 p-6 sm:p-8">
                  <p className="flex items-center gap-1.5 text-sm text-white/70"><MapPin className="size-4" />{d.location}</p>
                  <h3 className="rp-h mt-2 text-3xl font-light text-white sm:text-4xl">{d.name}</h3>
                  <p className="mt-2 text-[var(--rp-accent)]">{d.priceRange}</p>
                  <button type="button" onClick={() => go("cta")} className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-full bg-white px-6 text-sm font-medium text-black transition hover:gap-3">{d.ctaLabel}<ArrowRight className="size-4" /></button>
                </div>
              </article>
            </Reveal>
          ))}
        </div>
      </section>
    ),
    differentials: (
      <section key="differentials" id="rp-differentials" className="border-y border-[var(--rp-line)] py-24 lg:py-32">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <SectionHead title={c.differentials.title} subtitle={c.differentials.subtitle} />
          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {c.differentials.items.map((d, i) => {
              const Icon = ICONS[d.icon];
              return (
                <Reveal key={d.id} delay={i * 120}>
                  <div className="group h-full rounded-2xl border border-[var(--rp-line)] p-7 transition duration-500 hover:-translate-y-1 hover:border-[var(--rp-accent)]/50 hover:bg-white/[0.02]">
                    <span className="flex size-12 items-center justify-center rounded-full border border-[var(--rp-accent)]/40 text-[var(--rp-accent)] transition group-hover:bg-[var(--rp-accent)] group-hover:text-[var(--rp-accent-text)]"><Icon className="size-5" /></span>
                    <h3 className="rp-h mt-6 text-lg">{d.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-[var(--rp-muted)]">{d.text}</p>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>
    ),
    about: (
      <section key="about" id="rp-about" className="mx-auto max-w-7xl scroll-mt-24 px-5 py-24 sm:px-8 lg:py-32">
        <div className="grid items-center gap-14 lg:grid-cols-[1.05fr_0.95fr]">
          <Reveal className="relative pb-16 pr-10 sm:pr-20">
            <img src={c.about.image} alt={c.about.title} loading="lazy" className="aspect-[4/5] w-full rounded-3xl object-cover" />
            <img src={c.about.secondaryImage} alt="" loading="lazy" className="absolute bottom-0 right-0 aspect-square w-[45%] rounded-2xl border-4 border-[var(--rp-bg)] object-cover shadow-2xl motion-safe:animate-[rpfloat_7s_ease-in-out_infinite]" />
          </Reveal>
          <div>
            <Reveal><span className="text-xs uppercase tracking-[0.3em] text-[var(--rp-accent)]">{c.about.eyebrow}</span></Reveal>
            <Reveal delay={100}><h2 className="rp-h mt-4 text-3xl font-light leading-tight sm:text-5xl">{c.about.title}</h2></Reveal>
            {c.about.paragraphs.map((p, i) => <Reveal key={i} delay={200 + i * 80}><p className="mt-5 leading-relaxed text-[var(--rp-muted)]">{p}</p></Reveal>)}
            <Reveal delay={400} className="mt-10 grid grid-cols-3 gap-4 border-t border-[var(--rp-line)] pt-8">
              {c.about.stats.map((s) => (
                <div key={s.label}>
                  <div className="rp-h text-3xl font-light text-[var(--rp-accent)] sm:text-4xl"><CountUp value={s.value} prefix={s.prefix} suffix={s.suffix} /></div>
                  <p className="mt-1 text-xs text-[var(--rp-muted)] sm:text-sm">{s.label}</p>
                </div>
              ))}
            </Reveal>
            <p className="mt-6 text-[11px] italic text-[var(--rp-muted)]/70">{c.about.disclaimer}</p>
          </div>
        </div>
      </section>
    ),
    testimonials: (
      <section key="testimonials" id="rp-testimonials" className="bg-[var(--rp-surface)] py-24 lg:py-32">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <SectionHead title={c.testimonials.title} subtitle={c.testimonials.subtitle} />
          <div className="-mx-5 mt-14 flex snap-x snap-mandatory gap-5 overflow-x-auto px-5 pb-4 md:mx-0 md:grid md:grid-cols-3 md:overflow-visible md:px-0">
            {c.testimonials.items.map((t, i) => (
              <Reveal key={t.id} delay={i * 120} className="w-[85%] shrink-0 snap-center md:w-auto">
                <figure className="flex h-full flex-col rounded-2xl border border-[var(--rp-line)] bg-[var(--rp-bg)] p-7 transition duration-500 hover:-translate-y-1">
                  <Quote className="size-7 text-[var(--rp-accent)]" />
                  <blockquote className="mt-4 flex-1 leading-relaxed text-[var(--rp-text)]/90">“{t.text}”</blockquote>
                  <figcaption className="mt-6 flex items-center gap-3">
                    <img src={t.avatar} alt="" loading="lazy" className="size-11 rounded-full object-cover" />
                    <div><p className="text-sm font-medium">{t.name}</p><p className="text-xs text-[var(--rp-muted)]">{t.location}</p></div>
                  </figcaption>
                </figure>
              </Reveal>
            ))}
          </div>
          <p className="mt-8 text-center text-[11px] italic text-[var(--rp-muted)]/70">{c.testimonials.disclaimer}</p>
        </div>
      </section>
    ),
    cta: (
      <section key="cta" id="rp-cta" className="relative overflow-hidden py-32 lg:py-44">
        <img src={c.cta.image} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-black/65" />
        <div className="absolute inset-0 bg-gradient-to-b from-[var(--rp-surface)] via-transparent to-[var(--rp-bg)] opacity-80" />
        <Reveal className="relative mx-auto max-w-3xl px-5 text-center sm:px-8">
          <h2 className="rp-h text-4xl font-light leading-tight text-white sm:text-6xl">{c.cta.title}</h2>
          <p className="mx-auto mt-6 max-w-xl text-white/75 sm:text-lg">{c.cta.text}</p>
          <div className="mt-10 flex flex-col justify-center gap-3 sm:flex-row">
            <button type="button" onClick={() => go("search")} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[var(--rp-accent)] px-8 font-medium text-[var(--rp-accent-text)] transition hover:gap-3 hover:brightness-110">{c.cta.buttonLabel}<ArrowRight className="size-4" /></button>
            <span className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-white/30 px-8 text-white"><MessageCircle className="size-4" />WhatsApp {c.contact.whatsapp}</span>
          </div>
        </Reveal>
      </section>
    ),
    footer: (
      <footer key="footer" id="rp-footer" className="border-t border-[var(--rp-line)] bg-black/40 pt-20">
        <div className="mx-auto grid max-w-7xl gap-12 px-5 sm:px-8 md:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr_1.2fr]">
          <div>
            <p className="rp-h text-xl text-[var(--rp-accent)]">{c.brand.name}</p>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-[var(--rp-muted)]">{c.footer.description}</p>
            <div className="mt-6 flex flex-wrap gap-2">{c.footer.socials.map((s) => <span key={s} className="rounded-full border border-[var(--rp-line)] px-3 py-1.5 text-xs text-[var(--rp-muted)]">{s}</span>)}</div>
          </div>
          {c.footer.columns.map((col) => (
            <div key={col.title}>
              <p className="text-xs uppercase tracking-[0.2em] text-[var(--rp-text)]">{col.title}</p>
              <ul className="mt-5 space-y-3">{col.links.map((l) => <li key={l} className="text-sm text-[var(--rp-muted)] transition hover:text-[var(--rp-accent)]">{l}</li>)}</ul>
            </div>
          ))}
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-[var(--rp-text)]">Contato</p>
            <ul className="mt-5 space-y-3 text-sm text-[var(--rp-muted)]">
              <li className="flex gap-2"><MapPin className="mt-0.5 size-4 shrink-0" />{c.contact.address}</li>
              <li className="flex gap-2"><Phone className="mt-0.5 size-4 shrink-0" />{c.contact.phone}</li>
              <li className="flex gap-2 break-all"><Mail className="mt-0.5 size-4 shrink-0" />{c.contact.email}</li>
              <li>{c.contact.hours}</li>
            </ul>
          </div>
        </div>
        <div className="mx-auto mt-16 flex max-w-7xl flex-col gap-2 border-t border-[var(--rp-line)] px-5 py-6 text-xs text-[var(--rp-muted)] sm:flex-row sm:justify-between sm:px-8">
          <span>© {new Date().getFullYear()} {c.brand.name}. Todos os direitos reservados.</span>
          <span>{c.footer.legal}</span>
        </div>
      </footer>
    ),
  };

  return (
    <div style={vars} className="min-h-screen overflow-x-clip bg-[var(--rp-bg)] text-[var(--rp-text)] antialiased">
      <style>{`.rp-h{font-family:var(--rp-hf)}@keyframes rpzoom{from{scale:1.12}to{scale:1}}@keyframes rpfloat{0%,100%{translate:0 0}50%{translate:0 -12px}}`}</style>
      {c.sections.map((k) => blocks[k])}
    </div>
  );
}
