import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { FEATURED_SHOWCASE_MODELS } from "@/lib/showcase/models";
import { ShowcasePreview } from "./ShowcasePreview";
import { EcosystemStrip, ModelsShowcase } from "./ShowcaseSections";
import { HeroBlock } from "./HeroBlock";
import { CtaFinal, SiteFooter } from "./CtaFooter";
import { TestimonialsSection, ClientsSection } from "./SocialProof";

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
      style={{ backgroundColor: "#020817", fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif" }}
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

      <HeroBlock />

      {/* ECOSSISTEMA */}
      <div id="ecossistema" className="scroll-mt-24"><EcosystemStrip /></div>

      {/* MODELOS */}
      <ModelsShowcase />

      {/* DEPOIMENTOS */}
      <TestimonialsSection />

      {/* EMPRESAS */}
      <ClientsSection />


      <CtaFinal />
      <SiteFooter />
    </div>
  );
}
