import { useMemo, useState, useEffect } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Facebook,
  Globe,
  Instagram,
  MapPin,
  Phone,
  Plus,
  Search,
  Sparkles,
  Star,
  Target,
  UserRound,
  Loader2,
  ExternalLink,
  X,
} from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { RecordDialog, type Field } from "@/components/RecordDialog";
import { StatCard } from "@/components/StatCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useRoles, useSession } from "@/lib/auth";
import { requireVendedor } from "@/lib/guard";
import { useProfiles } from "@/lib/people";
import {
  ESTADOS,
  LEVEL_LABEL,
  NICHOS,
  OPPORTUNITY_STATUS,
  OPPORTUNITY_STATUS_LABEL,
  PROSPECTING_SOURCE,
  useAddOpportunityToLeads,
  useChangeOpportunityStatus,
  useOpportunities,
  useSaveOpportunity,
  useSearchOpportunities,
  type Opportunity,
} from "@/lib/prospecting";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/prospeccao")({
  beforeLoad: () => requireVendedor(),
  head: () => ({
    meta: [
      { title: "Central de Prospecção — VYNEXA" },
      {
        name: "description",
        content:
          "Encontre empresas sem presença digital, classifique oportunidades e envie direto para o CRM da VYNEXA.",
      },
      { property: "og:title", content: "Central de Prospecção — VYNEXA" },
      {
        property: "og:description",
        content: "Prospecção de empresas por nicho, estado e cidade com envio automático para o funil.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ProspeccaoPage,
});

const opportunityFields: Field[] = [
  { name: "business_name", label: "Nome da empresa", required: true },
  {
    name: "category",
    label: "Nicho / categoria",
    type: "select",
    options: NICHOS.map((n) => ({ value: n, label: n })),
  },
  { name: "phone", label: "Telefone" },
  { name: "email", label: "E-mail", type: "email" },
  { name: "address", label: "Endereço" },
  { name: "city", label: "Cidade" },
  {
    name: "state",
    label: "Estado",
    type: "select",
    options: ESTADOS.map((uf) => ({ value: uf, label: uf })),
  },
  { name: "website", label: "Site (deixe vazio se não houver)" },
  { name: "instagram", label: "Instagram" },
  { name: "facebook", label: "Facebook" },
  { name: "google_maps_url", label: "Link do Google Maps" },
  { name: "notes", label: "Observações", type: "textarea" },
];

const LEVEL_STYLE: Record<string, string> = {
  alta: "border-destructive/30 bg-destructive/10 text-destructive",
  media: "border-warning/30 bg-warning/10 text-warning",
  baixa: "border-success/30 bg-success/10 text-success",
};

function LevelBadge({ level }: { level: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide",
        LEVEL_STYLE[level] ?? "border-border bg-muted text-muted-foreground",
      )}
    >
      {LEVEL_LABEL[level] ?? level}
    </span>
  );
}

function ProspeccaoPage() {
  const { user } = useSession();
  const { isAdmin } = useRoles();
  const [showArchived, setShowArchived] = useState(false);
  const { data: opportunities = [], isLoading } = useOpportunities(showArchived);
  const { data: profiles = [] } = useProfiles();
  const save = useSaveOpportunity();
  const addToLeads = useAddOpportunityToLeads();
  const changeStatus = useChangeOpportunityStatus();
  const searchExternal = useSearchOpportunities();
  const [externalResults, setExternalResults] = useState<Partial<Opportunity>[]>([]);

  // Formulário de busca (a fonte de dados externa chega na FASE 5.2).
  const [niche, setNiche] = useState("");
  const [otherNiche, setOtherNiche] = useState("");
  const [state, setState] = useState("");
  const [city, setCity] = useState("");
  const [searched, setSearched] = useState(false);
  const [precision, setPrecision] = useState<"alta" | "ampla">("alta");

  const [levelFilter, setLevelFilter] = useState("todas");
  const [statusFilter, setStatusFilter] = useState("todas");
  const [vendorFilter, setVendorFilter] = useState("todos");

  const scoped = useMemo(
    () => (isAdmin ? opportunities : opportunities.filter((o) => o.assigned_to === user?.id || o.created_by === user?.id)),
    [opportunities, isAdmin, user?.id],
  );

  const filtered = useMemo(
    () =>
      scoped.filter((o) => {
        if (levelFilter !== "todas" && o.opportunity_level !== levelFilter) return false;
        if (statusFilter !== "todas" && o.status !== statusFilter) return false;
        if (vendorFilter !== "todos" && o.assigned_to !== vendorFilter) return false;
        if (niche && (o.category ?? "") !== niche) return false;
        if (state && (o.state ?? "") !== state) return false;
        if (city && !(o.city ?? "").toLocaleLowerCase("pt-BR").includes(city.toLocaleLowerCase("pt-BR")))
          return false;
        return true;
      }),
    [scoped, levelFilter, statusFilter, vendorFilter, niche, state, city],
  );

  const total = scoped.length;
  const alta = scoped.filter((o) => o.opportunity_level === "alta").length;
  const leadsGerados = scoped.filter((o) => o.lead_id).length;
  const contatos = scoped.filter((o) =>
    ["contato_realizado", "em_negociacao", "convertida_cliente"].includes(o.status),
  ).length;
  const convertidas = scoped.filter((o) => o.status === "convertida_cliente").length;
  const conversao = total ? Math.round((convertidas / total) * 100) : 0;

  const nameOf = (id: string | null) => {
    const person = profiles.find((p) => p.id === id);
    return person?.nickname || person?.full_name || "—";
  };

  const ranking = (key: "category" | "city") => {
    const counts = new Map<string, number>();
    scoped.forEach((o) => {
      const value = (o[key] ?? "").trim();
      if (!value) return;
      counts.set(value, (counts.get(value) ?? 0) + 1);
    });
    return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
  };

  const byVendor = () => {
    const counts = new Map<string, { total: number; convertidas: number }>();
    scoped.forEach((o) => {
      const key = o.assigned_to ?? o.created_by;
      const current = counts.get(key) ?? { total: 0, convertidas: 0 };
      current.total += 1;
      if (o.status === "convertida_cliente") current.convertidas += 1;
      counts.set(key, current);
    });
    return [...counts.entries()].sort((a, b) => b[1].total - a[1].total);
  };

  return (
    <AppShell
      title="Central de Prospecção"
      description="Encontre empresas que podem precisar de uma presença digital profissional."
      actions={
        <RecordDialog
          title="Nova oportunidade"
          fields={opportunityFields}
          initial={{ state, city, category: niche }}
          onSubmit={(values) =>
            save.mutate({
              ...values,
              source: PROSPECTING_SOURCE,
              status: "nova",
              created_by: user?.id,
              assigned_to: user?.id,
            })
          }
          trigger={
            <Button className="gap-2 transition-all hover:-translate-y-0.5 hover:shadow-glow">
              <Plus className="size-4" /> Nova oportunidade
            </Button>
          }
        />
      }
    >
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Oportunidades encontradas" value={String(total)} icon={Search} />
        <StatCard label="Alta oportunidade" value={String(alta)} icon={Star} hint="Empresas sem site" />
        <StatCard label="Leads adicionados" value={String(leadsGerados)} icon={Target} />
        <StatCard label="Contatos realizados" value={String(contatos)} icon={Phone} />
      </div>

      {/* Busca externa via Geoapify */}
      <section className="mt-6 rounded-2xl border border-border bg-card p-5 shadow-panel">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Sparkles className="size-4 text-primary" />
            <h2 className="text-lg font-semibold tracking-tight">Encontrar novas oportunidades</h2>
          </div>
          {externalResults.length > 0 && (
            <Button variant="ghost" size="sm" onClick={() => setExternalResults([])}>
              Limpar resultados da busca
            </Button>
          )}
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          Encontre empresas reais via Geoapify filtrando por nicho e localização.
        </p>
        <div className="mt-4 grid gap-4 md:grid-cols-4">
          <div className="space-y-2">
            <Label>Nicho / categoria</Label>
            <Select value={niche} onValueChange={(v) => { 
              setNiche(v); 
              if(v !== "Outros") {
                setOtherNiche("");
              }
            }}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o nicho" />
              </SelectTrigger>
              <SelectContent>
                {NICHOS.map((n) => (
                  <SelectItem key={n} value={n}>
                    {n}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {niche === "Outros" && (
              <div className="mt-2 space-y-1">
                <Label className="text-[10px] text-muted-foreground uppercase font-semibold">Digite o nicho que deseja pesquisar</Label>
                <Input
                  placeholder="Ex.: Academia, Pet shop, Loja de roupas..."
                  value={otherNiche}
                  onChange={(e) => setOtherNiche(e.target.value)}
                  autoFocus
                />
              </div>
            )}
          </div>
          <div className="space-y-2">
            <Label>Estado</Label>
            <Select value={state} onValueChange={setState}>
              <SelectTrigger>
                <SelectValue placeholder="UF" />
              </SelectTrigger>
              <SelectContent>
                {ESTADOS.map((uf) => (
                  <SelectItem key={uf} value={uf}>
                    {uf}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Cidade <span className="text-[10px] font-normal text-muted-foreground uppercase tracking-wider ml-1">(Opcional)</span></Label>
            <Input value={city} onChange={(e) => setCity(e.target.value)} placeholder="Ex: Contagem" />
          </div>
          <div className="space-y-2">
            <Label>Precisão da busca</Label>
            <Select value={precision} onValueChange={(v: "alta" | "ampla") => setPrecision(v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="alta">🎯 Alta</SelectItem>
                <SelectItem value="ampla">🔎 Ampla</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-[10px] text-muted-foreground mt-1">
              {precision === "alta" 
                ? "Somente empresas diretamente relacionadas ao nicho." 
                : "Inclui empresas relacionadas ao segmento."}
            </p>
          </div>
          <div className="flex items-end">
            <Button
              className="w-full gap-2 transition-all hover:-translate-y-0.5 hover:shadow-glow"
              disabled={!niche || !state || searchExternal.isPending}
              onClick={() => {
                setSearched(true);
                searchExternal.mutate(
                  { niche: niche === "Outros" ? otherNiche : niche, state, city, precision },
                  { onSuccess: (data) => setExternalResults(data) }
                );
              }}
            >
              {searchExternal.isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Search className="size-4" />
              )}
              Encontrar oportunidades
            </Button>
          </div>
        </div>
      </section>


      {/* Filtros */}
      <section className="mt-6 grid gap-4 md:grid-cols-3">
        <div className="space-y-2">
          <Label>Nível de oportunidade</Label>
          <Select value={levelFilter} onValueChange={setLevelFilter}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todas</SelectItem>
              <SelectItem value="alta">Alta</SelectItem>
              <SelectItem value="media">Média</SelectItem>
              <SelectItem value="baixa">Baixa</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Status</Label>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todas</SelectItem>
              {OPPORTUNITY_STATUS.map((s) => (
                <SelectItem key={s} value={s}>
                  {OPPORTUNITY_STATUS_LABEL[s]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {isAdmin ? (
          <div className="space-y-2">
            <Label>Vendedor</Label>
            <Select value={vendorFilter} onValueChange={setVendorFilter}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os vendedores</SelectItem>
                {profiles.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.nickname || p.full_name || p.id}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ) : null}
      </section>

      {/* Resultados da busca externa */}
      {externalResults.length > 0 && (
        <section className="mt-6">
          <h2 className="text-lg font-semibold tracking-tight text-primary">
            Resultados da busca externa <span className="text-muted-foreground">({externalResults.length})</span>
          </h2>
          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            {externalResults.map((opt, i) => (
              <ExternalOpportunityCard
                key={i}
                opportunity={opt}
                onAdd={() => {
                  user && save.mutate({
                    ...opt,
                    created_by: user.id,
                    assigned_to: user.id,
                  });
                  setExternalResults(prev => prev.filter((_, idx) => idx !== i));
                }}
              />
            ))}
          </div>
        </section>
      )}

      {/* Base de prospecção salva */}
      <section className="mt-8">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold tracking-tight">
            {showArchived ? "Oportunidades arquivadas" : (isAdmin ? "Todas as oportunidades salvas" : "Minhas oportunidades salvas")}{" "}
            <span className="text-muted-foreground">({filtered.length})</span>
          </h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowArchived(!showArchived)}
            className="text-muted-foreground hover:text-foreground"
          >
            {showArchived ? "Ver ativas" : "Ver arquivadas"}
          </Button>
        </div>

        {isLoading ? (
          <p className="mt-4 text-sm text-muted-foreground">Carregando oportunidades…</p>
        ) : filtered.length === 0 ? (
          <div className="mt-4 rounded-2xl border border-dashed border-border bg-card/50 p-10 text-center">
            <p className="text-base font-medium">Nenhuma oportunidade salva encontrada.</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {searched || niche || state || city
                ? "Ajuste os filtros ou use a busca para encontrar novas empresas."
                : "Comece escolhendo um nicho, estado e cidade para buscar."}
            </p>
          </div>
        ) : (
          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            {filtered.map((opportunity) => (
              <OpportunityCard
                key={opportunity.id}
                opportunity={opportunity}
                ownerName={isAdmin ? nameOf(opportunity.assigned_to) : null}
                onAdd={() =>
                  user && addToLeads.mutate({ opportunity, userId: user.id })
                }
                onStatus={(status) =>
                  user && changeStatus.mutate({ opportunity, status, userId: user.id })
                }
                showArchived={showArchived}
                onRemove={() => {
                  if (showArchived) {
                    if (confirm("Restaurar oportunidade?\nEssa empresa voltará para sua lista de oportunidades ativas.")) {
                      save.mutate({ id: opportunity.id, removed_at: null });
                    }
                  } else {
                    if (confirm("Remover oportunidade?\nEssa empresa será retirada das suas oportunidades salvas.")) {
                      save.mutate({ id: opportunity.id, removed_at: new Date().toISOString() });
                    }
                  }
                }}
              />
            ))}
          </div>
        )}
      </section>


      {/* Painel administrativo */}
      {isAdmin ? (
        <section className="mt-8 grid gap-4 lg:grid-cols-3">
          <div className="rounded-2xl border border-border bg-card p-5 shadow-panel">
            <h3 className="text-sm font-semibold">Desempenho por vendedor</h3>
            <ul className="mt-3 space-y-2 text-sm">
              {byVendor().length === 0 ? (
                <li className="text-muted-foreground">Sem dados ainda.</li>
              ) : (
                byVendor().map(([id, stats]) => (
                  <li key={id} className="flex items-center justify-between gap-3">
                    <span className="flex items-center gap-2">
                      <UserRound className="size-4 text-muted-foreground" />
                      {nameOf(id)}
                    </span>
                    <span className="text-muted-foreground">
                      {stats.total} · {stats.convertidas} convertidas
                    </span>
                  </li>
                ))
              )}
            </ul>
            <p className="mt-4 text-xs text-muted-foreground">Taxa de conversão geral: {conversao}%</p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-5 shadow-panel">
            <h3 className="text-sm font-semibold">Principais nichos</h3>
            <ul className="mt-3 space-y-2 text-sm">
              {ranking("category").length === 0 ? (
                <li className="text-muted-foreground">Sem dados ainda.</li>
              ) : (
                ranking("category").map(([value, count]) => (
                  <li key={value} className="flex justify-between gap-3">
                    <span>{value}</span>
                    <span className="text-muted-foreground">{count}</span>
                  </li>
                ))
              )}
            </ul>
          </div>
          <div className="rounded-2xl border border-border bg-card p-5 shadow-panel">
            <h3 className="text-sm font-semibold">Principais cidades</h3>
            <ul className="mt-3 space-y-2 text-sm">
              {ranking("city").length === 0 ? (
                <li className="text-muted-foreground">Sem dados ainda.</li>
              ) : (
                ranking("city").map(([value, count]) => (
                  <li key={value} className="flex justify-between gap-3">
                    <span>{value}</span>
                    <span className="text-muted-foreground">{count}</span>
                  </li>
                ))
              )}
            </ul>
          </div>
        </section>
      ) : null}
    </AppShell>
  );
}

function ExternalOpportunityCard({
  opportunity,
  onAdd,
}: {
  opportunity: Partial<Opportunity>;
  onAdd: () => void;
}) {
  return (
    <article className="rounded-2xl border border-primary/20 bg-card p-5 shadow-panel transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-glow">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <LevelBadge level={opportunity.opportunity_level || "alta"} />
        <span className="rounded-full border border-primary/20 bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
          GEOAPIFY
        </span>
      </div>

      <h3 className="mt-3 text-lg font-semibold tracking-tight">{opportunity.business_name}</h3>
      <p className="text-sm text-muted-foreground">
        {opportunity.category ?? "Sem categoria"}
        {opportunity.city ? ` · ${opportunity.city}` : ""}
        {opportunity.state ? ` - ${opportunity.state}` : ""}
      </p>

      <ul className="mt-3 space-y-1.5 text-sm">
        {opportunity.phone && (
          <li className="flex items-center gap-2">
            <Phone className="size-4 text-muted-foreground" />
            {opportunity.phone}
          </li>
        )}
        <li className="flex items-center gap-2">
          <Globe className="size-4 text-muted-foreground" />
          {opportunity.website ? (
            <a href={opportunity.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-primary hover:underline">
              {opportunity.website} <ExternalLink className="size-3" />
            </a>
          ) : (
            <span className="text-muted-foreground">Site: Não encontrado</span>
          )}
        </li>
        {opportunity.address && (
          <li className="flex items-center gap-2">
            <MapPin className="size-4 text-muted-foreground" />
            <span className="line-clamp-1">{opportunity.address}</span>
          </li>
        )}
        {(opportunity.rating !== null && opportunity.rating !== undefined) && (
          <li className="flex items-center gap-2">
            <Star className="size-4 text-warning fill-warning" />
            <span>{opportunity.rating} ({opportunity.review_count || 0} avaliações)</span>
          </li>
        )}
      </ul>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Button className="gap-2 transition-all hover:-translate-y-0.5 hover:shadow-glow" onClick={onAdd}>
          <Plus className="size-4" /> Salvar em oportunidades
        </Button>
        <Button variant="outline" size="sm" asChild>
          <a 
            href={(() => {
              const name = opportunity.business_name;
              const address = opportunity.address;
              const city = opportunity.city;
              const state = opportunity.state;
              const country = "Brasil";
              
              if (name && (address || city || state)) {
                const queryParts = [name];
                if (address) queryParts.push(address);
                if (city) queryParts.push(city);
                if (state) queryParts.push(state);
                queryParts.push(country);
                
                return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(queryParts.join(", "))}`;
              }

              if (opportunity.lat && opportunity.lon) {
                return `https://www.google.com/maps/search/?api=1&query=${opportunity.lat},${opportunity.lon}`;
              }

              return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(name || "")}`;
            })()} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="gap-1"
            onClick={(e) => {
              e.stopPropagation();
            }}
          >
            🗺️ Ver no Google Maps <ExternalLink className="size-3" />
          </a>
        </Button>
      </div>
    </article>
  );
}

function OpportunityCard({
  opportunity,
  ownerName,
  onAdd,
  onStatus,
  onRemove,
  showArchived,
}: {
  opportunity: Opportunity;
  ownerName: string | null;
  onAdd: () => void;
  onStatus: (status: string) => void;
  onRemove: () => void;
  showArchived?: boolean;
}) {
  return (
    <article className="relative rounded-2xl border border-border bg-card p-5 shadow-panel transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-glow">
      <Button
        variant="ghost"
        size="icon"
        className={cn(
          "absolute right-3 top-3 size-8 rounded-full",
          showArchived 
            ? "hover:bg-primary/10 hover:text-primary" 
            : "hover:bg-destructive/10 hover:text-destructive"
        )}
        onClick={onRemove}
      >
        {showArchived ? <Sparkles className="size-4 text-primary" /> : <X className="size-4" />}
      </Button>

      <div className="flex flex-wrap items-start justify-between gap-2 pr-8">
        <LevelBadge level={opportunity.opportunity_level} />
        <span className="rounded-full border border-border bg-muted px-2.5 py-0.5 text-xs text-muted-foreground">
          {OPPORTUNITY_STATUS_LABEL[opportunity.status] ?? opportunity.status}
        </span>
      </div>

      <h3 className="mt-3 text-lg font-semibold tracking-tight">{opportunity.business_name}</h3>
      <p className="text-sm text-muted-foreground">
        {opportunity.category ?? "Sem categoria"}
        {opportunity.city ? ` · ${opportunity.city}` : ""}
        {opportunity.state ? ` - ${opportunity.state}` : ""}
      </p>

      <ul className="mt-3 space-y-1.5 text-sm">
        <li className="flex items-center gap-2">
          <Phone className="size-4 text-muted-foreground" />
          {opportunity.phone || "Telefone não informado"}
        </li>
        <li className="flex items-center gap-2">
          <Globe className="size-4 text-muted-foreground" />
          {opportunity.website || "Site: Não encontrado"}
        </li>
        <li className="flex items-center gap-2">
          <Instagram className="size-4 text-muted-foreground" />
          {opportunity.instagram || "Instagram não informado"}
        </li>
        <li className="flex items-center gap-2">
          <Facebook className="size-4 text-muted-foreground" />
          {opportunity.facebook || "Facebook não informado"}
        </li>
        <li className="flex items-center gap-2">
          <MapPin className="size-4 text-muted-foreground" />
          <a 
            href={(() => {
              const name = opportunity.business_name;
              const address = opportunity.address;
              const city = opportunity.city;
              const state = opportunity.state;
              const country = "Brasil";
              
              if (name && (address || city || state)) {
                const queryParts = [name];
                if (address) queryParts.push(address);
                if (city) queryParts.push(city);
                if (state) queryParts.push(state);
                queryParts.push(country);
                
                return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(queryParts.join(", "))}`;
              }

              if (opportunity.lat && opportunity.lon) {
                return `https://www.google.com/maps/search/?api=1&query=${opportunity.lat},${opportunity.lon}`;
              }

              return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(name || "")}`;
            })()}
            target="_blank" 
            rel="noopener noreferrer"
            className="text-primary hover:underline flex items-center gap-1"
            onClick={(e) => e.stopPropagation()}
          >
            🗺️ Ver no Google Maps <ExternalLink className="size-3" />
          </a>
        </li>
        <li className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
          <Sparkles className="size-3" />
          Origem: {opportunity.source}
          {ownerName ? ` · ${ownerName}` : ""}
        </li>
      </ul>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        {opportunity.lead_id ? (
          <Button asChild variant="secondary" className="gap-2">
            <Link to="/leads/$leadId" params={{ leadId: opportunity.lead_id }}>
              Abrir lead no CRM
            </Link>
          </Button>
        ) : (
          <Button className="gap-2 transition-all hover:-translate-y-0.5 hover:shadow-glow" onClick={onAdd}>
            <Plus className="size-4" /> Adicionar aos meus leads
          </Button>
        )}
        <Select value={opportunity.status} onValueChange={onStatus}>
          <SelectTrigger className="w-[210px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {OPPORTUNITY_STATUS.map((s) => (
              <SelectItem key={s} value={s}>
                {OPPORTUNITY_STATUS_LABEL[s]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </article>
  );
}
