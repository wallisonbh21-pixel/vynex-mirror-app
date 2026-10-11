import { useEffect, useRef, useState, type CSSProperties, type FormEvent, type ReactNode } from "react";
import {
  ArrowRight, Briefcase, ChevronDown, Compass, Eye, FileText, HardHat, Lock, Mail, MapPin, Menu, MessageSquare,
  Phone, Receipt, Scale, Shield, Target, Users, X, Clock, type LucideIcon,
} from "lucide-react";
import type { AdvIcon, AdvocaciaContent } from "@/lib/templates/advocacia-empresarial/content";

const ICONS: Record<AdvIcon, LucideIcon> = {
  briefcase: Briefcase, file: FileText, users: Users, shield: Shield, lock: Lock, "hard-hat": HardHat,
  receipt: Receipt, scale: Scale, compass: Compass, eye: Eye, message: MessageSquare, target: Target,
};

function Reveal({ children, delay = 0, className = "" }: { children: ReactNode; delay?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const io = new IntersectionObserver(([e]) => { if (e?.isIntersecting) { setShown(true); io.disconnect(); } }, { threshold: 0.12 });
    io.observe(node);
    return () => io.disconnect();
  }, []);
  return <div ref={ref} className={`adv-reveal ${shown ? "is-in" : ""} ${className}`} style={{ transitionDelay: `${delay}ms` }}>{children}</div>;
}

function Eyebrow({ children, light = false }: { children: ReactNode; light?: boolean }) {
  return (
    <p className="mb-4 flex items-center gap-3 text-[0.72rem] font-semibold uppercase tracking-[0.24em]" style={{ color: "var(--gold)" }}>
      <span className="h-px w-8" style={{ background: "var(--gold)" }} />
      <span style={light ? { color: "var(--gold)" } : undefined}>{children}</span>
    </p>
  );
}

const H2 = ({ children, light = false, className = "" }: { children: ReactNode; light?: boolean; className?: string }) => (
  <h2 className={`adv-serif text-[2.1rem] leading-[1.1] sm:text-[2.75rem] ${className}`} style={{ color: light ? "#fff" : "var(--navy)" }}>{children}</h2>
);

type FormState = "idle" | "sending" | "success" | "error" | "unconfigured";

export function AdvocaciaEmpresarialSite({ content: c }: { content: AdvocaciaContent }) {
  const t = c.theme;
  const [menu, setMenu] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [faq, setFaq] = useState<string | null>(c.faq.items[0]?.id ?? null);
  const [cat, setCat] = useState(c.insights.categories[0] ?? "Todos");
  const [form, setForm] = useState({ nome: "", empresa: "", email: "", telefone: "", demanda: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<FormState>("idle");

  useEffect(() => {
    const f = () => setScrolled(window.scrollY > 24);
    f();
    window.addEventListener("scroll", f, { passive: true });
    return () => window.removeEventListener("scroll", f);
  }, []);

  const vars = {
    "--navy": t.navy, "--navy-deep": t.navyDeep, "--gold": t.gold, "--ink": t.ink, "--muted": t.muted,
    "--paper": t.paper, "--surface": t.surface, "--line": t.line,
    "--hf": `'${t.headingFont}', Georgia, serif`, "--bf": `'${t.bodyFont}', system-ui, sans-serif`,
  } as CSSProperties;

  const articles = cat === c.insights.categories[0] ? c.insights.articles : c.insights.articles.filter((a) => a.category === cat);

  const validate = () => {
    const e: Record<string, string> = {};
    if (form.nome.trim().length < 3) e["nome"] = "Informe seu nome completo.";
    if (form.empresa.trim().length < 2) e["empresa"] = "Informe o nome da empresa.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(form.email.trim())) e["email"] = "Informe um e-mail válido.";
    if (form.telefone && form.telefone.replace(/\D/g, "").length < 10) e["telefone"] = "Telefone incompleto. Ex.: (11) 99999-9999";
    if (form.demanda.trim().length < 20) e["demanda"] = "Descreva brevemente a demanda (mínimo de 20 caracteres).";
    return e;
  };

  const submit = async (ev: FormEvent) => {
    ev.preventDefault();
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length) { setStatus("idle"); return; }
    if (!c.contact.formEndpoint) { setStatus("unconfigured"); return; }
    setStatus("sending");
    try {
      const res = await fetch(c.contact.formEndpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      if (!res.ok) throw new Error();
      setStatus("success");
      setForm({ nome: "", empresa: "", email: "", telefone: "", demanda: "" });
    } catch { setStatus("error"); }
  };

  const field = (k: keyof typeof form, label: string, opts: { type?: string; optional?: boolean; area?: boolean; auto?: string } = {}) => {
    const err = errors[k];
    const common = {
      id: `adv-${k}`, value: form[k], "aria-invalid": !!err, "aria-describedby": err ? `adv-${k}-err` : undefined,
      onChange: (e: { target: { value: string } }) => setForm((f) => ({ ...f, [k]: e.target.value })),
      className: "adv-input w-full", autoComplete: opts.auto,
    };
    return (
      <div className={opts.area ? "sm:col-span-2" : ""}>
        <label htmlFor={`adv-${k}`} className="mb-1.5 block text-sm font-medium" style={{ color: "var(--ink)" }}>
          {label} {opts.optional && <span style={{ color: "var(--muted)" }}>(opcional)</span>}
        </label>
        {opts.area ? <textarea rows={5} {...common} /> : <input type={opts.type ?? "text"} {...common} />}
        {err && <p id={`adv-${k}-err`} className="mt-1 text-xs" style={{ color: "#A23B3B" }}>{err}</p>}
      </div>
    );
  };

  return (
    <div style={{ ...vars, fontFamily: "var(--bf)", background: "var(--paper)", color: "var(--ink)" }} className="min-h-screen overflow-x-hidden">
      <style>{`
        .adv-serif{font-family:var(--hf);font-weight:600;letter-spacing:-0.01em}
        .adv-reveal{opacity:0;transform:translateY(18px);transition:opacity .8s ease,transform .8s cubic-bezier(.2,.7,.2,1)}
        .adv-reveal.is-in{opacity:1;transform:none}
        .adv-card{transition:transform .35s ease,box-shadow .35s ease,border-color .35s ease}
        .adv-card:hover{transform:translateY(-4px);box-shadow:0 18px 40px -22px rgba(11,20,40,.35);border-color:var(--gold)}
        .adv-link{position:relative}
        .adv-link:after{content:"";position:absolute;left:0;bottom:-4px;height:1px;width:100%;background:var(--gold);transform:scaleX(0);transform-origin:left;transition:transform .3s ease}
        .adv-link:hover:after,.adv-link:focus-visible:after{transform:scaleX(1)}
        .adv-btn{display:inline-flex;align-items:center;gap:.6rem;min-height:48px;padding:0 1.6rem;font-weight:600;font-size:.9rem;letter-spacing:.02em;transition:background .25s,color .25s,transform .25s}
        .adv-btn:hover{transform:translateY(-1px)}
        .adv-input{border:1px solid var(--line);background:#fff;padding:.8rem .95rem;font-size:.95rem;border-radius:2px;outline:none;transition:border-color .2s,box-shadow .2s}
        .adv-input:focus{border-color:var(--navy);box-shadow:0 0 0 3px rgba(176,141,87,.25)}
        .adv-input[aria-invalid=true]{border-color:#A23B3B}
        a:focus-visible,button:focus-visible{outline:2px solid var(--gold);outline-offset:3px}
        @keyframes adv-line{from{transform:scaleY(0)}to{transform:scaleY(1)}}
        @keyframes adv-float{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}
        .adv-hero-line{transform-origin:top;animation:adv-line 1.6s ease forwards}
        .adv-float{animation:adv-float 7s ease-in-out infinite}
        @media (prefers-reduced-motion: reduce){.adv-reveal{opacity:1;transform:none;transition:none}.adv-hero-line,.adv-float{animation:none}.adv-card,.adv-btn{transition:none}.adv-card:hover,.adv-btn:hover{transform:none}html{scroll-behavior:auto}}
      `}</style>

      {/* 1. NAVEGAÇÃO */}
      <header className="fixed inset-x-0 top-0 z-50 transition-all duration-300" style={{ background: scrolled || menu ? "rgba(11,20,40,.96)" : "transparent", backdropFilter: scrolled ? "blur(10px)" : undefined, borderBottom: scrolled ? "1px solid rgba(176,141,87,.25)" : "1px solid transparent" }}>
        <div className="mx-auto flex h-[76px] max-w-7xl items-center justify-between px-5 sm:px-8">
          <a href="#inicio" className="flex items-center gap-3 text-white" aria-label={`${c.brand.name} — início`}>
            <span className="grid size-10 place-items-center border" style={{ borderColor: "var(--gold)" }}><Scale className="size-5" style={{ color: "var(--gold)" }} /></span>
            <span className="leading-tight"><span className="adv-serif block text-xl">{c.brand.shortName}</span><span className="block text-[0.62rem] uppercase tracking-[0.28em] text-white/60">Advocacia Empresarial</span></span>
          </a>
          <nav className="hidden items-center gap-7 lg:flex" aria-label="Navegação principal">
            {c.nav.map((n) => <a key={n.href} href={n.href} className="adv-link text-sm text-white/80 hover:text-white">{n.label}</a>)}
          </nav>
          <a href="#contato" className="adv-btn hidden border text-white hover:bg-white hover:text-[color:var(--navy)] lg:inline-flex" style={{ borderColor: "var(--gold)", minHeight: 42 }}>Consulta institucional</a>
          <button type="button" className="grid size-11 place-items-center text-white lg:hidden" aria-label={menu ? "Fechar menu" : "Abrir menu"} aria-expanded={menu} onClick={() => setMenu((m) => !m)}>
            {menu ? <X /> : <Menu />}
          </button>
        </div>
        {menu && (
          <nav className="border-t px-5 pb-6 lg:hidden" style={{ borderColor: "rgba(176,141,87,.25)" }} aria-label="Navegação móvel">
            {c.nav.map((n) => <a key={n.href} href={n.href} onClick={() => setMenu(false)} className="block border-b py-3.5 text-white/85" style={{ borderColor: "rgba(255,255,255,.08)" }}>{n.label}</a>)}
            <a href="#contato" onClick={() => setMenu(false)} className="adv-btn mt-5 w-full justify-center" style={{ background: "var(--gold)", color: "var(--navy-deep)" }}>Consulta institucional</a>
          </nav>
        )}
      </header>

      {/* 2. HERO */}
      <section id="inicio" className="relative overflow-hidden pb-20 pt-32 sm:pt-40 lg:pb-28" style={{ background: "var(--navy-deep)" }}>
        <div className="pointer-events-none absolute inset-0 opacity-[0.07]" style={{ backgroundImage: "linear-gradient(rgba(255,255,255,.6) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.6) 1px,transparent 1px)", backgroundSize: "80px 80px" }} />
        <div className="relative mx-auto grid max-w-7xl gap-14 px-5 sm:px-8 lg:grid-cols-[1.1fr_1fr] lg:items-center">
          <div className="min-w-0">
            <Reveal><Eyebrow light>{c.hero.eyebrow}</Eyebrow></Reveal>
            <Reveal delay={80}><h1 className="adv-serif text-[2.6rem] leading-[1.05] text-white sm:text-[3.6rem] lg:text-[4.1rem]">{c.hero.title}</h1></Reveal>
            <Reveal delay={160}><p className="mt-6 max-w-xl text-base leading-relaxed text-white/70 sm:text-lg">{c.hero.text}</p></Reveal>
            <Reveal delay={240}>
              <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                <a href="#contato" className="adv-btn justify-center" style={{ background: "var(--gold)", color: "var(--navy-deep)" }}>{c.hero.primaryCta} <ArrowRight className="size-4" /></a>
                <a href="#areas" className="adv-btn justify-center border border-white/25 text-white hover:border-white">{c.hero.secondaryCta}</a>
              </div>
            </Reveal>
            <Reveal delay={320}>
              <ul className="mt-12 grid gap-3 border-t border-white/10 pt-6 sm:grid-cols-3">
                {c.hero.notes.map((n) => <li key={n} className="flex gap-2 text-sm text-white/65"><span className="mt-2 h-px w-3 shrink-0" style={{ background: "var(--gold)" }} />{n}</li>)}
              </ul>
            </Reveal>
          </div>
          <Reveal delay={200} className="relative min-w-0">
            <div className="adv-hero-line absolute -left-4 top-0 hidden h-full w-px lg:block" style={{ background: "linear-gradient(var(--gold),transparent)" }} />
            <div className="relative aspect-[4/5] overflow-hidden sm:aspect-[5/4] lg:aspect-[4/5]">
              <img src={c.hero.imageUrl} alt={c.hero.imageAlt} className="h-full w-full object-cover" />
              <div className="absolute inset-0" style={{ background: "linear-gradient(180deg,transparent 50%,rgba(11,20,40,.75))" }} />
            </div>
            <div className="adv-float absolute -bottom-6 left-4 right-4 border bg-white p-5 sm:left-auto sm:right-6 sm:w-72" style={{ borderColor: "var(--line)" }}>
              <p className="text-[0.68rem] uppercase tracking-[0.22em]" style={{ color: "var(--gold)" }}>Compromisso</p>
              <p className="adv-serif mt-1 text-xl" style={{ color: "var(--navy)" }}>Ética, sigilo e análise técnica individualizada.</p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* 3. INSTITUCIONAL */}
      <section id="escritorio" className="py-20 sm:py-28">
        <div className="mx-auto grid max-w-7xl gap-14 px-5 sm:px-8 lg:grid-cols-2 lg:items-center">
          <Reveal className="min-w-0"><img src={c.about.imageUrl} alt="Ambiente de trabalho jurídico" className="aspect-[4/3] w-full object-cover" /></Reveal>
          <div className="min-w-0">
            <Reveal><Eyebrow>{c.about.eyebrow}</Eyebrow><H2>{c.about.title}</H2></Reveal>
            <Reveal delay={100}><p className="mt-6 leading-relaxed">{c.about.history}</p><p className="mt-4 leading-relaxed" style={{ color: "var(--muted)" }}>{c.about.positioning}</p></Reveal>
            <div className="mt-8 grid gap-px sm:grid-cols-2" style={{ background: "var(--line)" }}>
              {c.about.values.map((v, i) => (
                <Reveal key={v.title} delay={i * 70}><div className="h-full p-5" style={{ background: "var(--paper)" }}><p className="adv-serif text-xl" style={{ color: "var(--navy)" }}>{v.title}</p><p className="mt-1 text-sm" style={{ color: "var(--muted)" }}>{v.text}</p></div></Reveal>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 4. ÁREAS */}
      <section id="areas" className="py-20 sm:py-28" style={{ background: "var(--surface)" }}>
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <Reveal className="max-w-2xl"><Eyebrow>{c.areas.eyebrow}</Eyebrow><H2>{c.areas.title}</H2><p className="mt-4" style={{ color: "var(--muted)" }}>{c.areas.text}</p></Reveal>
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {c.areas.items.map((a, i) => {
              const I = ICONS[a.icon];
              return (
                <Reveal key={a.id} delay={(i % 4) * 70}>
                  <article className="adv-card h-full border p-6" style={{ borderColor: "var(--line)", background: "var(--paper)" }}>
                    <I className="size-6" style={{ color: "var(--gold)" }} strokeWidth={1.5} />
                    <h3 className="adv-serif mt-5 text-[1.45rem]" style={{ color: "var(--navy)" }}>{a.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed" style={{ color: "var(--muted)" }}>{a.text}</p>
                  </article>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* 5. CONSULTIVO */}
      <section className="py-20 sm:py-28" style={{ background: "var(--navy)" }}>
        <div className="mx-auto grid max-w-7xl gap-12 px-5 sm:px-8 lg:grid-cols-[1fr_1.2fr]">
          <Reveal className="min-w-0"><Eyebrow light>{c.advisory.eyebrow}</Eyebrow><H2 light>{c.advisory.title}</H2><p className="mt-5 leading-relaxed text-white/70">{c.advisory.text}</p><p className="mt-6 border-l pl-4 text-sm text-white/55" style={{ borderColor: "var(--gold)" }}>{c.advisory.note}</p></Reveal>
          <div className="grid min-w-0 gap-4">
            {c.advisory.points.map((p, i) => (
              <Reveal key={p.title} delay={i * 90}>
                <div className="flex gap-5 border border-white/10 p-6 transition-colors hover:border-[color:var(--gold)]">
                  <span className="adv-serif text-3xl" style={{ color: "var(--gold)" }}>0{i + 1}</span>
                  <div><h3 className="text-lg font-semibold text-white">{p.title}</h3><p className="mt-1 text-sm text-white/65">{p.text}</p></div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* 6. SOLUÇÕES */}
      <section className="py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <Reveal className="max-w-2xl"><Eyebrow>{c.solutions.eyebrow}</Eyebrow><H2>{c.solutions.title}</H2></Reveal>
          <div className="mt-12 grid gap-6 lg:grid-cols-3">
            {c.solutions.items.map((s, i) => (
              <Reveal key={s.id} delay={i * 90}>
                <article className="adv-card flex h-full flex-col border bg-white p-7" style={{ borderColor: "var(--line)" }}>
                  <p className="text-[0.7rem] uppercase tracking-[0.22em]" style={{ color: "var(--gold)" }}>{s.audience}</p>
                  <h3 className="adv-serif mt-2 text-2xl" style={{ color: "var(--navy)" }}>{s.title}</h3>
                  <p className="mt-3 flex-1 text-sm leading-relaxed" style={{ color: "var(--muted)" }}>{s.text}</p>
                  <ul className="mt-6 space-y-2 border-t pt-5" style={{ borderColor: "var(--line)" }}>
                    {s.topics.map((tp) => <li key={tp} className="flex items-center gap-2 text-sm"><span className="size-1.5 rotate-45" style={{ background: "var(--gold)" }} />{tp}</li>)}
                  </ul>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* 7. METODOLOGIA */}
      <section id="metodologia" className="py-20 sm:py-28" style={{ background: "var(--surface)" }}>
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <Reveal className="max-w-2xl"><Eyebrow>{c.method.eyebrow}</Eyebrow><H2>{c.method.title}</H2><p className="mt-4" style={{ color: "var(--muted)" }}>{c.method.text}</p></Reveal>
          <ol className="mt-14 grid gap-8 md:grid-cols-5 md:gap-5">
            {c.method.steps.map((s, i) => (
              <Reveal key={s.id} delay={i * 80}>
                <li className="relative border-t-2 pt-6" style={{ borderColor: i === 0 ? "var(--gold)" : "var(--line)" }}>
                  <span className="adv-serif text-4xl" style={{ color: "var(--gold)" }}>{s.number}</span>
                  <h3 className="mt-3 font-semibold" style={{ color: "var(--navy)" }}>{s.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed" style={{ color: "var(--muted)" }}>{s.text}</p>
                </li>
              </Reveal>
            ))}
          </ol>
        </div>
      </section>

      {/* 8. DIFERENCIAIS */}
      <section className="py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <Reveal className="mx-auto max-w-2xl text-center"><div className="flex justify-center"><Eyebrow>{c.differentials.eyebrow}</Eyebrow></div><H2>{c.differentials.title}</H2></Reveal>
          <div className="mt-12 grid gap-px sm:grid-cols-2 lg:grid-cols-4" style={{ background: "var(--line)" }}>
            {c.differentials.items.map((d, i) => {
              const I = ICONS[d.icon];
              return (
                <Reveal key={d.id} delay={i * 70}>
                  <div className="h-full p-8 text-center" style={{ background: "var(--paper)" }}>
                    <span className="mx-auto grid size-14 place-items-center rounded-full border" style={{ borderColor: "var(--gold)" }}><I className="size-6" style={{ color: "var(--navy)" }} strokeWidth={1.5} /></span>
                    <h3 className="adv-serif mt-5 text-xl" style={{ color: "var(--navy)" }}>{d.title}</h3>
                    <p className="mt-2 text-sm" style={{ color: "var(--muted)" }}>{d.text}</p>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* 9. EQUIPE */}
      <section id="equipe" className="py-20 sm:py-28" style={{ background: "var(--surface)" }}>
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <Reveal className="max-w-2xl"><Eyebrow>{c.team.eyebrow}</Eyebrow><H2>{c.team.title}</H2><p className="mt-4" style={{ color: "var(--muted)" }}>{c.team.text}</p></Reveal>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {c.team.members.map((m, i) => (
              <Reveal key={m.id} delay={i * 80}>
                <article className="adv-card h-full border bg-white" style={{ borderColor: "var(--line)" }}>
                  <div className="aspect-[4/5] overflow-hidden"><img src={m.photoUrl} alt={`Foto de ${m.name}`} className="h-full w-full object-cover grayscale-[30%]" loading="lazy" /></div>
                  <div className="p-5">
                    <h3 className="adv-serif text-xl" style={{ color: "var(--navy)" }}>{m.name}</h3>
                    <p className="mt-1 text-sm font-medium" style={{ color: "var(--gold)" }}>{m.specialty}</p>
                    <p className="mt-2 text-xs" style={{ color: "var(--muted)" }}>{m.education}</p>
                    <p className="mt-1 text-xs" style={{ color: "var(--muted)" }}>{m.oab}</p>
                  </div>
                </article>
              </Reveal>
            ))}
          </div>
          <p className="mt-6 text-xs" style={{ color: "var(--muted)" }}>{c.team.disclaimer}</p>
        </div>
      </section>

      {/* 10. CONTEÚDOS */}
      <section id="conteudos" className="py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <Reveal className="max-w-2xl"><Eyebrow>{c.insights.eyebrow}</Eyebrow><H2>{c.insights.title}</H2></Reveal>
            <div className="flex flex-wrap gap-2" role="tablist" aria-label="Categorias de conteúdo">
              {c.insights.categories.map((k) => (
                <button key={k} type="button" role="tab" aria-selected={cat === k} onClick={() => setCat(k)} className="min-h-[40px] border px-4 text-sm transition-colors"
                  style={cat === k ? { background: "var(--navy)", color: "#fff", borderColor: "var(--navy)" } : { borderColor: "var(--line)", color: "var(--ink)" }}>{k}</button>
              ))}
            </div>
          </div>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {articles.map((a) => (
              <article key={a.id} className="adv-card flex h-full flex-col border bg-white p-6" style={{ borderColor: "var(--line)" }}>
                <div className="flex items-center justify-between text-xs"><span className="font-semibold uppercase tracking-[0.18em]" style={{ color: "var(--gold)" }}>{a.category}</span><span style={{ color: "var(--muted)" }}>{a.date}</span></div>
                <h3 className="adv-serif mt-4 flex-1 text-xl leading-snug" style={{ color: "var(--navy)" }}>{a.title}</h3>
                <p className="mt-3 text-sm" style={{ color: "var(--muted)" }}>{a.excerpt}</p>
                <span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold" style={{ color: "var(--navy)" }}>Ler artigo <ArrowRight className="size-4" /></span>
              </article>
            ))}
          </div>
          <p className="mt-6 text-xs" style={{ color: "var(--muted)" }}>{c.insights.disclaimer}</p>
        </div>
      </section>

      {/* 11. FAQ */}
      <section className="py-20 sm:py-28" style={{ background: "var(--surface)" }}>
        <div className="mx-auto grid max-w-7xl gap-12 px-5 sm:px-8 lg:grid-cols-[1fr_1.6fr]">
          <Reveal className="min-w-0"><Eyebrow>{c.faq.eyebrow}</Eyebrow><H2>{c.faq.title}</H2><p className="mt-5 text-sm" style={{ color: "var(--muted)" }}>{c.faq.disclaimer}</p></Reveal>
          <div className="min-w-0 border-t" style={{ borderColor: "var(--line)" }}>
            {c.faq.items.map((f) => {
              const open = faq === f.id;
              return (
                <div key={f.id} className="border-b" style={{ borderColor: "var(--line)" }}>
                  <h3>
                    <button type="button" aria-expanded={open} aria-controls={`faq-${f.id}`} onClick={() => setFaq(open ? null : f.id)} className="flex min-h-[64px] w-full items-center justify-between gap-4 py-4 text-left font-semibold" style={{ color: "var(--navy)" }}>
                      {f.question}
                      <ChevronDown className="size-5 shrink-0 transition-transform duration-300" style={{ transform: open ? "rotate(180deg)" : undefined, color: "var(--gold)" }} />
                    </button>
                  </h3>
                  <div id={`faq-${f.id}`} className="grid transition-all duration-300" style={{ gridTemplateRows: open ? "1fr" : "0fr" }}>
                    <div className="overflow-hidden"><p className="pb-5 text-sm leading-relaxed" style={{ color: "var(--muted)" }}>{f.answer}</p></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 12 + 13. CONTATO E PRIVACIDADE */}
      <section id="contato" className="py-20 sm:py-28">
        <div className="mx-auto grid max-w-7xl gap-12 px-5 sm:px-8 lg:grid-cols-[1fr_1.4fr]">
          <Reveal className="min-w-0">
            <Eyebrow>{c.contact.eyebrow}</Eyebrow><H2>{c.contact.title}</H2>
            <p className="mt-4" style={{ color: "var(--muted)" }}>{c.contact.text}</p>
            <ul className="mt-8 space-y-4 text-sm">
              <li className="flex gap-3"><Mail className="size-5 shrink-0" style={{ color: "var(--gold)" }} />{c.contact.email}</li>
              <li className="flex gap-3"><Phone className="size-5 shrink-0" style={{ color: "var(--gold)" }} />{c.contact.phone}</li>
              <li className="flex gap-3"><MapPin className="size-5 shrink-0" style={{ color: "var(--gold)" }} />{c.contact.address}</li>
              <li className="flex gap-3"><Clock className="size-5 shrink-0" style={{ color: "var(--gold)" }} />{c.contact.hours}</li>
            </ul>
          </Reveal>
          <Reveal delay={100} className="min-w-0">
            <form noValidate onSubmit={submit} className="border bg-white p-6 sm:p-8" style={{ borderColor: "var(--line)" }}>
              <div className="grid gap-5 sm:grid-cols-2">
                {field("nome", "Nome", { auto: "name" })}
                {field("empresa", "Empresa", { auto: "organization" })}
                {field("email", "E-mail", { type: "email", auto: "email" })}
                {field("telefone", "Telefone", { type: "tel", optional: true, auto: "tel" })}
                {field("demanda", "Descrição da demanda", { area: true })}
              </div>
              <div className="mt-5 flex gap-3 border-l-2 p-4 text-xs leading-relaxed" style={{ borderColor: "var(--gold)", background: "var(--paper)", color: "var(--ink)" }}>
                <Lock className="mt-0.5 size-4 shrink-0" style={{ color: "var(--gold)" }} />
                <div>
                  <p>{c.contact.privacyNotice}</p>
                  <p className="mt-2 flex flex-wrap gap-4">{c.contact.privacyLinks.map((l) => <a key={l.label} href={l.href} className="underline underline-offset-2" style={{ color: "var(--navy)" }}>{l.label}</a>)}</p>
                </div>
              </div>
              <button type="submit" disabled={status === "sending"} className="adv-btn mt-6 w-full justify-center disabled:opacity-60 sm:w-auto" style={{ background: "var(--navy)", color: "#fff" }}>
                {status === "sending" ? "Enviando…" : "Enviar mensagem"} <ArrowRight className="size-4" />
              </button>
              <div aria-live="polite" className="mt-4 text-sm">
                {status === "success" && <p style={{ color: "#2F6B4F" }}>Mensagem enviada. Nossa equipe retornará em breve.</p>}
                {status === "error" && <p style={{ color: "#A23B3B" }}>Não foi possível enviar agora. Tente novamente ou use os canais ao lado.</p>}
                {status === "unconfigured" && <p style={{ color: "var(--muted)" }}>Modelo demonstrativo: o envio do formulário ainda não está configurado. Nenhuma mensagem foi enviada. Use os canais de contato ao lado.</p>}
              </div>
            </form>
          </Reveal>
        </div>
      </section>

      {/* 14. CTA FINAL */}
      <section className="relative overflow-hidden py-20 sm:py-24" style={{ background: "var(--navy-deep)" }}>
        <div className="pointer-events-none absolute left-1/2 top-0 h-full w-px -translate-x-1/2" style={{ background: "linear-gradient(transparent,var(--gold),transparent)", opacity: 0.4 }} />
        <Reveal className="relative mx-auto max-w-3xl px-5 text-center sm:px-8">
          <h2 className="adv-serif text-[2rem] leading-tight text-white sm:text-[2.8rem]">{c.cta.title}</h2>
          <p className="mx-auto mt-5 max-w-xl text-white/65">{c.cta.text}</p>
          <a href="#contato" className="adv-btn mt-9 justify-center" style={{ background: "var(--gold)", color: "var(--navy-deep)" }}>{c.cta.buttonLabel} <ArrowRight className="size-4" /></a>
        </Reveal>
      </section>

      {/* 15. RODAPÉ */}
      <footer className="border-t pb-10 pt-16 text-white/70" style={{ background: "var(--navy-deep)", borderColor: "rgba(176,141,87,.2)" }}>
        <div className="mx-auto grid max-w-7xl gap-10 px-5 sm:grid-cols-2 sm:px-8 lg:grid-cols-4">
          <div><p className="adv-serif text-2xl text-white">{c.brand.name}</p><p className="mt-3 text-sm">{c.footer.description}</p></div>
          <div><p className="mb-4 text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: "var(--gold)" }}>Áreas de atuação</p><ul className="space-y-2 text-sm">{c.areas.items.map((a) => <li key={a.id}>{a.title}</li>)}</ul></div>
          <div><p className="mb-4 text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: "var(--gold)" }}>Navegação</p><ul className="space-y-2 text-sm">{c.nav.map((n) => <li key={n.href}><a href={n.href} className="hover:text-white">{n.label}</a></li>)}</ul></div>
          <div><p className="mb-4 text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: "var(--gold)" }}>Contato</p><ul className="space-y-2 text-sm"><li>{c.contact.email}</li><li>{c.contact.phone}</li><li>{c.contact.address}</li></ul></div>
        </div>
        <div className="mx-auto mt-12 flex max-w-7xl flex-col gap-3 border-t border-white/10 px-5 pt-6 text-xs sm:px-8 md:flex-row md:justify-between">
          <p>{c.footer.professionalInfo}</p>
          <p className="flex gap-4">{c.contact.privacyLinks.map((l) => <a key={l.label} href={l.href} className="hover:text-white">{l.label}</a>)}</p>
        </div>
        <p className="mx-auto mt-3 max-w-7xl px-5 text-xs text-white/45 sm:px-8">© {new Date().getFullYear()} {c.brand.name}. {c.footer.legal}</p>
      </footer>
    </div>
  );
}
