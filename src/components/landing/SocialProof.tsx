import { useEffect, useRef, useState, type ReactNode } from "react";

/* Conteúdo DEMONSTRATIVO — substituir por depoimentos e logotipos reais quando cadastrados. */
const face = (id: string) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=160&h=160&q=70&crop=faces`;

export type Testimonial = { name: string; company: string; segment: string; text: string; avatar: string };
export const DEMO_TESTIMONIALS: Testimonial[] = [
  { name: "Mariana Souza", company: "Imobiliária (exemplo)", segment: "Imobiliário", text: "O site ficou incrível! Superou todas as nossas expectativas. Hoje recebemos muito mais clientes pelo site.", avatar: face("photo-1494790108377-be9c29b29330") },
  { name: "Carlos Menezes", company: "Restaurante (exemplo)", segment: "Gastronomia", text: "Atendimento excelente e entrega muito rápida. Recomendo demais!", avatar: face("photo-1507003211169-0a1dd7228f2d") },
  { name: "Camila Rocha", company: "Loja de moda (exemplo)", segment: "Varejo", text: "Nosso site novo deixou a loja com cara de marca grande. As vendas aumentaram muito!", avatar: face("photo-1438761681033-6461ffad8d80") },
  { name: "Ricardo Alves", company: "Clínica (exemplo)", segment: "Saúde", text: "Profissionais competentes e criativos. Resultado impecável!", avatar: face("photo-1500648767791-00dcc994a43e") },
  { name: "Juliana Martins", company: "Hotel (exemplo)", segment: "Hotelaria", text: "O site ficou moderno, rápido e fácil de usar. Ótimo investimento!", avatar: face("photo-1544005313-94ddf0286df2") },
];

const ic = (d: ReactNode) => (
  <svg viewBox="0 0 24 24" className="size-8" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>{d}</svg>
);
export type DemoBrand = { n: string; s: string; icon: ReactNode };
export const DEMO_BRANDS: DemoBrand[] = [
  { n: "Vista", s: "Imóveis", icon: ic(<><path d="M3 11 12 4l9 7" /><path d="M5 10v10h14V10" /><path d="M10 20v-5h4v5" /></>) },
  { n: "Sabor & Arte", s: "Restaurante", icon: ic(<><path d="M7 3v8M5 3v5a2 2 0 0 0 4 0V3M7 11v10" /><path d="M16 3c-1.5 2-2 4-2 7h3v11M17 3v18" /></>) },
  { n: "Bella Moda", s: "Boutique", icon: ic(<><path d="M9 3h6l-1 4 4 13H6l4-13Z" /></>) },
  { n: "TechVision", s: "Tecnologia", icon: ic(<><circle cx="12" cy="12" r="2" /><path d="M12 3v5M12 16v5M3 12h5M16 12h5M5.6 5.6l3.5 3.5M14.9 14.9l3.5 3.5M5.6 18.4l3.5-3.5M14.9 9.1l3.5-3.5" /></>) },
  { n: "Clínica Vita", s: "Saúde", icon: ic(<><path d="M12 20s-8-4.5-8-11a4.5 4.5 0 0 1 8-2.8A4.5 4.5 0 0 1 20 9c0 6.5-8 11-8 11Z" /><path d="M6 12h3l1.5-2.5L13 15l1.5-3H18" /></>) },
  { n: "Solaris", s: "Hotéis", icon: ic(<><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></>) },
  { n: "Nexo", s: "Consultoria", icon: ic(<><path d="M5 20v-4M10 20v-8M15 20v-11M20 20V5" /></>) },
  { n: "TopCar", s: "Automóveis", icon: ic(<><path d="M5 16V12l2-5h10l2 5v4" /><path d="M3 16h18v3H3z" /><circle cx="7.5" cy="13.5" r=".8" /><circle cx="16.5" cy="13.5" r=".8" /></>) },
];

function Arrow({ dir, onClick, label, className = "" }: { dir: -1 | 1; onClick: () => void; label: string; className?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={`absolute top-1/2 z-10 flex size-10 -translate-y-1/2 items-center justify-center rounded-full border border-[#5b5bff]/60 bg-[#070b1f]/90 text-white shadow-[0_0_22px_rgba(91,91,255,0.5)] backdrop-blur transition-colors hover:border-[#a78bfa] sm:size-12 ${dir < 0 ? "left-1 sm:left-3" : "right-1 sm:right-3"} ${className}`}
    >
      <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden><path d={dir < 0 ? "m15 18-6-6 6-6" : "m9 18 6-6-6-6"} /></svg>
    </button>
  );
}

const Grad = ({ children }: { children: ReactNode }) => (
  <span className="bg-gradient-to-r from-[#a855f7] via-[#8b5cf6] to-[#3b82f6] bg-clip-text text-transparent">{children}</span>
);

export function TestimonialsSection({ items = DEMO_TESTIMONIALS, illustrative = true }: { items?: Testimonial[]; illustrative?: boolean }) {
  const track = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const step = () => {
    const c = track.current?.children[0] as HTMLElement | undefined;
    return c ? c.offsetWidth + 20 : 320;
  };
  const go = (i: number) => track.current?.scrollTo({ left: i * step(), behavior: "smooth" });
  const by = (d: number) => track.current?.scrollBy({ left: d * step(), behavior: "smooth" });
  const onScroll = () => {
    const el = track.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    setActive(el.scrollLeft >= max - 4 ? items.length - 1 : Math.round(el.scrollLeft / step()));
  };
  return (
    <section className="relative py-16" aria-labelledby="depoimentos-titulo">
      <div className="mx-auto flex max-w-5xl flex-col items-center gap-3 px-6 text-center">
        <span className="rounded-full border border-[#6d5bff]/50 bg-[#1a1450]/60 px-4 py-1.5 text-sm font-medium text-[#e0dbff]">Depoimentos</span>
        <h2 id="depoimentos-titulo" className="text-3xl font-bold tracking-tight text-white md:text-5xl">Empresas que já cresceram com a <Grad>ScaleNexus</Grad></h2>
        <p className="max-w-4xl text-base text-[#e2e8f0] md:text-lg">Veja o que nossos clientes dizem sobre a experiência de ter um site profissional com a nossa equipe.</p>
        {illustrative && <p className="text-xs text-[#94a3b8] md:text-sm">Depoimentos ilustrativos — serão substituídos por relatos reais de clientes.</p>}
      </div>
      <div className="relative mx-auto mt-8 max-w-[1920px] px-4 sm:px-16">
        <Arrow dir={-1} onClick={() => by(-1)} label="Depoimentos anteriores" />
        <Arrow dir={1} onClick={() => by(1)} label="Próximos depoimentos" />
        <div
          ref={track}
          onScroll={onScroll}
          data-testid="testimonials-carousel"
          className="flex snap-x snap-mandatory gap-5 overflow-x-auto scroll-smooth px-1 py-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {items.map((t) => (
            <article
              key={t.name}
              className="flex w-[85%] shrink-0 snap-start gap-4 rounded-[20px] border border-[#3b4bff]/30 bg-gradient-to-br from-[#0b1433]/80 to-[#060a1c]/80 p-5 shadow-[0_0_30px_-14px_rgba(91,91,255,0.6),inset_0_1px_0_rgba(255,255,255,0.04)] backdrop-blur-xl transition-[transform,border-color] duration-300 hover:-translate-y-1 hover:border-[#7c5cff]/60 sm:w-[calc(50%-10px)] sm:p-6 lg:w-[calc(33.333%-14px)] xl:w-[calc(25%-15px)]"
            >
              <img src={t.avatar} alt="" loading="lazy" className="size-16 shrink-0 rounded-full border-2 border-[#8b5cf6]/70 object-cover shadow-[0_0_18px_rgba(139,92,246,0.5)] sm:size-20" />
              <div className="flex min-w-0 flex-1 flex-col">
                <p className="text-lg leading-none tracking-wider text-[#fbbf24]" aria-label="5 de 5 estrelas">★★★★★</p>
                <p className="mt-3 flex-1 text-[15px] leading-relaxed text-[#e2e8f0]">“{t.text}”</p>
                <p className="mt-4 font-bold text-white">{t.name}</p>
                <p className="text-xs text-[#94a3b8]">{t.company} - {t.segment}</p>
              </div>
            </article>
          ))}
        </div>
        <div className="mt-5 flex justify-center gap-2.5">
          {items.map((t, i) => (
            <button
              key={t.name}
              type="button"
              onClick={() => go(i)}
              aria-label={`Ir para depoimento de ${t.name}`}
              aria-current={active === i}
              className={`size-2.5 rounded-full transition-all ${active === i ? "scale-125 bg-[#8b5cf6] shadow-[0_0_10px_rgba(139,92,246,0.8)]" : "bg-[#3b4a7a] hover:bg-[#5b6aa0]"}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

export function ClientsSection({ items = DEMO_BRANDS, illustrative = true }: { items?: DemoBrand[]; illustrative?: boolean }) {
  const track = useRef<HTMLDivElement>(null);
  const paused = useRef(false);
  useEffect(() => {
    const el = track.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let raf = 0;
    let acc = 0;
    const tick = () => {
      if (!paused.current) {
        acc += 0.5;
        if (acc >= 1) { el.scrollLeft += Math.floor(acc); acc -= Math.floor(acc); }
        const half = el.scrollWidth / 2;
        if (el.scrollLeft >= half) el.scrollLeft -= half;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);
  const by = (d: number) => {
    const el = track.current;
    if (!el) return;
    paused.current = true;
    const half = el.scrollWidth / 2;
    if (d < 0 && el.scrollLeft < 240) el.scrollLeft += half;
    el.scrollBy({ left: d * 240, behavior: "smooth" });
    window.setTimeout(() => { paused.current = false; }, 1200);
  };
  const loop = [...items, ...items];
  return (
    <section className="relative overflow-hidden py-16" aria-labelledby="clientes-titulo">
      <div className="pointer-events-none absolute inset-0" aria-hidden style={{ background: "radial-gradient(ellipse 50% 60% at 0% 60%, rgba(124,58,237,0.18), transparent 70%), radial-gradient(ellipse 45% 60% at 100% 40%, rgba(37,99,235,0.2), transparent 70%)" }} />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#5b5bff]/50 to-transparent" aria-hidden />
      <div className="relative mx-auto flex max-w-5xl flex-col items-center gap-3 px-6 text-center">
        <span className="rounded-full border border-[#6d5bff]/50 bg-[#1a1450]/60 px-4 py-1 text-sm font-medium text-[#e0dbff]">Nossos clientes</span>
        <h2 id="clientes-titulo" className="text-3xl font-bold tracking-tight text-white md:text-[42px]">Empresas que confiam na <Grad>ScaleNexus</Grad></h2>
        {illustrative && <p className="text-xs text-[#cbd5e1] md:text-sm">Marcas ilustrativas — espaço preparado para logotipos de clientes reais.</p>}
      </div>
      <div className="relative mx-auto mt-8 max-w-[1920px] px-4 sm:px-16">
        <Arrow dir={-1} onClick={() => by(-1)} label="Marcas anteriores" />
        <Arrow dir={1} onClick={() => by(1)} label="Próximas marcas" />
        <div
          ref={track}
          data-testid="clients-carousel"
          onPointerEnter={() => { paused.current = true; }}
          onPointerLeave={() => { paused.current = false; }}
          onTouchStart={() => { paused.current = true; }}
          onTouchEnd={() => { window.setTimeout(() => { paused.current = false; }, 1500); }}
          className="snx-fade overflow-x-auto py-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          style={{ maskImage: "linear-gradient(to right, transparent, #000 6%, #000 94%, transparent)" }}
        >
          <ul className="flex w-max items-center">
            {loop.map((b, i) => (
              <li key={i} aria-hidden={i >= items.length} className="flex w-[180px] shrink-0 flex-col items-center gap-1 text-center text-[#c7cdf5] opacity-85 transition-opacity hover:opacity-100 sm:w-[210px]">
                {b.icon}
                <span className="whitespace-nowrap text-2xl font-semibold tracking-tight">{b.n}</span>
                <span className="text-[11px] uppercase tracking-[0.3em] text-[#94a3c8]">{b.s}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
