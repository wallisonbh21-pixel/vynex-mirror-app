import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { TEMPLATE_MODELS } from "./templates-data";
import { TemplateSitePreview } from "./TemplateSitePreview";
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


const CLIENT_NAMES = [
  "Studio Kai", "Nova Vita", "Dominar", "Lumen Co.", "Vertigo",
  "Northwave", "Southwave", "Aero Labs", "Bright & Co.",
];

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

const TESTIMONIALS = [
  { name: "Diego Albuquerque", role: "Imobiliária Nova Vita", text: "Em dois dias o site estava no ar e já recebemos contatos na mesma semana." },
  { name: "Rafael Menezes", role: "Hamburgueria Brasa", text: "O time entendeu a marca melhor que a gente. Ficou exatamente do jeito que queríamos." },
  { name: "Camila Duarte", role: "Studio Kai", text: "Processo simples, sem enrolação. Enviei a marca e recebi tudo pronto." },
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
      <header className="sticky top-0 z-50 border-b border-[#141a2b] bg-[#05070f]/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <div className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-lg bg-[#a855f7]/15 text-sm font-black text-[#a855f7]">S</div>
            <span className="text-lg font-bold tracking-tight">ScaleNexus</span>
          </div>
          <nav className="hidden items-center gap-8 text-sm text-[#94a3b8] md:flex">
            <a href="#como-funciona" className="transition-colors hover:text-white">Como funciona</a>
            <a href="#o-que-fazemos" className="transition-colors hover:text-white">O que fazemos</a>
            <Link to="/modelos" className="transition-colors hover:text-white">Modelos</Link>
          </nav>
          <div className="flex items-center gap-3">
            <Link
              to="/auth"
              className="hidden rounded-lg border border-white/70 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-white hover:text-[#05070f] sm:block"
            >
              Login/Cadastro
            </Link>
            <Link
              to="/comece-seu-projeto"
              className="rounded-lg bg-[#3b82f6] px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
            >
              Criar meu site
            </Link>
          </div>
        </div>
      </header>

      {/* HERO */}
      <section className="relative overflow-hidden px-6 pt-20 pb-6 text-center">
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-[520px]"
          style={{ background: "radial-gradient(ellipse at 50% 0%, rgba(59,130,246,0.18), transparent 70%)" }}
        />
        <motion.div
          className="relative mx-auto max-w-4xl"
          initial={{ y: 24, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
        >
          <span className="inline-flex items-center gap-2 rounded-full border border-[#1f2937] bg-[#0f1424] px-4 py-1.5 text-xs font-medium text-[#94a3b8]">
            <span className="size-1.5 rounded-full bg-[#3b82f6]" style={{ animation: "sn-pulse 1.6s ease-in-out infinite" }} />
            Agência de criação de sites e publicidade
          </span>
          <h1
            className="mt-7 text-4xl font-black leading-[1.05] tracking-tight text-white md:text-6xl"
            style={{ animation: "floatY 7s ease-in-out infinite" }}
          >
            Criamos o Site Profissional
            <br />
            da Sua Empresa em <span className="text-[#60a5fa]">48h</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-[#94a3b8]">
            Você escolhe o modelo, nossos especialistas e agentes de IA cuidam de todo o resto.
            Design, textos e publicação. Pronto para vender.
          </p>
          <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
            <Link
              to="/modelos"
              className="rounded-xl bg-[#3b82f6] px-7 py-3.5 text-sm font-bold text-white transition-transform hover:scale-105"
            >
              Escolher meu modelo
            </Link>
            <a
              href="#como-funciona"
              className="rounded-xl border border-[#1f2937] bg-[#0f1424] px-7 py-3.5 text-sm font-semibold text-white transition-colors hover:border-[#3b82f6]/60"
            >
              Ver como funciona
            </a>
          </div>
        </motion.div>
      </section>

      {/* DASHBOARD */}
      <section className="px-6 pt-10 pb-20">
        <ProductionDashboard />
      </section>

      {/* ECOSSISTEMA */}
      <EcosystemStrip />

      {/* CARROSSEL NOMES */}
      <section className="px-6 py-10">
        <p className="text-center text-base text-[#94a3b8]">
          Mais de 200+ empresas já tiveram o site criado pela ScaleNexus
        </p>
        <div className="sn-pause sn-fade mt-6 overflow-hidden">
          <div className="sn-track" style={{ animationDuration: "120s", animationDirection: "reverse", gap: "40px" }}>
            {[...CLIENT_NAMES, ...CLIENT_NAMES, ...CLIENT_NAMES, ...CLIENT_NAMES].map((n, i) => (
              <span key={i} className="whitespace-nowrap text-lg font-semibold text-[#475569]" style={{ marginRight: 40 }}>
                {n}
              </span>
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

      {/* MODELOS */}
      <ModelsShowcase />

      {/* TODOS OS TEMPLATES */}
      <section className="px-6 py-20">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-center text-3xl font-bold md:text-4xl">Todos os templates</h2>
          <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {TEMPLATE_MODELS.slice(0, 9).map((t) => (
              <div key={t.name} className="overflow-hidden rounded-2xl border border-[#1f2937] bg-[#0f1424]">
                <div className="h-48 w-full"><TemplateSitePreview template={t} compact /></div>
                <div className="space-y-3 p-5">
                  <h3 className="text-base font-bold text-white">{t.name}</h3>
                  <input
                    type="text"
                    placeholder="Nome da sua empresa"
                    className="w-full rounded-lg border border-[#1f2937] bg-[#0b1020] px-3 py-2 text-sm text-white placeholder:text-[#475569] focus:border-[#3b82f6] focus:outline-none"
                  />
                  <Link
                    to="/comece-seu-projeto"
                    className="block w-full rounded-lg bg-[#3b82f6] px-3 py-2 text-center text-sm font-semibold text-white transition-opacity hover:opacity-90"
                  >
                    Ver como meu site vai ficar →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* DEPOIMENTOS */}
      <section className="py-20">
        <p className="text-center text-xs font-bold uppercase tracking-[0.2em] text-[#60a5fa]">Depoimentos</p>
        <h2 className="mt-3 px-6 text-center text-3xl font-bold md:text-4xl">Empresas que já estão no ar</h2>
        <div className="sn-pause sn-fade mt-12 overflow-hidden">
          <div className="sn-track" style={{ animationDuration: "80s", gap: "24px" }}>
            {[...TESTIMONIALS, ...TESTIMONIALS, ...TESTIMONIALS, ...TESTIMONIALS].map((t, i) => (
              <div
                key={i}
                className="w-[380px] shrink-0 rounded-2xl border border-[#1f2937] bg-[#0f1424] p-6"
                style={{ marginRight: 24 }}
              >
                <p className="text-sm leading-relaxed text-[#cbd5e1]">“{t.text}”</p>
                <div className="mt-5">
                  <p className="text-sm font-bold text-white">{t.name}</p>
                  <p className="text-xs text-[#64748b]">{t.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="px-6 py-20">
        <div
          className="mx-auto max-w-5xl rounded-3xl p-12 text-center md:p-16"
          style={{ background: "linear-gradient(135deg, #3b82f6 0%, #0f172a 100%)", borderRadius: 24 }}
        >
          <h2 className="text-3xl font-bold text-white md:text-4xl">Pronto para ter o site da sua empresa?</h2>
          <p className="mx-auto mt-4 max-w-xl text-base text-white/80">
            Escolha um modelo e nossa equipe entrega em 48 horas
          </p>
          <Link
            to="/comece-seu-projeto"
            className="mt-8 inline-block rounded-xl bg-white px-8 py-4 text-base font-bold text-[#05070f] transition-transform hover:scale-105"
          >
            Quero meu site em 48h
          </Link>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-[#141a2b] px-6 py-14">
        <div className="mx-auto grid max-w-6xl gap-10 md:grid-cols-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="flex size-8 items-center justify-center rounded-lg bg-[#a855f7]/15 text-sm font-black text-[#a855f7]">S</div>
              <span className="text-lg font-bold">ScaleNexus</span>
            </div>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-[#64748b]">
              Agência de criação de sites e publicidade. Parte do Aurevion Group.
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
          © 2025 ScaleNexus. Todos os direitos reservados.
        </p>
      </footer>
    </div>
  );
}
