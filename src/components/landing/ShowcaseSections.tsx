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

function ModelCard({ model, onPreview }: { model: ShowcaseModel; onPreview: () => void }) {
  return (
    <article
      data-model-id={model.id}
      className="snx-card group flex w-[85%] shrink-0 snap-center flex-col overflow-hidden rounded-3xl border border-white/[0.08] bg-[#0b0f1a]/80 backdrop-blur sm:w-auto"
    >
      <button type="button" onClick={onPreview} className="block h-[236px] overflow-hidden text-left sm:h-[268px] lg:h-[300px]" aria-label={`Pré-visualizar ${model.name}`}>
        <div className="snx-scale h-[300px] w-[380px] origin-top-left">
          <div className="snx-shot h-full w-full origin-top"><ShowcasePreview model={model} /></div>
        </div>
      </button>
      <div className="flex flex-1 flex-col border-t border-white/[0.06] bg-gradient-to-b from-[#0b0f1a] to-[#070a12] px-5 py-5">
        <h3 className="text-lg font-bold text-white">{model.name}</h3>
        <p className="mt-1 line-clamp-2 flex-1 text-sm text-[#94a3b8]">{model.description}</p>
        <div className="mt-4 grid gap-2">
          <button type="button" onClick={onPreview} className="rounded-xl border border-white/15 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:border-[#8b5cf6]/60 hover:bg-white/5">
            Pré-visualizar
          </button>
          <Link to="/comece-seu-projeto" className="rounded-xl bg-gradient-to-r from-[#7c3aed] to-[#3b82f6] px-4 py-2.5 text-center text-sm font-bold text-white shadow-[0_10px_30px_-10px_rgba(124,58,237,0.7)] transition-opacity hover:opacity-90">
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
  return (
    <section id="modelos" className="relative overflow-hidden py-20">
      <style>{CSS}</style>
      <div className="pointer-events-none absolute inset-x-0 top-10 mx-auto h-72 max-w-4xl rounded-full bg-[#8b5cf6]/10 blur-3xl" />
      <div className="relative mx-auto flex max-w-6xl flex-col items-center gap-4 px-6 text-center">
        <span className="rounded-full border border-[#8b5cf6]/30 bg-[#8b5cf6]/10 px-3 py-1 text-xs font-semibold text-[#c4b5fd]">Modelos profissionais</span>
        <h2 className="max-w-2xl text-3xl font-bold text-white md:text-4xl">
          Escolha o <span className="bg-gradient-to-r from-[#a78bfa] to-[#60a5fa] bg-clip-text text-transparent">modelo</span> para começar seu site
        </h2>
        <p className="max-w-xl text-base text-[#94a3b8]">
          Sites modernos, prontos para o seu segmento. Escolha o estilo, personalize e comece a vender.
        </p>
        <Link to="/modelos" className="inline-flex items-center gap-2 rounded-full border border-white/15 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:border-[#8b5cf6]/60 hover:bg-white/5">
          Ver todos os modelos →
        </Link>
      </div>
      <div className="relative mx-auto mt-12 flex max-w-6xl snap-x snap-mandatory gap-5 overflow-x-auto px-6 pb-6 pt-3 sm:grid sm:grid-cols-2 sm:overflow-visible lg:grid-cols-3">
        {models.map((m) => (
          <ModelCard key={m.id} model={m} onPreview={() => setPreview(m)} />
        ))}
      </div>
      {preview && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm" onClick={() => setPreview(null)} role="dialog" aria-modal="true" aria-label={`Prévia ${preview.name}`}>
          <div className="w-full max-w-3xl overflow-hidden rounded-3xl border border-white/10 bg-[#0b0f1a]" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-white/10 px-5 py-3">
              <p className="font-semibold text-white">{preview.name}</p>
              <button type="button" onClick={() => setPreview(null)} className="rounded-lg px-3 py-1 text-sm text-[#94a3b8] hover:bg-white/5 hover:text-white">Fechar</button>
            </div>
            <div className="mx-auto aspect-[380/300] w-full max-w-[760px] overflow-hidden">
              <div className="h-[300px] w-[380px] origin-top-left" style={{ transform: "scale(var(--s))", ["--s" as string]: "min(2, calc((100vw - 2rem) / 380px))" } as React.CSSProperties}>
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
