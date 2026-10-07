import { useState } from "react";
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
      <p className="text-center text-xs font-bold uppercase tracking-[0.2em] text-[#60a5fa]">Ecossistema</p>
      <h2 className="mx-auto mt-3 max-w-2xl text-center text-3xl font-bold text-white md:text-4xl">
        Fazemos parte do Aurevion Group
      </h2>
      <div className="snx-viewport snx-fade mx-auto mt-10 max-w-6xl py-3">
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
    </section>
  );
}

function ModelCard({ model, active, onTap }: { model: ShowcaseModel; active: boolean; onTap: () => void }) {
  return (
    <article
      data-active={active}
      data-model-id={model.id}
      onClick={onTap}
      className="snx-card group w-[280px] shrink-0 cursor-pointer overflow-hidden rounded-3xl border border-white/[0.08] bg-[#0b0f1a] sm:w-[340px] lg:w-[380px]"
    >
      <div className="h-[221px] overflow-hidden sm:h-[268px] lg:h-[300px]">
        {/* Prévia desenhada em 380×300 e reduzida proporcionalmente em telas menores. */}
        <div className="snx-scale h-[300px] w-[380px] origin-top-left">
          <div className="snx-shot h-full w-full origin-top"><ShowcasePreview model={model} /></div>
        </div>
      </div>
      <div className="border-t border-white/[0.06] bg-gradient-to-b from-[#0b0f1a] to-[#070a12] px-5 py-4">
        <div className="flex items-center justify-between gap-3">
          <h3 className="truncate text-base font-bold text-white">{model.name}</h3>
          <span className="shrink-0 rounded-full border border-white/10 px-2 py-0.5 text-[10px] text-[#94a3b8]">{model.category}</span>
        </div>
        <p className="mt-1 line-clamp-2 text-sm text-[#94a3b8]">{model.description}</p>
      </div>
    </article>
  );
}

export function ModelsShowcase() {
  const [active, setActive] = useState<string | null>(null);
  const models = FEATURED_SHOWCASE_MODELS;
  return (
    <section id="modelos" className="relative overflow-hidden py-20">
      <style>{CSS}</style>
      <div className="pointer-events-none absolute inset-x-0 top-10 mx-auto h-72 max-w-4xl rounded-full bg-[#8b5cf6]/10 blur-3xl" />
      <div className="relative px-6 text-center">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#60a5fa]">Modelos</p>
        <h2 className="mx-auto mt-3 max-w-2xl text-3xl font-bold text-white md:text-4xl">
          Escolha o modelo para começar seu site
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-base text-[#94a3b8]">
          Escolha uma estrutura profissional e personalize tudo para o seu negócio.
        </p>
      </div>
      <div
        className="snx-viewport snx-fade relative mx-auto mt-12 max-w-[1440px] py-6"
        data-paused={active !== null}
      >
        <div className="snx-track" style={{ animationDuration: "60s" }}>
          {[0, 1].map((dup) => (
            <div key={dup} className="flex shrink-0 gap-6 pr-6" aria-hidden={dup === 1}>
              {models.map((m) => (
                <ModelCard
                  key={`${dup}-${m.id}`}
                  model={m}
                  active={active === `${dup}-${m.id}`}
                  onTap={() => setActive((cur) => (cur === `${dup}-${m.id}` ? null : `${dup}-${m.id}`))}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
      <div className="relative mt-6 text-center">
        <Link to="/modelos" className="inline-flex items-center gap-2 rounded-full border border-white/15 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:border-[#8b5cf6]/60 hover:bg-white/5">
          Ver todos os modelos →
        </Link>
      </div>
    </section>
  );
}
