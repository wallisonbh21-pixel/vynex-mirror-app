import { useMemo, useState, type CSSProperties, type FormEvent, type ReactNode } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { ArrowRight, Car, Clock, Fuel, Gauge, MapPin, Menu, MessageCircle, Phone, Search, Settings2, ShieldCheck, X } from "lucide-react";
import {
  filterVehicles, findVehicle, formatBRL, formatKm, LABELS, uniqueValues, vehicleTitle, whatsappLink,
  type MotorsContent, type Vehicle, type VehicleFilters,
} from "@/lib/templates/scalenexus-motors/content";

const BASE = "/template/scalenexus-motors" as const;

function themeVars(c: MotorsContent): CSSProperties {
  const t = c.theme;
  return {
    ["--m-bg" as string]: t.background, ["--m-surface" as string]: t.surface, ["--m-surface2" as string]: t.surfaceAlt,
    ["--m-line" as string]: t.line, ["--m-text" as string]: t.text, ["--m-muted" as string]: t.muted, ["--m-accent" as string]: t.accent,
    background: t.background, color: t.text, fontFamily: `'${t.bodyFont}', system-ui, sans-serif`, minHeight: "100vh",
  };
}
const heading: CSSProperties = { fontFamily: "var(--m-heading, 'Sora'), system-ui, sans-serif" };
const card = "rounded-2xl border border-[color:var(--m-line)] bg-[color:var(--m-surface)]";
const btn = "inline-flex items-center justify-center gap-2 rounded-lg px-5 py-3 text-sm font-semibold transition-transform duration-150 hover:-translate-y-0.5";
const accentBtn: CSSProperties = { background: "var(--m-accent)", color: "#fff" };

export function VehiclePhoto({ src, alt, className = "" }: { src?: string | undefined; alt: string; className?: string }) {
  const [broken, setBroken] = useState(false);
  if (!src || broken)
    return (
      <div className={`flex items-center justify-center bg-[color:var(--m-surface2)] text-[color:var(--m-muted)] ${className}`} role="img" aria-label={`${alt} — foto indisponível`}>
        <Car className="h-10 w-10 opacity-60" />
      </div>
    );
  return <img src={src} alt={alt} loading="lazy" onError={() => setBroken(true)} className={`object-cover ${className}`} />;
}

function Badge({ v }: { v: Vehicle }) {
  if (v.availability === "disponivel") return null;
  return <span className="absolute left-3 top-3 rounded-md bg-black/80 px-2 py-1 text-xs font-semibold">{LABELS.availability[v.availability]}</span>;
}

function VehicleCard({ v }: { v: Vehicle }) {
  return (
    <Link to="/template/scalenexus-motors/veiculo/$vehicleId" params={{ vehicleId: v.id }} className={`${card} group block overflow-hidden transition-colors hover:border-[color:var(--m-accent)]`}>
      <div className="relative aspect-[4/3] overflow-hidden">
        <VehiclePhoto src={v.photos?.[0]} alt={vehicleTitle(v)} className="h-full w-full transition-transform duration-300 group-hover:scale-105" />
        <Badge v={v} />
        {v.offer && v.availability === "disponivel" && <span className="absolute right-3 top-3 rounded-md px-2 py-1 text-xs font-bold" style={accentBtn}>Oferta</span>}
      </div>
      <div className="p-5">
        <p className="text-xs uppercase tracking-widest text-[color:var(--m-muted)]">{LABELS.type[v.type]} · {v.year}</p>
        <h3 className="mt-1 text-lg font-bold" style={heading}>{vehicleTitle(v)}</h3>
        <p className="text-sm text-[color:var(--m-muted)]">{v.version}</p>
        <p className="mt-3 text-2xl font-extrabold" style={{ color: "var(--m-accent)" }}>{formatBRL(v.price)}</p>
        <div className="mt-3 flex flex-wrap gap-3 text-xs text-[color:var(--m-muted)]">
          <span className="flex items-center gap-1"><Gauge className="h-3.5 w-3.5" />{formatKm(v.mileageKm)}</span>
          <span className="flex items-center gap-1"><Fuel className="h-3.5 w-3.5" />{LABELS.fuel[v.fuel]}</span>
          <span className="flex items-center gap-1"><Settings2 className="h-3.5 w-3.5" />{LABELS.transmission[v.transmission]}</span>
        </div>
      </div>
    </Link>
  );
}

function Shell({ c, children }: { c: MotorsContent; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const wa = whatsappLink(c.store.whatsapp, `Olá! Vim pelo site da ${c.store.name}.`);
  const nav = [
    { label: "Início", to: BASE },
    { label: "Estoque", to: `${BASE}/estoque` },
    { label: "Avaliação", to: `${BASE}/contato` },
    { label: "Contato", to: `${BASE}/contato` },
  ] as const;
  return (
    <div style={{ ...themeVars(c), ["--m-heading" as string]: `'${c.theme.headingFont}'` }}>
      <header className="sticky top-0 z-40 border-b border-[color:var(--m-line)] bg-[color:var(--m-bg)]/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5">
          <Link to={BASE} className="flex items-center gap-2 text-lg font-extrabold" style={heading}>
            {c.store.logoUrl ? <img src={c.store.logoUrl} alt={c.store.name} className="h-8" /> : <><span className="h-6 w-1.5 rounded" style={accentBtn} />{c.store.shortName}</>}
          </Link>
          <nav className="hidden items-center gap-7 text-sm md:flex">
            {nav.map((n) => <Link key={n.label} to={n.to} className="text-[color:var(--m-muted)] hover:text-[color:var(--m-text)]">{n.label}</Link>)}
          </nav>
          <div className="flex items-center gap-2">
            {wa && <a href={wa} target="_blank" rel="noopener noreferrer" className={`${btn} hidden md:inline-flex`} style={accentBtn}><MessageCircle className="h-4 w-4" />Fale conosco</a>}
            <button className="md:hidden" aria-label={open ? "Fechar menu" : "Abrir menu"} onClick={() => setOpen(!open)}>{open ? <X /> : <Menu />}</button>
          </div>
        </div>
        {open && (
          <nav className="flex flex-col gap-1 border-t border-[color:var(--m-line)] px-5 py-3 md:hidden">
            {nav.map((n) => <Link key={n.label} to={n.to} onClick={() => setOpen(false)} className="py-2">{n.label}</Link>)}
          </nav>
        )}
      </header>
      <main>{children}</main>
      <footer className="border-t border-[color:var(--m-line)] bg-black">
        <div className="mx-auto grid max-w-7xl gap-8 px-5 py-12 md:grid-cols-3">
          <div>
            <p className="text-lg font-extrabold" style={heading}>{c.store.name}</p>
            <p className="mt-2 text-sm text-[color:var(--m-muted)]">{c.store.tagline}</p>
          </div>
          <div className="space-y-2 text-sm text-[color:var(--m-muted)]">
            <p className="flex items-center gap-2"><MapPin className="h-4 w-4" />{c.store.address} — {c.store.city}</p>
            <p className="flex items-center gap-2"><Phone className="h-4 w-4" />{c.store.phone}</p>
            {c.store.hours.map((h) => <p key={h} className="flex items-center gap-2"><Clock className="h-4 w-4" />{h}</p>)}
          </div>
          <div className="flex gap-4 text-sm">
            {c.store.socials.map((s) => <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer" className="text-[color:var(--m-muted)] hover:text-[color:var(--m-text)]">{s.label}</a>)}
          </div>
        </div>
        <p className="border-t border-[color:var(--m-line)] px-5 py-5 text-center text-xs text-[color:var(--m-muted)]">{c.footer.legal}</p>
      </footer>
      {wa && (
        <a href={wa} target="_blank" rel="noopener noreferrer" aria-label="Conversar pelo WhatsApp" className="fixed bottom-5 right-5 z-50 flex h-14 w-14 items-center justify-center rounded-full shadow-xl" style={{ background: "#25D366", color: "#fff" }}>
          <MessageCircle className="h-6 w-6" />
        </a>
      )}
    </div>
  );
}

function SectionTitle({ title, text }: { title: string; text?: string }) {
  return (
    <div className="mb-8">
      <h2 className="text-3xl font-extrabold sm:text-4xl" style={heading}>{title}</h2>
      {text && <p className="mt-2 text-[color:var(--m-muted)]">{text}</p>}
    </div>
  );
}

const selectCls = "w-full rounded-lg border border-[color:var(--m-line)] bg-[color:var(--m-surface2)] px-3 py-2.5 text-sm text-[color:var(--m-text)]";

/* ------------------------------- Home ------------------------------- */
export function MotorsHome({ content: c }: { content: MotorsContent }) {
  const navigate = useNavigate();
  const [q, setQ] = useState({ brand: "", type: "", priceMax: "" });
  const brands = uniqueValues(c.vehicles, "brand");
  const featured = c.vehicles.filter((v) => v.featured && v.availability !== "vendido").slice(0, 6);
  const offers = c.vehicles.filter((v) => v.offer && v.availability === "disponivel").slice(0, 3);
  const heroVehicle = findVehicle(c.vehicles, c.hero.vehicleId);

  const search = (e: FormEvent) => {
    e.preventDefault();
    navigate({ to: "/template/scalenexus-motors/estoque", search: { brand: q.brand || undefined, type: q.type || undefined, priceMax: q.priceMax ? Number(q.priceMax) : undefined } });
  };

  return (
    <Shell c={c}>
      <section className="relative overflow-hidden">
        <img src={c.hero.imageUrl} alt={heroVehicle ? vehicleTitle(heroVehicle) : "Veículo em destaque"} className="absolute inset-0 h-full w-full object-cover opacity-40" />
        <div className="absolute inset-0 bg-gradient-to-r from-black via-black/70 to-transparent" />
        <div className="relative mx-auto max-w-7xl px-5 py-24 sm:py-32">
          <p className="text-xs font-semibold uppercase tracking-[0.25em]" style={{ color: "var(--m-accent)" }}>{c.hero.eyebrow}</p>
          <h1 className="mt-4 max-w-2xl text-4xl font-extrabold leading-tight sm:text-6xl" style={heading}>{c.hero.title}</h1>
          <p className="mt-5 max-w-xl text-lg text-[color:var(--m-muted)]">{c.hero.text}</p>
          {heroVehicle && <p className="mt-4 text-sm">Destaque: <strong>{vehicleTitle(heroVehicle)} {heroVehicle.year}</strong> — <span style={{ color: "var(--m-accent)" }}>{formatBRL(heroVehicle.price)}</span></p>}
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/template/scalenexus-motors/estoque" className={btn} style={accentBtn}>{c.hero.primaryCta}<ArrowRight className="h-4 w-4" /></Link>
            <Link to="/template/scalenexus-motors/contato" search={{ tipo: "avaliacao" }} className={`${btn} border border-white/30`}>{c.hero.secondaryCta}</Link>
          </div>
        </div>
      </section>

      <section className="mx-auto -mt-10 max-w-7xl px-5">
        <form onSubmit={search} className={`${card} relative grid gap-3 p-5 shadow-2xl sm:grid-cols-4`} aria-label="Busca rápida de veículos">
          <select aria-label="Marca" className={selectCls} value={q.brand} onChange={(e) => setQ({ ...q, brand: e.target.value })}>
            <option value="">Todas as marcas</option>{brands.map((b) => <option key={String(b)} value={String(b)}>{String(b)}</option>)}
          </select>
          <select aria-label="Categoria" className={selectCls} value={q.type} onChange={(e) => setQ({ ...q, type: e.target.value })}>
            <option value="">Todas as categorias</option>{Object.entries(LABELS.type).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
          </select>
          <select aria-label="Preço máximo" className={selectCls} value={q.priceMax} onChange={(e) => setQ({ ...q, priceMax: e.target.value })}>
            <option value="">Qualquer preço</option>{[50000, 100000, 200000, 400000, 800000].map((p) => <option key={p} value={p}>Até {formatBRL(p)}</option>)}
          </select>
          <button type="submit" className={btn} style={accentBtn}><Search className="h-4 w-4" />Buscar</button>
        </form>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-20">
        <SectionTitle title={c.featured.title} text={c.featured.text} />
        {featured.length ? <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{featured.map((v) => <VehicleCard key={v.id} v={v} />)}</div> : <p className="text-[color:var(--m-muted)]">Nenhum veículo em destaque no momento.</p>}
      </section>

      {offers.length > 0 && (
        <section className="bg-[color:var(--m-surface)] py-20">
          <div className="mx-auto max-w-7xl px-5">
            <SectionTitle title={c.offers.title} text={c.offers.text} />
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{offers.map((v) => <VehicleCard key={v.id} v={v} />)}</div>
            <p className="mt-6 text-xs text-[color:var(--m-muted)]">{c.offers.disclaimer}</p>
          </div>
        </section>
      )}

      <section className="mx-auto max-w-7xl px-5 py-20">
        <SectionTitle title={c.differentials.title} />
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {c.differentials.items.map((d) => (
            <div key={d.id} className={`${card} p-6`}>
              <ShieldCheck className="h-7 w-7" style={{ color: "var(--m-accent)" }} />
              <h3 className="mt-4 font-bold" style={heading}>{d.title}</h3>
              <p className="mt-2 text-sm text-[color:var(--m-muted)]">{d.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 pb-20">
        <div className="flex flex-col items-start justify-between gap-6 rounded-3xl p-10 sm:flex-row sm:items-center" style={{ background: "var(--m-accent)" }}>
          <div><h2 className="text-3xl font-extrabold" style={heading}>{c.tradeIn.title}</h2><p className="mt-2 max-w-xl opacity-90">{c.tradeIn.text}</p></div>
          <Link to="/template/scalenexus-motors/contato" search={{ tipo: "avaliacao" }} className={`${btn} bg-white`} style={{ color: "var(--m-accent)" }}>{c.tradeIn.cta}</Link>
        </div>
      </section>

      {c.testimonials.items.length > 0 && (
        <section className="mx-auto max-w-7xl px-5 pb-20">
          <SectionTitle title={c.testimonials.title} />
          <div className="grid gap-5 md:grid-cols-3">{c.testimonials.items.map((x) => <blockquote key={x.id} className={`${card} p-6 text-sm`}>"{x.text}"<footer className="mt-3 font-semibold">{x.name}</footer></blockquote>)}</div>
        </section>
      )}

      <section className="bg-[color:var(--m-surface)] py-20">
        <div className="mx-auto grid max-w-7xl gap-10 px-5 md:grid-cols-2">
          <div>
            <SectionTitle title="Onde estamos" text={`${c.store.address} — ${c.store.city}`} />
            <ul className="space-y-2 text-sm text-[color:var(--m-muted)]">{c.store.hours.map((h) => <li key={h}>{h}</li>)}<li>{c.store.phone} · {c.store.email}</li></ul>
            <a href={c.store.mapUrl} target="_blank" rel="noopener noreferrer" className={`${btn} mt-6 border border-[color:var(--m-line)]`}><MapPin className="h-4 w-4" />Abrir no mapa</a>
          </div>
          <LeadForm c={c} kind="contato" />
        </div>
      </section>
    </Shell>
  );
}

/* ------------------------------ Estoque ------------------------------ */
export function MotorsStock({ content: c, initial }: { content: MotorsContent; initial: VehicleFilters }) {
  const [f, setF] = useState<VehicleFilters>({ sort: "relevancia", ...initial });
  const results = useMemo(() => filterVehicles(c.vehicles, f), [c.vehicles, f]);
  const brands = uniqueValues(c.vehicles, "brand");
  const models = uniqueValues(f.brand ? c.vehicles.filter((v) => v.brand === f.brand) : c.vehicles, "model");
  const years = uniqueValues(c.vehicles, "year");
  const set = (k: keyof VehicleFilters, v: string, num = false) => setF((p) => ({ ...p, [k]: v === "" ? undefined : num ? Number(v) : v, ...(k === "brand" ? { model: undefined } : {}) }));
  const [panel, setPanel] = useState(false);

  const filters = (
    <div className="space-y-3">
      <input aria-label="Buscar por nome" placeholder="Buscar marca ou modelo" className={selectCls} value={f.q ?? ""} onChange={(e) => set("q", e.target.value)} />
      <select aria-label="Marca" className={selectCls} value={f.brand ?? ""} onChange={(e) => set("brand", e.target.value)}><option value="">Todas as marcas</option>{brands.map((b) => <option key={String(b)}>{String(b)}</option>)}</select>
      <select aria-label="Modelo" className={selectCls} value={f.model ?? ""} onChange={(e) => set("model", e.target.value)}><option value="">Todos os modelos</option>{models.map((m) => <option key={String(m)}>{String(m)}</option>)}</select>
      <select aria-label="Tipo" className={selectCls} value={f.type ?? ""} onChange={(e) => set("type", e.target.value)}><option value="">Todos os tipos</option>{Object.entries(LABELS.type).map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select>
      <div className="grid grid-cols-2 gap-2">
        <select aria-label="Ano mínimo" className={selectCls} value={f.yearMin ?? ""} onChange={(e) => set("yearMin", e.target.value, true)}><option value="">Ano de</option>{years.map((y) => <option key={y}>{y}</option>)}</select>
        <select aria-label="Ano máximo" className={selectCls} value={f.yearMax ?? ""} onChange={(e) => set("yearMax", e.target.value, true)}><option value="">Ano até</option>{years.map((y) => <option key={y}>{y}</option>)}</select>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <input aria-label="Preço mínimo" type="number" min={0} placeholder="Preço mín." className={selectCls} value={f.priceMin ?? ""} onChange={(e) => set("priceMin", e.target.value, true)} />
        <input aria-label="Preço máximo" type="number" min={0} placeholder="Preço máx." className={selectCls} value={f.priceMax ?? ""} onChange={(e) => set("priceMax", e.target.value, true)} />
      </div>
      <input aria-label="Quilometragem máxima" type="number" min={0} placeholder="Km máxima" className={selectCls} value={f.kmMax ?? ""} onChange={(e) => set("kmMax", e.target.value, true)} />
      <select aria-label="Combustível" className={selectCls} value={f.fuel ?? ""} onChange={(e) => set("fuel", e.target.value)}><option value="">Todos os combustíveis</option>{Object.entries(LABELS.fuel).map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select>
      <select aria-label="Câmbio" className={selectCls} value={f.transmission ?? ""} onChange={(e) => set("transmission", e.target.value)}><option value="">Todos os câmbios</option>{Object.entries(LABELS.transmission).map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select>
      <button type="button" className="text-sm underline text-[color:var(--m-muted)]" onClick={() => setF({ sort: f.sort })}>Limpar filtros</button>
    </div>
  );

  return (
    <Shell c={c}>
      <div className="mx-auto max-w-7xl px-5 py-12">
        <h1 className="text-4xl font-extrabold" style={heading}>Estoque</h1>
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-[color:var(--m-muted)]" aria-live="polite">{results.length} {results.length === 1 ? "veículo encontrado" : "veículos encontrados"}</p>
          <div className="flex gap-2">
            <button className={`${btn} border border-[color:var(--m-line)] lg:hidden`} onClick={() => setPanel(!panel)}>Filtros</button>
            <select aria-label="Ordenar" className={`${selectCls} w-auto`} value={f.sort} onChange={(e) => setF({ ...f, sort: e.target.value as VehicleFilters["sort"] })}>
              <option value="relevancia">Relevância</option><option value="preco-asc">Menor preço</option><option value="preco-desc">Maior preço</option><option value="ano-desc">Mais novos</option><option value="ano-asc">Mais antigos</option>
            </select>
          </div>
        </div>
        <div className="mt-6 grid gap-8 lg:grid-cols-[260px_1fr]">
          <aside className={`${card} h-fit p-5 ${panel ? "block" : "hidden"} lg:block`}>{filters}</aside>
          {results.length ? (
            <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">{results.map((v) => <VehicleCard key={v.id} v={v} />)}</div>
          ) : (
            <div className={`${card} flex flex-col items-center justify-center p-12 text-center`}>
              <Car className="h-10 w-10 text-[color:var(--m-muted)]" />
              <p className="mt-4 font-semibold">Nenhum veículo encontrado com esses filtros.</p>
              <button className="mt-3 text-sm underline" onClick={() => setF({ sort: f.sort })}>Limpar filtros</button>
            </div>
          )}
        </div>
      </div>
    </Shell>
  );
}

/* ------------------------------ Detalhes ------------------------------ */
export function MotorsVehicle({ content: c, vehicleId }: { content: MotorsContent; vehicleId: string }) {
  const v = findVehicle(c.vehicles, vehicleId);
  const [photo, setPhoto] = useState(0);
  if (!v)
    return (
      <Shell c={c}>
        <div className="mx-auto max-w-xl px-5 py-24 text-center">
          <h1 className="text-3xl font-extrabold" style={heading}>Veículo não encontrado</h1>
          <p className="mt-3 text-[color:var(--m-muted)]">Este veículo não existe ou foi removido do estoque.</p>
          <Link to="/template/scalenexus-motors/estoque" className={`${btn} mt-6`} style={accentBtn}>Ver estoque</Link>
        </div>
      </Shell>
    );
  const title = `${vehicleTitle(v)} ${v.version}`.trim();
  const wa = whatsappLink(c.store.whatsapp, `Olá! Tenho interesse no ${title} ${v.year} (código ${v.id}).`);
  const sold = v.availability === "vendido";
  return (
    <Shell c={c}>
      <div className="mx-auto max-w-7xl px-5 py-10">
        <Link to="/template/scalenexus-motors/estoque" className="text-sm text-[color:var(--m-muted)] hover:underline">← Voltar ao estoque</Link>
        <div className="mt-6 grid gap-10 lg:grid-cols-[1.4fr_1fr]">
          <div>
            <div className="relative aspect-[16/10] overflow-hidden rounded-2xl"><VehiclePhoto src={v.photos?.[photo]} alt={title} className="h-full w-full" /><Badge v={v} /></div>
            {(v.photos?.length ?? 0) > 1 && (
              <div className="mt-3 flex gap-3">{v.photos.map((p, i) => (
                <button key={p} onClick={() => setPhoto(i)} aria-label={`Foto ${i + 1}`} className={`h-20 w-28 overflow-hidden rounded-lg border-2 ${i === photo ? "border-[color:var(--m-accent)]" : "border-transparent"}`}><VehiclePhoto src={p} alt={`${title} foto ${i + 1}`} className="h-full w-full" /></button>
              ))}</div>
            )}
            <h2 className="mt-10 text-2xl font-bold" style={heading}>Descrição</h2>
            <p className="mt-3 text-[color:var(--m-muted)]">{v.description || "Descrição não informada."}</p>
            {v.equipment?.length > 0 && (<><h2 className="mt-8 text-2xl font-bold" style={heading}>Equipamentos</h2><ul className="mt-3 grid gap-2 sm:grid-cols-2">{v.equipment.map((e) => <li key={e} className="flex items-center gap-2 text-sm"><ShieldCheck className="h-4 w-4" style={{ color: "var(--m-accent)" }} />{e}</li>)}</ul></>)}
          </div>
          <div className="space-y-5">
            <div className={`${card} p-6`}>
              <p className="text-xs uppercase tracking-widest text-[color:var(--m-muted)]">{LABELS.type[v.type]} · {LABELS.availability[v.availability]}{v.demo ? " · Demonstrativo" : ""}</p>
              <h1 className="mt-2 text-3xl font-extrabold" style={heading}>{title}</h1>
              <p className="mt-4 text-4xl font-extrabold" style={{ color: "var(--m-accent)" }}>{formatBRL(v.price)}</p>
              <dl className="mt-6 grid grid-cols-2 gap-4 text-sm">
                {[["Ano", String(v.year)], ["Quilometragem", formatKm(v.mileageKm)], ["Combustível", LABELS.fuel[v.fuel]], ["Câmbio", LABELS.transmission[v.transmission]], ["Cor", v.color || "—"], ["Código", v.id]].map(([k, val]) => (
                  <div key={k}><dt className="text-[color:var(--m-muted)]">{k}</dt><dd className="font-semibold">{val}</dd></div>
                ))}
              </dl>
              {v.commercialNotes && <p className="mt-5 text-sm text-[color:var(--m-muted)]">{v.commercialNotes}</p>}
              {sold ? <p className="mt-6 rounded-lg bg-[color:var(--m-surface2)] p-3 text-sm">Este veículo já foi vendido. Veja opções semelhantes no estoque.</p>
                : wa ? <a href={wa} target="_blank" rel="noopener noreferrer" className={`${btn} mt-6 w-full`} style={{ background: "#25D366", color: "#fff" }}><MessageCircle className="h-4 w-4" />Consultar pelo WhatsApp</a>
                : <p className="mt-6 text-sm text-[color:var(--m-muted)]">WhatsApp da loja não configurado.</p>}
            </div>
            {!sold && <LeadForm c={c} kind="contato" vehicle={v} />}
          </div>
        </div>
      </div>
    </Shell>
  );
}

/* ------------------------------ Contato ------------------------------ */
export function MotorsContact({ content: c, kind }: { content: MotorsContent; kind: "contato" | "avaliacao" }) {
  return (
    <Shell c={c}>
      <div className="mx-auto grid max-w-6xl gap-10 px-5 py-14 md:grid-cols-2">
        <div>
          <h1 className="text-4xl font-extrabold" style={heading}>{kind === "avaliacao" ? c.tradeIn.title : c.contact.title}</h1>
          <p className="mt-3 text-[color:var(--m-muted)]">{kind === "avaliacao" ? c.tradeIn.text : c.contact.text}</p>
          <div className="mt-6 flex gap-2 text-sm">
            <Link to="/template/scalenexus-motors/contato" search={{ tipo: "contato" }} className={`rounded-lg px-4 py-2 ${kind === "contato" ? "" : "border border-[color:var(--m-line)]"}`} style={kind === "contato" ? accentBtn : undefined}>Contato</Link>
            <Link to="/template/scalenexus-motors/contato" search={{ tipo: "avaliacao" }} className={`rounded-lg px-4 py-2 ${kind === "avaliacao" ? "" : "border border-[color:var(--m-line)]"}`} style={kind === "avaliacao" ? accentBtn : undefined}>Avaliar meu usado</Link>
          </div>
          <ul className="mt-8 space-y-2 text-sm text-[color:var(--m-muted)]"><li>{c.store.address} — {c.store.city}</li><li>{c.store.phone}</li><li>{c.store.email}</li></ul>
        </div>
        <LeadForm key={kind} c={c} kind={kind} />
      </div>
    </Shell>
  );
}

type FormState = "idle" | "sending" | "success" | "error" | "unconfigured";

export type LeadData = Partial<Record<"name" | "phone" | "email" | "vehicle" | "year" | "km" | "message" | "website", string>>;
export function validateLead(kind: "contato" | "avaliacao", d: LeadData) {
  const e: Record<string, string> = {};
  if ((d.name ?? "").trim().length < 2) e["name"] = "Informe seu nome.";
  if ((d.phone ?? "").replace(/\D/g, "").length < 10) e["phone"] = "Informe um telefone com DDD.";
  if (d.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.email)) e["email"] = "E-mail inválido.";
  if (kind === "avaliacao") {
    if ((d.vehicle ?? "").trim().length < 2) e["vehicle"] = "Informe marca e modelo.";
    const y = Number(d.year);
    if (!y || y < 1950 || y > new Date().getFullYear() + 1) e["year"] = "Ano inválido.";
  }
  return e;
}

function LeadForm({ c, kind, vehicle }: { c: MotorsContent; kind: "contato" | "avaliacao"; vehicle?: Vehicle }) {
  const [state, setState] = useState<FormState>("idle");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const onSubmit = async (ev: FormEvent<HTMLFormElement>) => {
    ev.preventDefault();
    if (state === "sending") return; // evita envio duplicado
    const form = ev.currentTarget;
    const data = Object.fromEntries(new FormData(form)) as LeadData;
    if (data.website) return; // honeypot
    const errs = validateLead(kind, data);
    setErrors(errs);
    if (Object.keys(errs).length) return;
    if (!c.contact.formEndpoint) { setState("unconfigured"); return; }
    setState("sending");
    try {
      const res = await fetch(c.contact.formEndpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ kind, vehicleId: vehicle?.id ?? null, ...data }) });
      if (!res.ok) throw new Error(String(res.status));
      setState("success");
      form.reset();
    } catch { setState("error"); }
  };
  const field = (name: string, label: string, type = "text", required = true) => (
    <label className="block text-sm">
      <span className="mb-1 block text-[color:var(--m-muted)]">{label}{required ? " *" : ""}</span>
      <input name={name} type={type} className={selectCls} aria-invalid={!!errors[name]} />
      {errors[name] && <span className="mt-1 block text-xs" style={{ color: "var(--m-accent)" }}>{errors[name]}</span>}
    </label>
  );
  const wa = whatsappLink(c.store.whatsapp, vehicle ? `Olá! Tenho interesse no ${vehicleTitle(vehicle)} (código ${vehicle.id}).` : `Olá! Vim pelo site da ${c.store.name}.`);
  return (
    <form onSubmit={onSubmit} noValidate className={`${card} space-y-4 p-6`}>
      <h3 className="text-xl font-bold" style={heading}>{kind === "avaliacao" ? "Dados do seu veículo" : vehicle ? "Quero mais informações" : "Envie sua mensagem"}</h3>
      <input name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />
      {field("name", "Nome")}
      {field("phone", "Telefone / WhatsApp", "tel")}
      {field("email", "E-mail", "email", false)}
      {kind === "avaliacao" && (<>{field("vehicle", "Marca e modelo")}<div className="grid grid-cols-2 gap-3">{field("year", "Ano", "number")}{field("km", "Quilometragem", "number", false)}</div></>)}
      <label className="block text-sm"><span className="mb-1 block text-[color:var(--m-muted)]">Mensagem</span><textarea name="message" rows={3} className={selectCls} /></label>
      <p className="text-xs text-[color:var(--m-muted)]">{c.contact.privacyNotice}</p>
      <button type="submit" disabled={state === "sending"} className={`${btn} w-full disabled:opacity-60`} style={accentBtn}>{state === "sending" ? "Enviando…" : "Enviar"}</button>
      <div aria-live="polite" className="text-sm">
        {state === "success" && <p style={{ color: "#22c55e" }}>Mensagem enviada! A loja retornará em breve.</p>}
        {state === "error" && <p style={{ color: "var(--m-accent)" }}>Não foi possível enviar agora. Tente novamente ou fale pelo WhatsApp.</p>}
        {state === "unconfigured" && (
          <p className="text-[color:var(--m-muted)]">O envio por formulário ainda não foi configurado para esta loja. {wa && <a href={wa} target="_blank" rel="noopener noreferrer" className="underline">Fale pelo WhatsApp</a>}</p>
        )}
      </div>
    </form>
  );
}
