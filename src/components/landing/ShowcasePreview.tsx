import type { ShowcaseModel } from "@/lib/showcase/models";

/**
 * Prévia em miniatura de um site real para cada modelo da vitrine.
 * Renderizada em HTML (não é imagem estática), em escala reduzida.
 */
const u = (id: string, w = 500) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=70`;

function Nav({ m, links, cta, light }: { m: ShowcaseModel; links: string[]; cta: string; light?: boolean }) {
  return (
    <div className="flex items-center justify-between px-4 py-2.5" style={{ color: m.palette.text }}>
      <span className="text-[11px] font-bold tracking-wide">{m.sampleBrand}</span>
      <div className="flex items-center gap-3 text-[8px] opacity-75">
        {links.map((l) => <span key={l}>{l}</span>)}
        <span
          className="rounded-full px-2 py-1 font-semibold"
          style={{ background: m.palette.accent, color: light ? "#fff" : m.palette.background }}
        >
          {cta}
        </span>
      </div>
    </div>
  );
}

function RealEstate({ m }: { m: ShowcaseModel }) {
  const cards = [
    { t: "Cobertura Jardins", p: "R$ 4,2 mi", i: u("photo-1600596542815-ffad4c1539a9") },
    { t: "Casa Alphaville", p: "R$ 3,8 mi", i: u("photo-1600585154340-be6161a56a0c") },
    { t: "Villa Itaim", p: "R$ 5,1 mi", i: u("photo-1600607687939-ce8a6c25118c") },
  ];
  return (
    <>
      <div className="relative h-[58%]">
        <img src={m.heroImage} alt="" loading="lazy" className="absolute inset-0 size-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/20 to-black/70" />
        <div className="relative"><Nav m={m} links={["Imóveis", "Bairros", "Sobre"]} cta="Fale conosco" /></div>
        <div className="relative px-4 pt-4" style={{ color: m.palette.text }}>
          <p className="text-[7px] uppercase tracking-[0.3em]" style={{ color: m.palette.accent }}>Alto padrão</p>
          <p className="mt-1 max-w-[70%] font-serif text-[18px] leading-tight">Encontre o imóvel que combina com sua história</p>
          <div className="mt-3 flex w-[78%] items-center gap-2 rounded-md bg-white/95 p-1.5 text-[7px] text-slate-700">
            <span className="flex-1">📍 Localização</span><span className="flex-1">Tipo de imóvel</span>
            <span className="rounded px-2 py-1 font-semibold text-black" style={{ background: m.palette.accent }}>Buscar</span>
          </div>
        </div>
        <div className="absolute bottom-3 right-3 rounded-lg bg-white/95 px-2 py-1.5 text-[7px] text-slate-800 shadow-lg">
          <b className="block text-[9px]">+320</b>imóveis exclusivos
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2 p-3" style={{ background: m.palette.background }}>
        {cards.map((c) => (
          <div key={c.t} className="overflow-hidden rounded-md" style={{ background: m.palette.surface }}>
            <img src={c.i} alt="" loading="lazy" className="h-12 w-full object-cover" />
            <div className="p-1.5" style={{ color: m.palette.text }}>
              <p className="text-[7px] font-semibold">{c.t}</p>
              <p className="text-[7px]" style={{ color: m.palette.accent }}>{c.p}</p>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

function AiAutomation({ m }: { m: ShowcaseModel }) {
  return (
    <div className="relative h-full overflow-hidden" style={{ background: `radial-gradient(circle at 70% 30%, ${m.palette.accent}40, transparent 55%), ${m.palette.background}` }}>
      <Nav m={m} links={["Soluções", "Agentes", "Casos"]} cta="Começar agora" light />
      <div className="grid grid-cols-2 gap-2 px-4 pt-4" style={{ color: m.palette.text }}>
        <div>
          <p className="inline-block rounded-full border px-2 py-0.5 text-[7px]" style={{ borderColor: `${m.palette.accent}80` }}>✦ Agentes de IA</p>
          <p className="mt-2 text-[17px] font-bold leading-tight">Automatize sua empresa com inteligência</p>
          <p className="mt-2 text-[8px] opacity-70">Fluxos que trabalham 24 horas por você.</p>
          <div className="mt-3 flex gap-1.5 text-[7px]">
            <span className="rounded-md px-2 py-1 font-semibold" style={{ background: m.palette.accent }}>Agendar demonstração</span>
            <span className="rounded-md border border-white/20 px-2 py-1">Saiba mais</span>
          </div>
        </div>
        <div className="relative h-40">
          <div className="sn-orb absolute left-1/2 top-1/2 size-24 -translate-x-1/2 -translate-y-1/2 rounded-full"
            style={{ background: `conic-gradient(from 0deg, ${m.palette.accent}, #22d3ee, ${m.palette.accent})`, filter: "blur(1px)", boxShadow: `0 0 50px ${m.palette.accent}80` }} />
          <div className="absolute left-1/2 top-1/2 size-16 -translate-x-1/2 -translate-y-1/2 rounded-full" style={{ background: m.palette.background }} />
          <div className="sn-floaty absolute left-0 top-2 rounded-md border border-white/10 bg-white/5 px-2 py-1 text-[7px] backdrop-blur">⚡ 1.248 tarefas hoje</div>
          <div className="sn-floaty absolute bottom-3 right-0 rounded-md border border-white/10 bg-white/5 px-2 py-1 text-[7px] backdrop-blur" style={{ animationDelay: "1.5s" }}>✓ Lead qualificado</div>
        </div>
      </div>
      <div className="absolute inset-x-4 bottom-3 grid grid-cols-3 gap-2" style={{ color: m.palette.text }}>
        {["Atendimento", "Vendas", "Operações"].map((t) => (
          <div key={t} className="rounded-md border border-white/10 bg-white/5 p-2 text-[7px]">
            <span style={{ color: m.palette.accent }}>◆</span> {t}
            <div className="mt-1 h-1 rounded bg-white/10"><div className="h-1 w-2/3 rounded" style={{ background: m.palette.accent }} /></div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Saas({ m }: { m: ShowcaseModel }) {
  const bars = [35, 55, 45, 70, 60, 85, 75, 95];
  return (
    <div className="h-full" style={{ background: `linear-gradient(180deg, ${m.palette.surface}, ${m.palette.background})` }}>
      <Nav m={m} links={["Produto", "Preços", "Clientes"]} cta="Testar grátis" />
      <div className="px-4 pt-3 text-center" style={{ color: m.palette.text }}>
        <p className="text-[16px] font-bold leading-tight">Gestão completa em um só painel</p>
        <p className="mt-1 text-[8px] opacity-60">Dados em tempo real para decisões mais rápidas.</p>
      </div>
      <div className="relative mx-4 mt-3 rounded-lg border border-white/10 p-2.5" style={{ background: m.palette.background }}>
        <div className="grid grid-cols-3 gap-1.5">
          {[["Receita", "R$ 184 mil"], ["Clientes", "2.430"], ["Conversão", "8,4%"]].map(([l, v]) => (
            <div key={l} className="rounded border border-white/5 bg-white/[0.03] p-1.5" style={{ color: m.palette.text }}>
              <p className="text-[6px] opacity-60">{l}</p><p className="text-[9px] font-bold">{v}</p>
            </div>
          ))}
        </div>
        <div className="mt-2 flex h-16 items-end gap-1">
          {bars.map((h, i) => (
            <div key={i} className="flex-1 rounded-t" style={{ height: `${h}%`, background: `linear-gradient(180deg, ${m.palette.accent}, ${m.palette.accent}30)` }} />
          ))}
        </div>
        <div className="sn-floaty absolute -right-1 -top-3 rounded-md border border-white/10 px-2 py-1 text-[7px] shadow-xl" style={{ background: m.palette.surface, color: m.palette.text }}>
          <span style={{ color: m.palette.accent }}>▲ 24%</span> este mês
        </div>
      </div>
    </div>
  );
}

function Store({ m }: { m: ShowcaseModel }) {
  const items = [
    { t: "Bolsa Aurora", p: "R$ 890", i: u("photo-1584917865442-de89df76afd3") },
    { t: "Relógio Classic", p: "R$ 1.290", i: u("photo-1523275335684-37898b6baf30") },
    { t: "Óculos Riviera", p: "R$ 640", i: u("photo-1511499767150-a48a237f0083") },
  ];
  return (
    <div className="h-full" style={{ background: m.palette.background, color: m.palette.text }}>
      <div className="flex items-center justify-between px-4 py-2.5">
        <span className="font-serif text-[12px] tracking-wide">{m.sampleBrand}</span>
        <div className="flex gap-3 text-[8px] opacity-70"><span>Novidades</span><span>Feminino</span><span>Acessórios</span></div>
        <span className="text-[8px]">🛒 2</span>
      </div>
      <div className="relative mx-3 h-[44%] overflow-hidden rounded-lg">
        <img src={m.heroImage} alt="" loading="lazy" className="absolute inset-0 size-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/55 to-transparent" />
        <div className="relative p-3 text-white">
          <p className="text-[7px] uppercase tracking-[0.25em]">Nova coleção</p>
          <p className="mt-1 font-serif text-[16px] leading-tight">Elegância<br />para todos os dias</p>
          <span className="mt-2 inline-block rounded-full bg-white px-2.5 py-1 text-[7px] font-semibold text-black">Comprar agora</span>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2 p-3">
        {items.map((it) => (
          <div key={it.t}>
            <div className="overflow-hidden rounded-md bg-white"><img src={it.i} alt="" loading="lazy" className="h-14 w-full object-cover" /></div>
            <p className="mt-1 text-[7px] font-semibold">{it.t}</p>
            <p className="text-[7px] opacity-60">{it.p}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function Hotel({ m }: { m: ShowcaseModel }) {
  return (
    <div className="relative h-full">
      <img src={m.heroImage} alt="" loading="lazy" className="absolute inset-0 size-full object-cover" />
      <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/10 to-black/80" />
      <div className="relative"><Nav m={m} links={["Quartos", "Experiências", "Galeria"]} cta="Reservar agora" /></div>
      <div className="relative px-4 pt-6 text-center" style={{ color: m.palette.text }}>
        <p className="text-[7px] uppercase tracking-[0.35em]" style={{ color: m.palette.accent }}>Resort à beira-mar</p>
        <p className="mt-2 font-serif text-[20px] leading-tight">Dias de calma,<br />noites inesquecíveis</p>
      </div>
      <div className="absolute inset-x-4 bottom-14 grid grid-cols-4 gap-1 rounded-lg bg-white/95 p-1.5 text-[7px] text-slate-700 shadow-xl">
        <span>Entrada<br /><b>12 dez</b></span><span>Saída<br /><b>16 dez</b></span><span>Hóspedes<br /><b>2 adultos</b></span>
        <span className="flex items-center justify-center rounded font-semibold text-black" style={{ background: m.palette.accent }}>Ver datas</span>
      </div>
      <div className="absolute inset-x-4 bottom-3 grid grid-cols-3 gap-1.5">
        {["photo-1582719478250-c89cae4dc85b", "photo-1540541338287-41700207dee6", "photo-1571896349842-33c89424de2d"].map((id) => (
          <img key={id} src={u(id, 300)} alt="" loading="lazy" className="h-9 w-full rounded object-cover" />
        ))}
      </div>
    </div>
  );
}

function Restaurant({ m }: { m: ShowcaseModel }) {
  const dishes = [
    ["Risoto de funghi", "R$ 89"],
    ["Picanha na brasa", "R$ 128"],
    ["Polvo grelhado", "R$ 142"],
  ];
  return (
    <div className="h-full" style={{ background: m.palette.background, color: m.palette.text }}>
      <div className="relative h-[55%]">
        <img src={m.heroImage} alt="" loading="lazy" className="absolute inset-0 size-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 to-black/80" />
        <div className="relative"><Nav m={m} links={["Cardápio", "Ambiente", "Eventos"]} cta="Reservar mesa" /></div>
        <div className="relative px-4 pt-3">
          <p className="text-[7px] uppercase tracking-[0.3em]" style={{ color: m.palette.accent }}>Cozinha autoral</p>
          <p className="mt-1 font-serif text-[18px] leading-tight">Sabores que<br />contam histórias</p>
        </div>
      </div>
      <div className="grid grid-cols-[1.2fr_1fr] gap-2 p-3">
        <div className="rounded-md p-2" style={{ background: m.palette.surface }}>
          <p className="mb-1 text-[8px] font-semibold" style={{ color: m.palette.accent }}>Cardápio do chef</p>
          {dishes.map(([d, p]) => (
            <div key={d} className="flex justify-between border-b border-white/5 py-0.5 text-[7px]"><span>{d}</span><span>{p}</span></div>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-1">
          {["photo-1504674900247-0877df9cc836", "photo-1565299624946-b28f40a0ae38", "photo-1551218808-94e220e084d2", "photo-1559339352-11d035aa65de"].map((id) => (
            <img key={id} src={u(id, 200)} alt="" loading="lazy" className="h-[30px] w-full rounded object-cover" />
          ))}
        </div>
      </div>
    </div>
  );
}

export function ShowcasePreview({ model }: { model: ShowcaseModel }) {
  const body = {
    real_estate: <RealEstate m={model} />,
    ai_automation: <AiAutomation m={model} />,
    saas: <Saas m={model} />,
    store: <Store m={model} />,
    hotel: <Hotel m={model} />,
    restaurant: <Restaurant m={model} />,
  }[model.preview];
  return (
    <div className="flex h-full w-full flex-col overflow-hidden" style={{ background: model.palette.background }} aria-hidden>
      <div className="flex shrink-0 items-center gap-1 bg-[#0b0e16] px-3 py-1.5">
        <span className="size-1.5 rounded-full bg-[#ef4444]/70" />
        <span className="size-1.5 rounded-full bg-[#eab308]/70" />
        <span className="size-1.5 rounded-full bg-[#22c55e]/70" />
        <span className="ml-2 truncate rounded bg-white/5 px-2 py-0.5 text-[7px] text-[#64748b]">{model.slug}.com.br</span>
      </div>
      <div className="relative min-h-0 flex-1">{body}</div>
    </div>
  );
}
