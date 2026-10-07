import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { FEATURED_SHOWCASE_MODELS } from "@/lib/showcase/models";
import { ShowcasePreview } from "./ShowcasePreview";
import { EcosystemStrip, ModelsShowcase } from "./ShowcaseSections";

/* ---------------- helpers ---------------- */

function useInView<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || seen) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) setSeen(true);
      },
      { threshold: 0.25 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [seen]);
  return { ref, seen };
}

function Counter({ value, suffix = "" }: { value: number; suffix?: string }) {
  const { ref, seen } = useInView<HTMLSpanElement>();
  const [n, setN] = useState(0);
  useEffect(() => {
    if (!seen) return;
    let raf = 0;
    const start = performance.now();
    const dur = 1200;
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / dur);
      setN(Math.round(value * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [seen, value]);
  return (
    <span ref={ref}>
      {n}
      {suffix}
    </span>
  );
}


/* Conteúdo demonstrativo — substituir por depoimentos e marcas reais quando cadastrados. */
const DEMO_TESTIMONIALS = [
  { name: "Mariana Souza", company: "Imobiliária (exemplo)", segment: "Imobiliário", text: "O site ficou incrível! Superou todas as nossas expectativas." },
  { name: "Carlos Menezes", company: "Restaurante (exemplo)", segment: "Gastronomia", text: "Atendimento excelente e entrega muito rápida. Recomendo demais!" },
  { name: "Camila Rocha", company: "Loja de moda (exemplo)", segment: "Varejo", text: "Nosso site novo deixou a loja com cara de marca grande." },
  { name: "Ricardo Alves", company: "Clínica (exemplo)", segment: "Saúde", text: "Profissionais competentes e criativos. Resultado impecável!" },
  { name: "Juliana Martins", company: "Hotel (exemplo)", segment: "Hotelaria", text: "O site ficou moderno, rápido e fácil de usar. Ótimo investimento!" },
];

const DEMO_BRANDS = [
  { n: "Vista", s: "Imóveis" }, { n: "Sabor & Arte", s: "Restaurante" }, { n: "Bella Moda", s: "Boutique" },
  { n: "TechVision", s: "Tecnologia" }, { n: "Clínica Vita", s: "Saúde" }, { n: "Solaris", s: "Hotéis" },
  { n: "Nexo", s: "Consultoria" }, { n: "TopCar", s: "Automóveis" },
];

function HeroDevices() {
  const model = FEATURED_SHOWCASE_MODELS[0];
  if (!model) return null;
  return (
    <div className="relative mx-auto w-full max-w-[560px] [perspective:1400px]" style={{ animation: "sn-float 7s ease-in-out infinite" }}>
      <div className="pointer-events-none absolute -inset-10 rounded-full bg-[#7c3aed]/20 blur-3xl" />
      {/* Notebook */}
      <div className="relative [transform:rotateY(-14deg)_rotateX(6deg)]">
        <div className="rounded-t-2xl border border-white/10 bg-[#0b0f1a] p-2 shadow-[0_40px_80px_-30px_rgba(124,58,237,0.6)]">
          <div className="relative aspect-[380/240] overflow-hidden rounded-lg">
            <div className="absolute left-0 top-0 h-[300px] w-[380px] origin-top-left" style={{ transform: "scale(var(--hs))", ["--hs" as string]: "min(1.4, calc((100vw - 4rem) / 380px))" } as React.CSSProperties}>
              <ShowcasePreview model={model} />
            </div>
          </div>
        </div>
        <div className="mx-auto h-3 w-[108%] -translate-x-[3.7%] rounded-b-2xl bg-gradient-to-b from-[#1e2435] to-[#0b0f1a]" />
      </div>
      {/* Celular */}
      <div className="absolute -bottom-6 -right-2 w-[28%] rounded-[22px] border border-white/15 bg-[#0b0f1a] p-1.5 shadow-[0_30px_60px_-20px_rgba(59,130,246,0.6)] sm:-right-6">
        <div className="relative aspect-[9/18] overflow-hidden rounded-[16px]">
          <img src={model.heroImage} alt="" className="absolute inset-0 h-full w-full object-cover" loading="lazy" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#05070f] via-[#05070f]/40 to-transparent" />
          <div className="absolute inset-x-2 bottom-3">
            <p className="text-[10px] font-semibold italic leading-tight text-white">Sua empresa em outro nível</p>
            <span className="mt-1.5 inline-block rounded-full bg-[#7c3aed] px-2 py-0.5 text-[7px] font-bold text-white">Fale conosco</span>
          </div>
        </div>
      </div>
    </div>
  );
}

const SERVICES = [
  { t: "Criação completa do site", d: "Do layout ao lançamento, sem você precisar escrever uma linha." },
  { t: "Publicidade que traz cliente", d: "Campanhas pensadas para gerar contato real, não só visita." },
  { t: "Especialistas dedicados", d: "Time de design, texto e tecnologia cuidando do seu projeto." },
  { t: "Agentes de IA no processo", d: "Inteligência aplicada para acelerar cada etapa da produção." },
  { t: "Textos, fotos e identidade", d: "Conteúdo e visual prontos, alinhados com a sua marca." },
  { t: "Suporte e manutenção", d: "Ajustes, atualizações e acompanhamento depois da entrega." },
];

const STEPS = [
  { n: "01", t: "Escolha o modelo", d: "Selecione o template que combina com o seu negócio e veja como ele fica com o seu nome." },
  { n: "02", t: "Envie sua marca", d: "Logo, cores, fotos e informações. Nosso time cuida de todo o resto da produção." },
  { n: "03", t: "Receba em 48h", d: "Seu site publicado, responsivo e pronto para receber clientes em dois dias." },
];


const WEEK_BARS = [40, 65, 50, 85, 70, 95, 60];

function ProductionDashboard() {
  const [tilt, setTilt] = useState({ x: 0, y: 0 });

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.pointerType === "touch") return;
    const rect = event.currentTarget.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width - 0.5;
    const y = (event.clientY - rect.top) / rect.height - 0.5;
    setTilt({ x: y * -8, y: x * 10 });
  };

  return (
    <div className="mx-auto w-full [perspective:1100px]" style={{ maxWidth: 720, animation: "sn-float 6s ease-in-out infinite" }}>
      <motion.div
        onPointerMove={handlePointerMove}
        onPointerLeave={() => setTilt({ x: 0, y: 0 })}
        animate={{ rotateX: tilt.x, rotateY: tilt.y, scale: tilt.x || tilt.y ? 1.018 : 1 }}
        transition={{ type: "spring", stiffness: 180, damping: 20, mass: 0.7 }}
        className="w-full rounded-2xl border border-[#1f2937] bg-[#0f1424] p-5 will-change-transform"
        style={{ transformStyle: "preserve-3d", boxShadow: tilt.x || tilt.y ? "0 28px 70px rgba(37,99,235,0.28)" : "0 18px 50px rgba(0,0,0,0.28)" }}
      >
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2 [transform:translateZ(18px)]">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#60a5fa]">Sites em produção hoje</p>
          <span className="flex items-center gap-2 text-[10px] font-semibold text-[#64748b]">
            <span className="size-2 rounded-full bg-[#22c55e]" style={{ animation: "sn-pulse 1.4s ease-in-out infinite" }} />
            Dados em tempo real — atualiza a cada 15min
          </span>
        </div>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4 [transform:translateZ(28px)]">
          {[
            { l: "Em andamento", v: 19, s: "" },
            { l: "Aguardando", v: 11, s: "" },
            { l: "Entregues", v: 109, s: "" },
            { l: "Prazo médio", v: 48, s: "h" },
          ].map((c, i) => (
            <motion.div
              key={c.l}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              whileHover={{ y: -5, borderColor: "rgba(96,165,250,0.65)" }}
              transition={{ duration: 0.35, delay: i * 0.08 }}
              className="flex h-[70px] flex-col justify-center rounded-xl border border-[#1f2937] bg-[#0b1020] px-4"
            >
              <span className="text-[10px] font-semibold uppercase tracking-wider text-[#64748b]">{c.l}</span>
              <span className="text-xl font-bold text-white"><Counter value={c.v} suffix={c.s} /></span>
            </motion.div>
          ))}
        </div>
        <motion.div
          className="mt-5 flex flex-col gap-4 rounded-xl border border-[#1f2937] bg-[#0b1020] p-4 sm:flex-row sm:items-end sm:justify-between [transform:translateZ(22px)]"
          whileHover={{ y: -3 }}
        >
          <div>
            <p className="mb-3 text-[10px] font-semibold uppercase tracking-wider text-[#64748b]">Entregas da semana</p>
            <div className="flex h-8 items-end gap-2">
              {WEEK_BARS.map((h, i) => (
                <motion.div key={i} className="sn-bar w-4 rounded-sm" initial={{ height: 0 }} animate={{ height: `${(h / 100) * 32}px` }} transition={{ duration: 1, delay: i * 0.1, ease: "easeOut" }} />
              ))}
            </div>
          </div>
          <div className="w-full sm:w-auto sm:text-right">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-[#64748b]">Próxima entrega</p>
            <p className="text-sm font-semibold text-white">Landing Institucional</p>
            <p className="text-xs text-[#60a5fa]">em 2 dias</p>
            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-[#1f2937] sm:w-40">
              <motion.div className="sn-bar h-full rounded-full" initial={{ width: "0%" }} animate={{ width: "85%" }} transition={{ duration: 1.6, delay: 0.4, ease: "easeOut" }} />
            </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}

/* ---------------- page ---------------- */

export function LandingPage() {
  return (
    <div
      className="min-h-screen w-full overflow-x-hidden text-white"
      style={{ backgroundColor: "#05070f", fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif" }}
    >
      <style>{`
        @keyframes sn-marquee { 0% { transform: translateX(0) } 100% { transform: translateX(-50%) } }
        @keyframes sn-float { 0%,100% { transform: translateY(0) } 50% { transform: translateY(-10px) } }
        @keyframes floatY { 0%,100% { transform: translateY(0) } 50% { transform: translateY(-6px) } }
        @keyframes sn-grow { 0% { transform: scaleY(0) } 100% { transform: scaleY(1) } }
        @keyframes sn-shimmer { 0% { background-position: 0% 0 } 100% { background-position: 200% 0 } }
        @keyframes sn-pulse { 0%,100% { opacity: 1; transform: scale(1) } 50% { opacity: 0.35; transform: scale(0.8) } }
        .sn-track { display: flex; width: max-content; animation-name: sn-marquee; animation-timing-function: linear; animation-iteration-count: infinite; }
        .sn-pause:hover .sn-track { animation-play-state: paused; }
        .sn-fade { -webkit-mask-image: linear-gradient(to right, transparent, black 10%, black 90%, transparent); mask-image: linear-gradient(to right, transparent, black 10%, black 90%, transparent); }
        .sn-bar { background: linear-gradient(90deg, #3b82f6 0%, #93c5fd 50%, #3b82f6 100%); background-size: 200% 100%; animation: sn-shimmer 2.4s linear infinite; }
      `}</style>

      {/* HEADER */}
      <header className="sticky top-0 z-50 border-b border-[#8296ff]/[0.13] bg-[#020817]/70 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <div className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-lg bg-gradient-to-br from-[#a855f7] to-[#3b82f6] text-sm font-black text-white">S</div>
            <span className="text-lg font-bold tracking-tight">Scale<span className="text-[#a78bfa]">Nexus</span></span>
          </div>
          <nav className="hidden items-center gap-8 text-sm text-[#94a3b8] md:flex">
            <a href="#como-funciona" className="transition-colors hover:text-white">Como funciona</a>
            <a href="#o-que-fazemos" className="transition-colors hover:text-white">O que fazemos</a>
            <Link to="/modelos" className="transition-colors hover:text-white">Modelos</Link>
          </nav>
          <div className="flex items-center gap-3">
            <Link
              to="/auth"
              className="hidden rounded-full border border-[#7e94ff]/40 bg-[#050d1f]/50 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:border-[#a78bfa] sm:block"
            >
              Login/Cadastro
            </Link>
            <Link
              to="/comece-seu-projeto"
              className="rounded-full bg-gradient-to-r from-[#7430ff] to-[#1d79ff] px-5 py-2.5 text-sm font-bold shadow-[0_0_28px_rgba(99,45,255,0.35)] text-white transition-opacity hover:opacity-90"
            >
              Criar meu site
            </Link>
          </div>
        </div>
      </header>

      {/* HERO */}
      <section className="relative overflow-hidden px-6 pt-16 pb-10 lg:pt-20">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[620px]" style={{ background: "radial-gradient(ellipse at 30% 0%, rgba(124,58,237,0.22), transparent 60%), radial-gradient(ellipse at 80% 20%, rgba(59,130,246,0.18), transparent 60%)" }} />
        <div className="relative mx-auto grid max-w-7xl items-center gap-14 lg:grid-cols-[1.05fr_1fr]">
          <motion.div className="text-center lg:text-left" initial={{ y: 24, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.7, ease: "easeOut" }}>
            <span className="inline-flex items-center gap-2 rounded-full border border-[#8b5cf6]/30 bg-[#8b5cf6]/10 px-4 py-1.5 text-xs font-medium text-[#c4b5fd]">
              <span className="size-1.5 rounded-full bg-[#a78bfa]" style={{ animation: "sn-pulse 1.6s ease-in-out infinite" }} />
              Agência de criação de sites e publicidade
            </span>
            <h1 className="mt-7 text-4xl font-black leading-[1.05] tracking-tight text-white md:text-6xl">
              Criamos o Site Profissional da Sua Empresa em{" "}
              <span className="bg-gradient-to-r from-[#a78bfa] to-[#60a5fa] bg-clip-text text-transparent">48h</span>
            </h1>
            <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-[#94a3b8] lg:mx-0">
              Você escolhe o modelo, nossos especialistas e agentes de IA cuidam de todo o resto.
              Design, textos e publicação. Pronto para vender.
            </p>
            <div className="mt-9 flex flex-wrap items-center justify-center gap-3 lg:justify-start">
              <Link to="/modelos" className="rounded-xl bg-gradient-to-r from-[#7c3aed] to-[#3b82f6] px-7 py-3.5 text-sm font-bold text-white shadow-[0_15px_40px_-12px_rgba(124,58,237,0.8)] transition-transform hover:scale-105">
                Escolher meu modelo →
              </Link>
              <a href="#como-funciona" className="rounded-xl border border-white/15 bg-white/[0.03] px-7 py-3.5 text-sm font-semibold text-white backdrop-blur transition-colors hover:border-[#8b5cf6]/60">
                Ver como funciona
              </a>
            </div>
          </motion.div>
          <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.9, delay: 0.15 }} className="px-2 pb-8">
            <HeroDevices />
          </motion.div>
        </div>
      </section>

      {/* DASHBOARD */}
      <section className="px-6 pt-4 pb-6">
        <ProductionDashboard />
      </section>

      {/* ECOSSISTEMA */}
      <EcosystemStrip />

      {/* MODELOS */}
      <ModelsShowcase />

      {/* DEPOIMENTOS */}
      <section className="py-20">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-3 px-6 text-center">
          <span className="rounded-full border border-[#8b5cf6]/30 bg-[#8b5cf6]/10 px-3 py-1 text-xs font-semibold text-[#c4b5fd]">Depoimentos</span>
          <h2 className="text-3xl font-bold md:text-4xl">Empresas que já cresceram com a <span className="bg-gradient-to-r from-[#a78bfa] to-[#60a5fa] bg-clip-text text-transparent">ScaleNexus</span></h2>
          <p className="max-w-2xl text-sm text-[#94a3b8]">Veja o que nossos clientes dizem sobre a experiência de ter um site profissional com a nossa equipe.</p>
          <p className="text-[11px] text-[#64748b]">Depoimentos ilustrativos — serão substituídos por relatos reais de clientes.</p>
        </div>
        <div className="sn-pause sn-fade mt-10 overflow-x-auto [scrollbar-width:none]">
          <div className="sn-track" style={{ animationDuration: "70s" }}>
            {[...DEMO_TESTIMONIALS, ...DEMO_TESTIMONIALS].map((t, i) => (
              <div key={i} className="mr-5 w-[300px] shrink-0 rounded-2xl border border-white/[0.08] bg-white/[0.03] p-5 backdrop-blur" aria-hidden={i >= DEMO_TESTIMONIALS.length}>
                <div className="flex items-center gap-3">
                  <span className="flex size-10 items-center justify-center rounded-full bg-gradient-to-br from-[#7c3aed] to-[#3b82f6] text-sm font-bold text-white">{t.name.split(" ").map((w) => w[0]).join("")}</span>
                  <span className="text-sm tracking-widest text-[#fbbf24]">★★★★★</span>
                </div>
                <p className="mt-4 text-sm leading-relaxed text-[#cbd5e1]">“{t.text}”</p>
                <div className="mt-4 border-t border-white/[0.06] pt-3">
                  <p className="text-sm font-bold text-white">{t.name}</p>
                  <p className="text-xs text-[#64748b]">{t.company} · {t.segment}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* EMPRESAS */}
      <section className="py-14">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-3 px-6 text-center">
          <span className="rounded-full border border-[#8b5cf6]/30 bg-[#8b5cf6]/10 px-3 py-1 text-xs font-semibold text-[#c4b5fd]">Nossos clientes</span>
          <h2 className="text-3xl font-bold md:text-4xl">Empresas que confiam na <span className="bg-gradient-to-r from-[#a78bfa] to-[#60a5fa] bg-clip-text text-transparent">ScaleNexus</span></h2>
          <p className="text-[11px] text-[#64748b]">Marcas ilustrativas — espaço preparado para logotipos de clientes reais.</p>
        </div>
        <div className="sn-pause sn-fade mt-10 overflow-hidden">
          <div className="sn-track" style={{ animationDuration: "50s", animationDirection: "reverse" }}>
            {[...DEMO_BRANDS, ...DEMO_BRANDS].map((b, i) => (
              <div key={i} className="mr-14 shrink-0 text-center" aria-hidden={i >= DEMO_BRANDS.length}>
                <p className="whitespace-nowrap text-xl font-semibold text-[#cbd5e1]/80">{b.n}</p>
                <p className="text-[10px] uppercase tracking-[0.25em] text-[#64748b]">{b.s}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* O QUE FAZEMOS */}
      <section id="o-que-fazemos" className="px-6 py-20">
        <div className="mx-auto max-w-6xl">
          <p className="text-center text-xs font-bold uppercase tracking-[0.2em] text-[#60a5fa]">O que fazemos</p>
          <h2 className="mx-auto mt-3 max-w-2xl text-center text-3xl font-bold md:text-4xl">
            Uma agência completa cuidando do seu site
          </h2>
          <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {SERVICES.map((s) => (
              <div key={s.t} className="rounded-[20px] border border-[#1f2937] bg-[#0f1424] p-6 transition-colors hover:border-[#3b82f6]/50">
                <h3 className="mb-2 text-lg font-bold text-white">{s.t}</h3>
                <p className="text-sm leading-relaxed text-[#94a3b8]">{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* COMO FUNCIONA */}
      <section id="como-funciona" className="relative px-6 py-24">
        <div className="mx-auto max-w-6xl">
          <p className="text-center text-xs font-bold uppercase tracking-[0.2em] text-[#60a5fa]">Como funciona</p>
          <h2 className="mx-auto mt-3 max-w-3xl text-center text-4xl font-bold md:text-5xl">
            Três passos até o seu site no ar
          </h2>
          <div className="relative mt-16">
            <div
              className="absolute left-0 right-0 top-1/2 hidden h-px lg:block"
              style={{ background: "linear-gradient(to right, transparent, #3b82f6, transparent)" }}
            />
            <div className="relative grid gap-8 lg:grid-cols-3">
              {STEPS.map((s) => (
                <div key={s.n} className="relative">
                  <div
                    className="pointer-events-none absolute -inset-5 rounded-[32px] blur-2xl"
                    style={{ background: "radial-gradient(circle at 50% 40%, rgba(59,130,246,0.22), transparent 70%)" }}
                  />
                  <div
                    className="relative flex h-[340px] flex-col justify-between rounded-3xl border border-[#1f2937] bg-[#0f1424] p-8"
                    style={{ boxShadow: "0 20px 60px rgba(59,130,246,0.25)" }}
                  >
                    <span className="font-black leading-none text-[#3b82f6]" style={{ fontSize: 72, opacity: 0.3 }}>
                      {s.n}
                    </span>
                    <div>
                      <h3 className="mb-3 text-2xl font-bold text-white">{s.t}</h3>
                      <p className="text-sm leading-relaxed text-[#94a3b8]">{s.d}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="relative overflow-hidden px-6 py-24">
        <svg className="pointer-events-none absolute inset-0 h-full w-full" viewBox="0 0 1440 400" preserveAspectRatio="none" aria-hidden>
          <defs>
            <linearGradient id="snw" x1="0" x2="1"><stop offset="0" stopColor="#7c3aed" /><stop offset="1" stopColor="#3b82f6" /></linearGradient>
          </defs>
          {[0, 1, 2, 3, 4].map((k) => (
            <path key={k} d={`M0 ${260 + k * 18} C 360 ${120 + k * 30}, 720 ${380 - k * 20}, 1440 ${160 + k * 25}`} stroke="url(#snw)" strokeWidth={1.5} fill="none" opacity={0.5 - k * 0.08} />
          ))}
        </svg>
        <div className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(ellipse at 20% 80%, rgba(124,58,237,0.25), transparent 60%), radial-gradient(ellipse at 80% 30%, rgba(59,130,246,0.2), transparent 60%)" }} />
        <div className="relative mx-auto max-w-4xl text-center">
          <h2 className="text-3xl font-bold text-white md:text-5xl">Pronto para levar seu negócio a outro nível?</h2>
          <p className="mx-auto mt-4 max-w-xl text-base text-[#cbd5e1]">Escolha o modelo, fale com nossa equipe e receba seu site profissional.</p>
          <Link to="/comece-seu-projeto" className="mt-8 inline-block rounded-xl bg-gradient-to-r from-[#7c3aed] to-[#3b82f6] px-8 py-4 text-base font-bold text-white shadow-[0_20px_50px_-15px_rgba(124,58,237,0.9)] transition-transform hover:scale-105">
            Criar meu site agora →
          </Link>
          <div className="mt-8 flex flex-wrap justify-center gap-x-8 gap-y-2 text-sm text-[#94a3b8]">
            <span>Entrega em até 48 horas</span><span>Design profissional</span><span>Suporte especializado</span>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-[#141a2b] px-6 py-14">
        <div className="mx-auto grid max-w-6xl gap-10 md:grid-cols-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="flex size-8 items-center justify-center rounded-lg bg-gradient-to-br from-[#a855f7] to-[#3b82f6] text-sm font-black text-white">S</div>
              <span className="text-lg font-bold">ScaleNexus</span>
            </div>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-[#64748b]">
              Agência de criação de sites e publicidade. Parte do Aurevion Group.
              <span className="mt-3 block text-[11px] font-semibold tracking-[0.25em] text-[#a78bfa]">CONECTE • AUTOMATIZE • ESCALE</span>
            </p>
          </div>
          {[
            { t: "Serviços", items: ["Criação de sites", "Publicidade", "Identidade visual", "Manutenção"] },
            { t: "Empresa", items: ["Sobre", "Aurevion Group", "Contato", "Trabalhe conosco"] },
            { t: "Redes", items: ["Instagram", "LinkedIn", "YouTube", "WhatsApp"] },
          ].map((col) => (
            <div key={col.t}>
              <h4 className="mb-4 text-sm font-bold uppercase tracking-wider text-white">{col.t}</h4>
              <ul className="space-y-2 text-sm text-[#64748b]">
                {col.items.map((it) => (
                  <li key={it} className="transition-colors hover:text-[#94a3b8]">{it}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <p className="mx-auto mt-12 max-w-6xl border-t border-[#141a2b] pt-6 text-xs text-[#475569]">
          © {new Date().getFullYear()} ScaleNexus. Todos os direitos reservados.
        </p>
      </footer>
    </div>
  );
}
