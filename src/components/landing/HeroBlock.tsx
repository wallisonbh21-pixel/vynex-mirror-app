import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import heroDevices from "@/assets/hero-devices.jpg.asset.json";

const u = (id: string, w = 900) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=75`;
const HERO_IMG = u("photo-1613490493576-7fde63acd811", 1200);
const THUMBS = [u("photo-1600596542815-ffad4c1539a9", 400), u("photo-1613977257363-707ba9348227", 400), u("photo-1600585154340-be6161a56a0c", 400)];

export function ScaleNexusLogo({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden>
      <defs>
        <linearGradient id="snlogo" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#c026d3" />
          <stop offset="1" stopColor="#7c3aed" />
        </linearGradient>
      </defs>
      <path d="M24 3 43 13.5 33 19 24 14 15 19l18 10-9 5-19-10.5L15 18 5 13.5Z" fill="url(#snlogo)" />
      <path d="M24 45 5 34.5 15 29l9 5 9-5-18-10 9-5 19 10.5L33 30l10 4.5Z" fill="url(#snlogo)" opacity=".9" />
    </svg>
  );
}

function useCount(target: number, ms = 1400) {
  const [v, setV] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let raf = 0;
    const io = new IntersectionObserver(([e]) => {
      if (!e?.isIntersecting) return;
      io.disconnect();
      const t0 = performance.now();
      const step = (t: number) => {
        const p = Math.min(1, (t - t0) / ms);
        setV(Math.round(target * (1 - Math.pow(1 - p, 3))));
        if (p < 1) raf = requestAnimationFrame(step);
      };
      raf = requestAnimationFrame(step);
    });
    io.observe(el);
    return () => { io.disconnect(); cancelAnimationFrame(raf); };
  }, [target, ms]);
  return { v, ref };
}

function Stat({ label, value, suffix = "" }: { label: string; value: number; suffix?: string }) {
  const { v, ref } = useCount(value);
  return (
    <div className="rounded-2xl border border-[#2a3a66]/60 bg-[#081026]/70 px-5 py-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] transition-colors hover:border-[#3b82f6]/60">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-[#60a5fa] sm:text-xs">{label}</p>
      <p className="mt-1.5 text-2xl font-bold text-white sm:text-[32px] sm:leading-tight">
        <span ref={ref}>{v}</span>{suffix}
      </p>
    </div>
  );
}

export function Laptop() {
  return (
    <div className="relative" style={{ transform: "perspective(1600px) rotateY(-16deg) rotateX(4deg) rotateZ(-2deg)", transformStyle: "preserve-3d" }}>
      <div className="pointer-events-none absolute -inset-[12%] -z-10 rounded-[40%] bg-[radial-gradient(ellipse_at_center,rgba(37,99,235,0.45),rgba(29,78,216,0.15)_45%,transparent_70%)] blur-2xl" />
      <div className="rounded-[18px] border border-[#60a5fa]/55 bg-gradient-to-b from-[#24335c] via-[#121c3a] to-[#0a1124] p-[7px] shadow-[0_0_0_1px_rgba(96,165,250,0.25),inset_0_1px_0_rgba(147,197,253,0.35),0_50px_90px_-25px_rgba(2,8,23,0.95),0_0_70px_-8px_rgba(59,130,246,0.6)]">
        <div className="relative aspect-[16/10] overflow-hidden rounded-[11px] bg-[#05070f]">
          <img src={HERO_IMG} alt="" className="absolute inset-0 h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#05070f] via-[#05070f]/70 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#05070f]/90 via-transparent to-transparent" />
          <div className="absolute inset-x-[4%] top-[5%] flex items-center justify-between">
            <ScaleNexusLogo className="size-[6%] min-w-3" />
            <div className="flex gap-[1.2em] rounded-full bg-black/40 px-[1em] py-[0.4em] text-[clamp(5px,0.7vw,10px)] font-semibold text-white">
              <span>Início</span><span>Sobre</span><span>Serviços</span><span>Projetos</span><span>Contato</span>
            </div>
          </div>
          <div className="absolute left-[4%] top-[26%] w-[45%]">
            <p className="text-[clamp(9px,1.7vw,24px)] font-semibold italic leading-[1.1] text-white">Sua empresa<br />em outro nível</p>
            <p className="mt-[4%] text-[clamp(4px,0.55vw,8px)] text-[#cbd5e1]">Desperte o crescimento digital da sua marca.</p>
            <span className="mt-[6%] inline-block rounded-full bg-gradient-to-r from-[#7c3aed] to-[#a855f7] px-[0.9em] py-[0.45em] text-[clamp(4px,0.55vw,8px)] font-bold text-white">Falar com especialista</span>
          </div>
          <div className="absolute inset-x-[3%] bottom-[5%] grid grid-cols-[1.1fr_1fr_1fr_1fr] gap-[1.5%]">
            <div className="rounded-md border border-white/10 bg-[#0b1226]/85 p-[6%] text-[clamp(5px,0.7vw,10px)] leading-tight text-white">
              Projetos<br />entregues
              <div className="mt-[10%] h-[2px] w-full rounded bg-gradient-to-r from-[#7c3aed] to-[#3b82f6]" />
            </div>
            {THUMBS.map((t) => (
              <img key={t} src={t} alt="" className="aspect-[4/3] w-full rounded-md object-cover" />
            ))}
          </div>
        </div>
      </div>
      <div className="relative mx-auto -mt-[2px] h-[14px] w-[112%] -translate-x-[5.4%] rounded-b-[18px] border-t border-[#93c5fd]/50 bg-gradient-to-b from-[#3b4f86] via-[#1b2650] to-[#0a1124] shadow-[0_25px_45px_-10px_rgba(59,130,246,0.7)]">
        <div className="mx-auto h-[5px] w-[18%] rounded-b-md bg-[#0b0d18]" />
      </div>
      <div className="pointer-events-none mx-auto mt-1 h-6 w-[95%] rounded-[50%] bg-[radial-gradient(ellipse_at_center,rgba(59,130,246,0.55),transparent_70%)] blur-md" />
    </div>
  );
}

export function Phone() {
  return (
    <div className="relative" style={{ transform: "perspective(1200px) rotateY(-10deg) rotateZ(3deg)" }}>
      <div className="pointer-events-none absolute -bottom-[10%] left-1/2 h-[22%] w-[150%] -translate-x-1/2 rounded-[50%] border border-[#3b82f6]/40 shadow-[0_0_40px_rgba(59,130,246,0.35)]" />
      <div className="relative rounded-[28px] border-2 border-[#60a5fa]/60 bg-[#0a1124] p-[5px] shadow-[0_0_0_1px_rgba(96,165,250,0.3),inset_0_1px_0_rgba(147,197,253,0.4),0_35px_60px_-15px_rgba(2,8,23,0.95),0_0_45px_-6px_rgba(59,130,246,0.6),0_0_30px_-10px_rgba(124,58,237,0.2)]">
        <div className="relative aspect-[9/19] overflow-hidden rounded-[23px] bg-[#05070f]">
          <div className="absolute inset-x-[8%] top-[2.5%] flex justify-between text-[clamp(4px,0.5vw,7px)] font-semibold text-white"><span>9:41</span><span>●●●</span></div>
          <div className="absolute left-[8%] top-[8%]"><ScaleNexusLogo className="size-3" /></div>
          <img src={HERO_IMG} alt="" className="absolute inset-x-0 top-[13%] h-[40%] w-full object-cover" />
          <div className="absolute inset-x-0 top-[33%] h-[22%] bg-gradient-to-t from-[#05070f] to-transparent" />
          <div className="absolute inset-x-[8%] top-[55%]">
            <p className="text-[clamp(7px,0.95vw,14px)] font-semibold italic leading-tight text-white">Sua empresa<br />em outro nível</p>
            <p className="mt-1 text-[clamp(3px,0.4vw,6px)] text-[#cbd5e1]">Desperte o crescimento digital da sua marca.</p>
            <span className="mt-2 inline-block rounded-full bg-gradient-to-r from-[#7c3aed] to-[#a855f7] px-2 py-0.5 text-[clamp(3px,0.4vw,6px)] font-bold text-white">Falar com especialista</span>
          </div>
          <div className="absolute inset-x-[6%] bottom-[7%] grid grid-cols-3 text-center text-[clamp(3px,0.45vw,7px)] text-white">
            {["Design", "IA", "Performance"].map((l) => (
              <div key={l} className="flex flex-col items-center gap-1">
                <span className="size-[clamp(6px,0.9vw,13px)] rounded-[3px] border border-[#60a5fa]" />
                {l}
              </div>
            ))}
          </div>
          <div className="absolute bottom-[2%] left-1/2 h-[3px] w-[30%] -translate-x-1/2 rounded-full bg-white/80" />
        </div>
      </div>
    </div>
  );
}

const DEV_MASK = "linear-gradient(to right, transparent 0%, #000 8%, #000 92%, transparent 100%), linear-gradient(to bottom, transparent 0%, #000 8%, #000 90%, transparent 100%)";

export function HeroDevices() {
  return (
    <div className="snh-dev relative">
      <img
        src={heroDevices.url}
        alt=""
        width={1376}
        height={768}
        className="block h-auto w-full select-none object-contain"
        style={{ WebkitMaskImage: DEV_MASK, maskImage: DEV_MASK, WebkitMaskComposite: "source-in", maskComposite: "intersect" }}
        draggable={false}
      />
    </div>
  );
}

export function HeroBlock() {
  return (
    <>
      <style>{`
        @keyframes snh-float { 0%,100% { transform: translateY(0) } 50% { transform: translateY(-10px) } }
        @keyframes snh-float2 { 0%,100% { transform: translateY(0) } 50% { transform: translateY(-14px) } }
        @keyframes snh-pulse { 0%,100% { opacity: 1 } 50% { opacity: .35 } }
        .snh-f1 { animation: snh-float 7s ease-in-out infinite; }
        .snh-f2 { animation: snh-float2 6s ease-in-out infinite .8s; }
        @keyframes snh-dev { 0%,100% { transform: translateY(0) } 50% { transform: translateY(-5px) } }
        .snh-dev { animation: snh-dev 9s ease-in-out infinite; }
        @media (prefers-reduced-motion: reduce) { .snh-f1, .snh-f2, .snh-dev { animation: none; } }
      `}</style>

      {/* NAVBAR */}
      <header className="sticky top-0 z-50 px-3 pt-3 sm:px-4">
        <div className="mx-auto flex h-16 max-w-[1440px] items-center justify-between gap-4 rounded-2xl border border-[#3b82f6]/20 bg-[#031025]/70 px-4 backdrop-blur-xl sm:px-8 lg:h-[76px]">
          <Link to="/" className="flex min-w-0 items-center gap-2.5" aria-label="ScaleNexus — início">
            <ScaleNexusLogo className="size-9 shrink-0 lg:size-11" />
            <span className="truncate text-xl font-bold tracking-tight text-white lg:text-[26px]">Scale<span className="text-[#c026d3]">Nexus</span></span>
          </Link>
          <nav className="hidden items-center gap-10 text-[15px] text-[#e2e8f0] lg:flex">
            <a href="#modelos" className="transition-colors hover:text-[#93c5fd]">Como funciona</a>
            <a href="#ecossistema" className="transition-colors hover:text-[#93c5fd]">O que fazemos</a>
            <Link to="/modelos" className="transition-colors hover:text-[#93c5fd]">Modelos</Link>
          </nav>
          <div className="flex shrink-0 items-center gap-3">
            <Link to="/auth" className="hidden rounded-full border border-[#3b82f6]/35 bg-[#050d1f]/60 px-6 py-3 text-sm font-semibold text-white transition-colors hover:border-[#60a5fa] sm:block">
              Login/Cadastro
            </Link>
            <Link to="/comece-seu-projeto" className="rounded-full bg-gradient-to-r from-[#6d28d9] via-[#3b5bff] to-[#2563eb] px-5 py-3 text-sm font-bold text-white shadow-[0_0_24px_rgba(37,99,235,0.4)] transition-opacity hover:opacity-90 sm:px-7">
              Criar meu site
            </Link>
          </div>
        </div>
      </header>

      {/* HERO */}
      <section className="relative overflow-hidden px-5 pb-10 pt-10 sm:px-8 lg:pt-14">
        <div className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(ellipse 55% 55% at 74% 38%, rgba(37,99,235,0.30), transparent 70%), radial-gradient(ellipse 30% 30% at 82% 55%, rgba(124,58,237,0.07), transparent 70%), radial-gradient(ellipse 40% 40% at 92% 12%, rgba(59,130,246,0.18), transparent 70%), radial-gradient(ellipse 35% 45% at 0% 60%, rgba(29,78,216,0.12), transparent 70%), radial-gradient(ellipse 50% 40% at 20% 10%, rgba(8,24,47,0.5), transparent 70%)" }} />
        <div className="relative mx-auto max-w-[1440px]">
          <div className="grid items-center gap-12 lg:grid-cols-[1.3fr_1fr] lg:gap-4">
            <div className="text-center">
              <span className="inline-flex rounded-full border border-[#3b82f6]/40 bg-[#0b1a3a]/50 px-5 py-2 text-sm font-medium text-[#38bdf8] lg:text-base">
                Agência de criação de sites e publicidade
              </span>
              <h1 className="mt-6 text-[34px] font-bold leading-[1.08] tracking-tight text-white sm:text-5xl lg:text-[44px] xl:text-[54px] 2xl:text-[60px]">
                Criamos o Site Profissional<br className="hidden sm:block" /> da Sua Empresa em{" "}
                <span className="bg-gradient-to-r from-[#a855f7] to-[#7c3aed] bg-clip-text text-transparent">48h</span>
              </h1>
              <p className="mx-auto mt-6 max-w-[620px] text-base leading-relaxed text-[#cbd5e1] lg:text-lg">
                Você escolhe o modelo, nossos especialistas e agentes de IA cuidam de todo o resto. Design, textos e publicação. Pronto para vender.
              </p>
              <div className="mt-9 flex flex-col items-center justify-center gap-4 sm:flex-row">
                <Link to="/comece-seu-projeto" className="inline-flex w-full items-center justify-center gap-3 rounded-full bg-gradient-to-r from-[#6d28d9] to-[#2563eb] px-10 py-4 text-base font-bold text-white shadow-[0_15px_45px_-10px_rgba(37,99,235,0.75)] transition-transform hover:scale-[1.03] sm:w-auto lg:text-lg">
                  Escolher meu modelo <span aria-hidden>→</span>
                </Link>
                <a href="#modelos" className="inline-flex w-full items-center justify-center gap-3 rounded-full border border-[#3b82f6]/35 bg-[#050d1f]/50 px-9 py-4 text-base font-bold text-white transition-colors hover:border-[#60a5fa] sm:w-auto lg:text-lg">
                  <span className="flex size-8 items-center justify-center rounded-full border border-[#60a5fa] text-[10px] text-[#93c5fd]" aria-hidden>▶</span>
                  Ver como funciona
                </a>
              </div>
            </div>

            <div className="relative mx-auto w-full max-w-[640px] lg:w-[108%] lg:max-w-[700px] lg:justify-self-end" aria-hidden>
              <div className="pointer-events-none absolute inset-[8%] -z-0 rounded-full bg-[radial-gradient(ellipse_at_center,rgba(37,99,235,0.35),transparent_70%)] blur-3xl" />
              <HeroDevices />
            </div>
          </div>

          {/* PAINEL */}
          <div className="relative z-10 mt-8 max-w-[1260px] rounded-[22px] border border-[#2a3a66]/60 bg-[#060d22]/75 p-5 shadow-[0_0_50px_-15px_rgba(59,130,246,0.45),inset_0_1px_0_rgba(255,255,255,0.05)] backdrop-blur-xl sm:p-7 lg:mt-6 lg:w-[73%]">
            <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-base font-bold uppercase text-[#38bdf8] lg:text-lg">Sites em produção hoje</p>
              <span className="flex items-center gap-2 text-xs text-[#e2e8f0] sm:text-sm">
                <span className="size-2.5 rounded-full bg-[#22c55e]" style={{ animation: "snh-pulse 1.6s ease-in-out infinite" }} />
                Dados em tempo real — atualiza a cada 15min
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4">
              <Stat label="Em andamento" value={19} />
              <Stat label="Aguardando" value={11} />
              <Stat label="Entregues" value={109} />
              <Stat label="Prazo médio" value={48} suffix="h" />
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
