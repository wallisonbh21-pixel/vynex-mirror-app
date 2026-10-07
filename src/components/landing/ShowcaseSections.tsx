import { useRef, useState, type CSSProperties, type PointerEvent as RPointerEvent } from "react";
import { Link } from "@tanstack/react-router";
import { FEATURED_SHOWCASE_MODELS, type ShowcaseModel } from "@/lib/showcase/models";
import { ShowcasePreview } from "./ShowcasePreview";

const ECOSYSTEM = [
  { label: "AUREVION GROUP", sub: "Grupo empresarial", initial: "A", color: "#d6b47a" },
  { label: "ScaleNexus", sub: "Sites e publicidade", initial: "S", color: "#a78bfa" },
  { label: "VALTRION-AI", sub: "Inteligência artificial", initial: "V", color: "#60a5fa" },
  { label: "NexusBuild AI", sub: "Criação assistida", initial: "N", color: "#22d3ee" },
];

const CSS = `
  @keyframes snx-marquee { from { transform: translate3d(0,0,0) } to { transform: translate3d(-50%,0,0) } }
  @keyframes snx-orb { to { transform: translate(-50%,-50%) rotate(360deg) } }
  @keyframes snx-floaty { 0%,100% { transform: translateY(0) } 50% { transform: translateY(-4px) } }
  .snx-viewport { overflow: hidden; max-width: 100%; }
  .snx-track { display: flex; width: max-content; animation: snx-marquee linear infinite; will-change: transform; }
  .snx-viewport:hover .snx-track, .snx-viewport:focus-within .snx-track, .snx-viewport[data-paused="true"] .snx-track { animation-play-state: paused; }
  .snx-fade { -webkit-mask-image: linear-gradient(to right, transparent, #000 8%, #000 92%, transparent); mask-image: linear-gradient(to right, transparent, #000 8%, #000 92%, transparent); }
  .sn-orb { animation: snx-orb 14s linear infinite; }
  .sn-floaty { animation: snx-floaty 5s ease-in-out infinite; }
  .snx-card { transition: transform .5s cubic-bezier(.2,.7,.2,1), box-shadow .5s, border-color .5s; }
  .snx-card:hover, .snx-card[data-active="true"] { transform: translateY(-8px) scale(1.02); border-color: rgba(139,92,246,.45); box-shadow: 0 30px 60px -25px rgba(59,130,246,.35), 0 0 0 1px rgba(139,92,246,.15); }
  .snx-card .snx-shot { transition: transform .8s cubic-bezier(.2,.7,.2,1); }
  .snx-card:hover .snx-shot, .snx-card[data-active="true"] .snx-shot { transform: scale(1.03); }
  .snx-scale { transform: scale(.737); }
  @media (min-width: 640px) { .snx-scale { transform: scale(.895); } }
  @media (min-width: 1024px) { .snx-scale { transform: none; } }
  @media (prefers-reduced-motion: reduce) { .snx-track, .sn-orb, .sn-floaty { animation: none; } }
`;

export function EcosystemStrip() {
  const loop = [...ECOSYSTEM, ...ECOSYSTEM, ...ECOSYSTEM];
  return (
    <section className="px-4 py-16 sm:px-6">
      <style>{CSS}</style>
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 rounded-3xl border border-[#8b5cf6]/25 bg-gradient-to-r from-[#8b5cf6]/[0.06] via-white/[0.02] to-[#3b82f6]/[0.06] p-4 backdrop-blur md:flex-row">
      <p className="shrink-0 text-center leading-tight md:pl-3 md:text-left">
        <span className="block text-[11px] text-[#94a3b8]">Parte do ecossistema</span>
        <span className="block text-sm font-bold tracking-wide text-white">AUREVION GROUP</span>
      </p>
      <div className="snx-viewport snx-fade w-full min-w-0 py-1">
        <div className="snx-track" style={{ animationDuration: "45s" }}>
          {[0, 1].map((dup) => (
            <div key={dup} className="flex shrink-0 gap-3 pr-3" aria-hidden={dup === 1}>
              {loop.map((b, i) => (
                <div
                  key={`${dup}-${i}`}
                  className="flex shrink-0 items-center gap-3 rounded-2xl border border-white/[0.07] bg-gradient-to-b from-white/[0.04] to-white/[0.01] px-4 py-2.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]"
                >
                  <span
                    className="flex size-8 items-center justify-center rounded-xl text-xs font-black"
                    style={{ color: b.color, backgroundColor: `${b.color}14`, boxShadow: `0 0 18px -6px ${b.color}66` }}
                  >
                    {b.initial}
                  </span>
                  <span className="leading-tight">
                    <span className="block whitespace-nowrap text-sm font-semibold text-[#e2e8f0]">{b.label}</span>
                    <span className="block whitespace-nowrap text-[11px] text-[#64748b]">{b.sub}</span>
                  </span>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
      </div>
    </section>
  );
}

const CARD_COPY: Record<string, string> = {
  "Imobiliária Premium": "Sites modernos para imobiliárias e corretores de imóveis.",
  "IA & Automação": "Sites para empresas de tecnologia e soluções com IA.",
  "Tecnologia & SaaS": "Sites para startups, SaaS e empresas de tecnologia.",
  "Loja Premium": "Sites para lojas, e-commerce e varejo.",
  "Hotel & Resort": "Sites para hotéis, pousadas e resorts.",
  "Restaurante Premium": "Sites para restaurantes, bares e gastronomia.",
};

function ModelCard({ model, onPreview }: { model: ShowcaseModel; onPreview: () => void }) {
  return (
    <article
      data-model-id={model.id}
      className="snx-card group flex w-[300px] shrink-0 snap-start flex-col overflow-hidden rounded-[20px] border border-[#3b5bff]/35 bg-gradient-to-b from-[#0a1230] to-[#060a1c] shadow-[0_0_30px_-12px_rgba(59,91,255,0.55)]"
    >
      <div className="flex items-center justify-between px-4 pb-2 pt-3" aria-hidden>
        <span className="flex gap-1"><i className="size-1.5 rounded-full bg-white/40" /><i className="size-1.5 rounded-full bg-white/40" /><i className="size-1.5 rounded-full bg-white/40" /></span>
        <span className="flex gap-1"><i className="size-1.5 rounded-full bg-white/40" /><i className="size-1.5 rounded-full bg-white/40" /><i className="size-1.5 rounded-full bg-white/40" /></span>
      </div>
      <button type="button" onClick={onPreview} className="mx-2 block h-[224px] w-[284px] overflow-hidden rounded-xl text-left" aria-label={`Pré-visualizar ${model.name}`}>
        <div className="h-[300px] w-[380px] origin-top-left" style={{ transform: "scale(0.7474)" }}>
          <div className="snx-shot h-full w-full origin-top"><ShowcasePreview model={model} /></div>
        </div>
      </button>
      <div className="flex flex-1 flex-col px-5 pb-5 pt-4">
        <h3 className="text-lg font-bold text-white">{model.name}</h3>
        <p className="mt-1.5 min-h-[40px] flex-1 text-[13px] leading-relaxed text-[#b4bfd3]">{CARD_COPY[model.name] ?? model.description}</p>
        <div className="mt-4 grid gap-2.5">
          <button type="button" onClick={onPreview} className="flex items-center justify-center gap-2 rounded-full border border-[#3b5bff]/40 bg-[#050a1c] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:border-[#8b5cf6]/70 hover:bg-white/5">
            <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" /><circle cx="12" cy="12" r="3" /></svg>
            Pré-visualizar
          </button>
          <Link to="/comece-seu-projeto" className="rounded-full bg-gradient-to-r from-[#6d28d9] via-[#5b3bf0] to-[#3b5bff] px-4 py-2.5 text-center text-sm font-bold text-white shadow-[0_10px_30px_-10px_rgba(109,40,217,0.8)] transition-opacity hover:opacity-90">
            Escolher modelo →
          </Link>
        </div>
      </div>
    </article>
  );
}

export function ModelsShowcase() {
  const [preview, setPreview] = useState<ShowcaseModel | null>(null);
  const models = FEATURED_SHOWCASE_MODELS;
  const trackRef = useRef<HTMLDivElement>(null);
  const drag = useRef({ active: false, startX: 0, startLeft: 0, moved: false });
  const [active, setActive] = useState(0);
  const cardStep = () => {
    const el = trackRef.current;
    const first = el?.children[0] as HTMLElement | undefined;
    return first ? first.offsetWidth + 16 : 320;
  };
  const scrollBy = (dir: number) => trackRef.current?.scrollBy({ left: dir * cardStep(), behavior: "smooth" });
  const goTo = (i: number) => trackRef.current?.scrollTo({ left: i * cardStep(), behavior: "smooth" });
  const onScroll = () => {
    const el = trackRef.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    const i = el.scrollLeft >= max - 4 ? models.length - 1 : Math.round(el.scrollLeft / cardStep());
    setActive(Math.min(models.length - 1, Math.max(0, i)));
  };
  const onDown = (e: RPointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== "mouse" || !trackRef.current) return;
    drag.current = { active: true, startX: e.clientX, startLeft: trackRef.current.scrollLeft, moved: false };
  };
  const onMove = (e: RPointerEvent<HTMLDivElement>) => {
    const el = trackRef.current;
    if (!drag.current.active || !el) return;
    const dx = e.clientX - drag.current.startX;
    if (Math.abs(dx) > 5) {
      drag.current.moved = true;
      el.style.scrollSnapType = "none";
      el.style.scrollBehavior = "auto";
    }
    el.scrollLeft = drag.current.startLeft - dx;
  };
  const onUp = () => {
    const el = trackRef.current;
    drag.current.active = false;
    if (el) { el.style.scrollSnapType = ""; el.style.scrollBehavior = ""; }
  };
  return (
    <section id="modelos" className="relative overflow-hidden py-20">
      <style>{CSS}</style>
      <div className="pointer-events-none absolute inset-x-0 top-10 mx-auto h-72 max-w-4xl rounded-full bg-[#8b5cf6]/10 blur-3xl" />
      <div className="relative mx-auto flex max-w-6xl flex-col items-center gap-4 px-6 text-center">
        <span className="rounded-full border border-[#6d5bff]/50 bg-[#1a1450]/60 px-4 py-1.5 text-sm font-medium text-[#e0dbff]">Modelos profissionais</span>
        <h2 className="text-3xl font-bold tracking-tight text-white md:text-5xl">
          Escolha o <span className="bg-gradient-to-r from-[#a78bfa] to-[#60a5fa] bg-clip-text text-transparent">modelo</span> para começar seu site
        </h2>
        <p className="max-w-2xl text-base text-[#cbd5e1] md:text-lg">
          Sites modernos, prontos para o seu segmento. Escolha o estilo, personalize e comece a vender.
        </p>
        <Link to="/modelos" className="inline-flex items-center gap-2 rounded-full border border-[#7c5cff]/70 bg-[#0b0f2a]/70 px-6 py-2.5 shadow-[0_0_24px_-6px_rgba(124,92,255,0.7)] text-sm font-semibold text-white transition-colors hover:border-[#8b5cf6]/60 hover:bg-white/5">
          Ver todos os modelos →
        </Link>
      </div>
      <div className="relative mx-auto mt-10 max-w-[1920px] px-4 sm:px-14 2xl:px-4">
        <button type="button" onClick={() => scrollBy(-1)} aria-label="Modelos anteriores" className="absolute left-1 top-[42%] z-10 flex size-10 -translate-y-1/2 items-center justify-center rounded-full border border-[#3b5bff]/50 bg-[#070b1f]/90 text-white shadow-[0_0_20px_rgba(59,91,255,0.45)] backdrop-blur transition-colors hover:border-[#a78bfa] sm:left-2 sm:size-12">
          <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden><path d="m15 18-6-6 6-6" /></svg>
        </button>
        <button type="button" onClick={() => scrollBy(1)} aria-label="Próximos modelos" className="absolute right-1 top-[42%] z-10 flex size-10 -translate-y-1/2 items-center justify-center rounded-full border border-[#3b5bff]/50 bg-[#070b1f]/90 text-white shadow-[0_0_20px_rgba(59,91,255,0.45)] backdrop-blur transition-colors hover:border-[#a78bfa] sm:right-2 sm:size-12">
          <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden><path d="m9 18 6-6-6-6" /></svg>
        </button>
        <div
          ref={trackRef}
          data-testid="models-carousel"
          onScroll={onScroll}
          onPointerDown={onDown}
          onPointerMove={onMove}
          onPointerUp={onUp}
          onPointerLeave={onUp}
          onClickCapture={(e) => { if (drag.current.moved) { e.preventDefault(); e.stopPropagation(); drag.current.moved = false; } }}
          className="snx-models mx-auto flex w-fit max-w-full snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth px-1 pb-6 pt-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {models.map((m) => (
            <ModelCard key={m.id} model={m} onPreview={() => setPreview(m)} />
          ))}
        </div>
        <div className="mt-4 flex justify-center gap-2.5">
          {models.map((m, i) => (
            <button
              key={m.id}
              type="button"
              onClick={() => goTo(i)}
              aria-label={`Ir para ${m.name}`}
              aria-current={active === i}
              className={`size-2.5 rounded-full transition-all ${active === i ? "scale-125 bg-[#8b5cf6] shadow-[0_0_10px_rgba(139,92,246,0.8)]" : "bg-[#3b4a7a] hover:bg-[#5b6aa0]"}`}
            />
          ))}
        </div>
      </div>
      {preview && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm" onClick={() => setPreview(null)} role="dialog" aria-modal="true" aria-label={`Prévia ${preview.name}`}>
          <div className="w-full max-w-3xl overflow-hidden rounded-3xl border border-white/10 bg-[#0b0f1a]" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-white/10 px-5 py-3">
              <p className="font-semibold text-white">{preview.name}</p>
              <button type="button" onClick={() => setPreview(null)} className="rounded-lg px-3 py-1 text-sm text-[#94a3b8] hover:bg-white/5 hover:text-white">Fechar</button>
            </div>
            <div className="mx-auto aspect-[380/300] w-full max-w-[760px] overflow-hidden">
              <div className="h-[300px] w-[380px] origin-top-left" style={{ transform: "scale(var(--s))", ["--s" as string]: "min(2, calc((100vw - 2rem) / 380px))" } as CSSProperties}>
                <ShowcasePreview model={preview} />
              </div>
            </div>
            <div className="flex flex-wrap justify-end gap-2 border-t border-white/10 px-5 py-4">
              <Link to="/comece-seu-projeto" className="rounded-xl bg-gradient-to-r from-[#7c3aed] to-[#3b82f6] px-5 py-2.5 text-sm font-bold text-white">Escolher modelo →</Link>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
