import { Link } from "@tanstack/react-router";
import { HeroDevices, ScaleNexusLogo } from "./HeroBlock";

const linkCls =
  "rounded-sm text-[#9fb0cc] transition-colors duration-200 hover:text-[#60a5fa] hover:drop-shadow-[0_0_6px_rgba(59,130,246,0.45)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3b82f6]";

type Item = { label: string; to?: string; href?: string };

const COLUMNS: { title: string; items: Item[] }[] = [
  {
    title: "Serviços",
    items: [
      { label: "Criação de sites", to: "/comece-seu-projeto" },
      { label: "Publicidade" },
      { label: "Identidade visual" },
      { label: "Manutenção" },
    ],
  },
  {
    title: "Empresa",
    items: [
      { label: "O que fazemos", href: "#ecossistema" },
      { label: "Nossos modelos", to: "/modelos" },
      { label: "Depoimentos", href: "#depoimentos-titulo" },
      { label: "Aurevion Group" },
    ],
  },
  {
    title: "Ajuda",
    items: [
      { label: "Área do cliente", to: "/cliente/login" },
      { label: "Login / Cadastro", to: "/auth" },
      { label: "Começar meu projeto", to: "/comece-seu-projeto" },
    ],
  },
];

const SOCIALS = ["Instagram", "LinkedIn", "YouTube", "WhatsApp"];

function Item({ it }: { it: Item }) {
  if (it.to) return <Link to={it.to} className={linkCls}>{it.label}</Link>;
  if (it.href) return <a href={it.href} className={linkCls}>{it.label}</a>;
  return <span className="text-[#6b7a96]">{it.label}</span>;
}

function Waves() {
  return (
    <svg className="pointer-events-none absolute inset-0 h-full w-full" viewBox="0 0 1440 520" preserveAspectRatio="none" aria-hidden>
      <defs>
        <linearGradient id="ctaBlue" x1="0" x2="1">
          <stop offset="0" stopColor="#1d4ed8" stopOpacity="0" />
          <stop offset="0.5" stopColor="#3b82f6" />
          <stop offset="1" stopColor="#22d3ee" stopOpacity="0.6" />
        </linearGradient>
      </defs>
      {[0, 1, 2, 3, 4, 5].map((k) => (
        <path key={k} className="cta-wave" style={{ animationDelay: `${k * -1.3}s` }}
          d={`M0 ${380 + k * 14} C 380 ${260 + k * 22}, 820 ${470 - k * 16}, 1440 ${120 + k * 26}`}
          stroke={k === 5 ? "#7c3aed" : "url(#ctaBlue)"} strokeWidth={k === 0 ? 2 : 1.2} fill="none" opacity={k === 5 ? 0.25 : 0.55 - k * 0.07} />
      ))}
    </svg>
  );
}

export function CtaFinal() {
  return (
    <section aria-labelledby="cta-titulo" className="relative overflow-hidden bg-[#031025] px-5 py-20 sm:px-8 lg:py-24">
      <style>{`@keyframes ctaWave{0%,100%{transform:translateY(0)}50%{transform:translateY(-10px)}}.cta-wave{animation:ctaWave 9s ease-in-out infinite}@media (prefers-reduced-motion:reduce){.cta-wave{animation:none}}`}</style>
      <Waves />
      <div className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(ellipse 45% 60% at 78% 45%, rgba(37,99,235,0.28), transparent 70%), radial-gradient(ellipse 25% 30% at 90% 70%, rgba(124,58,237,0.10), transparent 70%), linear-gradient(180deg,#020817 0%,transparent 25%,transparent 80%,#020817 100%)" }} />
      <div className="relative mx-auto grid max-w-7xl items-center gap-14 lg:grid-cols-[1.05fr_1fr]">
        <div className="text-center lg:text-left">
          <span className="inline-block rounded-full border border-[#3b82f6]/40 bg-[#061329]/70 px-4 py-1.5 text-sm text-[#93c5fd]">Seu negócio em outro nível</span>
          <h2 id="cta-titulo" className="mt-5 text-[34px] font-bold leading-[1.08] tracking-tight text-white sm:text-5xl xl:text-[58px]">
            Pronto para levar seu negócio a{" "}
            <span className="bg-gradient-to-r from-[#3b82f6] via-[#3b82f6] to-[#8b5cf6] bg-clip-text text-transparent">outro nível?</span>
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-base text-[#cbd5e1] sm:text-lg lg:mx-0">Escolha o modelo, fale com nossa equipe e receba seu site profissional.</p>
          <Link to="/comece-seu-projeto"
            className="mt-8 inline-flex min-h-[52px] items-center justify-center gap-3 rounded-full bg-gradient-to-r from-[#6d28d9] via-[#3b5bff] to-[#2563eb] px-9 py-4 text-base font-bold text-white shadow-[0_18px_40px_-14px_rgba(37,99,235,0.7),inset_0_1px_0_rgba(255,255,255,0.18)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_22px_50px_-12px_rgba(37,99,235,0.85)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#93c5fd] focus-visible:ring-offset-2 focus-visible:ring-offset-[#031025]">
            Criar meu site agora <span aria-hidden>→</span>
          </Link>
          <ul className="mt-8 flex flex-wrap justify-center gap-x-6 gap-y-3 text-sm text-[#a9b8d4] lg:justify-start">
            {[
              ["M13 2 4 14h7l-1 8 9-12h-7z", "Entrega em até 48 horas"],
              ["M12 3 5 6v5c0 4.5 3 8 7 10 4-2 7-5.5 7-10V6z", "Design profissional"],
              ["M4 14v-2a8 8 0 0 1 16 0v2M4 14h3v5H4zM17 14h3v5h-3z", "Suporte especializado"],
            ].map(([d, t]) => (
              <li key={t} className="flex items-center gap-2">
                <svg viewBox="0 0 24 24" className="size-5 shrink-0" fill="none" stroke="#60a5fa" strokeWidth={1.7} strokeLinejoin="round" aria-hidden><path d={d} /></svg>
                {t}
              </li>
            ))}
          </ul>
        </div>
        <div className="relative mx-auto w-full max-w-[620px]" aria-hidden>
          <div className="pointer-events-none absolute left-1/2 top-1/2 h-[70%] w-[90%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#2563eb]/25 blur-3xl" />
          <HeroDevices />
        </div>
      </div>
    </section>
  );
}

export function SiteFooter() {
  return (
    <footer className="border-t border-[#3b82f6]/15 bg-[#020817] px-5 pt-14 sm:px-8">
      <div className="mx-auto grid max-w-7xl gap-10 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div>
          <div className="flex items-center gap-2.5">
            <ScaleNexusLogo className="size-9 shrink-0" />
            <span className="text-2xl font-bold tracking-tight text-white">Scale<span className="text-[#8b5cf6]">Nexus</span></span>
          </div>
          <p className="mt-2 text-[11px] font-semibold tracking-[0.3em] text-[#93c5fd]">CONECTE • AUTOMATIZE • ESCALE</p>
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-[#9fb0cc]">Agência de criação de sites e publicidade. Sites modernos, prontos para o seu segmento. Parte do Aurevion Group.</p>
        </div>
        {COLUMNS.map((c) => (
          <nav key={c.title} aria-label={c.title}>
            <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-white">{c.title}</h3>
            <ul className="space-y-3 text-sm">
              {c.items.map((it) => <li key={it.label}><Item it={it} /></li>)}
            </ul>
          </nav>
        ))}
      </div>
      <div className="mx-auto mt-10 max-w-7xl">
        <h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-white">Redes</h3>
        <ul className="flex flex-wrap gap-2">
          {SOCIALS.map((s) => (
            <li key={s} title="Em breve" className="rounded-lg border border-[#3b82f6]/20 bg-[#061329] px-3 py-2 text-xs text-[#6b7a96]">{s}</li>
          ))}
        </ul>
      </div>
      <div className="mx-auto mt-10 flex max-w-7xl flex-col gap-3 border-t border-[#3b82f6]/10 py-6 text-xs text-[#6b7a96] sm:flex-row sm:justify-between">
        <p>© {new Date().getFullYear()} ScaleNexus. Todos os direitos reservados.</p>
        <p>Termos de uso · Política de privacidade</p>
      </div>
    </footer>
  );
}
