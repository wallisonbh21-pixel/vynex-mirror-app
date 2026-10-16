/**
 * TEMPLATE 06 — SCALENEXUS MOTORS (concessionárias, revendas e lojas de motos)
 *
 * Dados separados do visual (mesmo padrão dos Templates 01–05).
 * O NexusBuild / Studio substituem apenas este objeto.
 * Todo conteúdo é DEMONSTRATIVO: a loja, os veículos, preços e condições são fictícios.
 * Sem depoimentos, clientes ou ofertas reais inventados.
 */

export const MOTORS_TEMPLATE_ID = "tpl-scalenexus-motors";
export const MOTORS_TEMPLATE_VERSION = 1;
export const MOTORS_BASE_ROUTE = "/template/scalenexus-motors";

export type VehicleType = "carro" | "moto" | "utilitario";
export type Fuel = "flex" | "gasolina" | "diesel" | "eletrico" | "hibrido";
export type Transmission = "manual" | "automatico" | "cvt";
export type Availability = "disponivel" | "reservado" | "vendido";

export type Vehicle = {
  /** Identificador estável — nunca derivado do texto visível. */
  id: string;
  type: VehicleType;
  brand: string;
  model: string;
  version: string;
  year: number;
  price: number | null;
  mileageKm: number | null;
  fuel: Fuel;
  transmission: Transmission;
  color: string;
  photos: string[];
  description: string;
  equipment: string[];
  commercialNotes: string;
  availability: Availability;
  featured: boolean;
  offer: boolean;
  /** true = veículo demonstrativo, deve ser substituído pelo estoque real. */
  demo: boolean;
};

export type MotorsTestimonial = { id: string; name: string; text: string };
export type MotorsDifferential = { id: string; title: string; text: string };

export type MotorsContent = {
  store: {
    name: string; shortName: string; logoUrl: string; tagline: string;
    phone: string; whatsapp: string; email: string; address: string; city: string;
    hours: string[]; mapUrl: string;
    socials: { label: string; href: string }[];
  };
  hero: { eyebrow: string; title: string; text: string; primaryCta: string; secondaryCta: string; vehicleId: string; imageUrl: string };
  featured: { title: string; text: string };
  offers: { title: string; text: string; disclaimer: string };
  differentials: { title: string; items: MotorsDifferential[] };
  tradeIn: { title: string; text: string; cta: string };
  /** Vazio = seção oculta. Nunca preencher com depoimentos inventados. */
  testimonials: { title: string; items: MotorsTestimonial[] };
  contact: {
    title: string; text: string;
    /** Endpoint real para envio dos formulários. Vazio = integração não configurada (nada é simulado). */
    formEndpoint: string;
    privacyNotice: string;
  };
  footer: { legal: string };
  vehicles: Vehicle[];
  theme: { background: string; surface: string; surfaceAlt: string; line: string; text: string; muted: string; accent: string; headingFont: string; bodyFont: string };
};

const img = (id: string, w = 1400) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=80`;

export const MOTORS_DEFAULT_CONTENT: MotorsContent = {
  store: {
    name: "Nexus Motors Seminovos",
    shortName: "Nexus Motors",
    logoUrl: "",
    tagline: "Seminovos selecionados, revisados e com procedência",
    phone: "(00) 0000-0000",
    whatsapp: "5500000000000",
    email: "contato@suaconcessionaria.com.br",
    address: "Av. Exemplo, 1000 — Centro",
    city: "Sua cidade — UF",
    hours: ["Segunda a sexta: 8h às 18h", "Sábado: 8h às 13h"],
    mapUrl: "https://www.google.com/maps",
    socials: [
      { label: "Instagram", href: "https://instagram.com/" },
      { label: "Facebook", href: "https://facebook.com/" },
    ],
  },
  hero: {
    eyebrow: "Conteúdo demonstrativo",
    title: "Seu próximo veículo está aqui",
    text: "Carros e motos seminovos revisados, com laudo de procedência e atendimento direto pelo WhatsApp.",
    primaryCta: "Ver estoque",
    secondaryCta: "Avaliar meu usado",
    vehicleId: "v-sedan-01",
    imageUrl: img("photo-1503376780353-7e6692767b70", 2000),
  },
  featured: { title: "Veículos em destaque", text: "Uma seleção do nosso estoque atual." },
  offers: { title: "Ofertas e oportunidades", text: "Condições especiais em veículos selecionados.", disclaimer: "Valores e condições demonstrativos. Consulte disponibilidade com a loja." },
  differentials: {
    title: "Por que comprar com a gente",
    items: [
      { id: "d-revisao", title: "Revisão completa", text: "Todos os veículos passam por inspeção antes de entrar no estoque." },
      { id: "d-procedencia", title: "Procedência verificada", text: "Consulta de documentação e histórico antes da venda." },
      { id: "d-troca", title: "Aceitamos seu usado", text: "Avaliação do seu veículo como parte do pagamento." },
      { id: "d-atendimento", title: "Atendimento direto", text: "Fale com um consultor pelo WhatsApp, sem intermediários." },
    ],
  },
  tradeIn: { title: "Quer trocar de veículo?", text: "Envie os dados do seu usado e receba uma proposta de avaliação da nossa equipe.", cta: "Solicitar avaliação" },
  testimonials: { title: "O que dizem nossos clientes", items: [] },
  contact: {
    title: "Fale com a loja",
    text: "Tire dúvidas, agende uma visita ou peça mais informações sobre um veículo.",
    formEndpoint: "",
    privacyNotice: "Seus dados serão usados apenas para retornar o seu contato.",
  },
  footer: { legal: "Imagens meramente ilustrativas. Preços, estoque e condições sujeitos a alteração sem aviso prévio." },
  vehicles: [
    { id: "v-sedan-01", type: "carro", brand: "Porsche", model: "911 Carrera", version: "3.0 Turbo", year: 2021, price: 789900, mileageKm: 18500, fuel: "gasolina", transmission: "automatico", color: "Prata", photos: [img("photo-1503376780353-7e6692767b70"), img("photo-1580273916550-e323be2ae537")], description: "Esportivo em excelente estado, revisões em dia.", equipment: ["Bancos em couro", "Central multimídia", "Câmera de ré", "Sensor de estacionamento"], commercialNotes: "Aceita troca. Consulte condições.", availability: "disponivel", featured: true, offer: false, demo: true },
    { id: "v-muscle-02", type: "carro", brand: "Ford", model: "Mustang", version: "GT 5.0 V8", year: 2020, price: 429900, mileageKm: 32000, fuel: "gasolina", transmission: "automatico", color: "Branco", photos: [img("photo-1494976388531-d1058494cdd8")], description: "Clássico americano com motor V8.", equipment: ["Ar-condicionado digital", "Faróis full LED", "Rodas de liga leve"], commercialNotes: "Revisado.", availability: "disponivel", featured: true, offer: true, demo: true },
    { id: "v-bmw-03", type: "carro", brand: "BMW", model: "M4", version: "Competition", year: 2022, price: 699900, mileageKm: 12000, fuel: "gasolina", transmission: "automatico", color: "Azul", photos: [img("photo-1555215695-3004980ad54e")], description: "Baixa quilometragem, único dono.", equipment: ["Teto solar", "Som premium", "Piloto automático adaptativo"], commercialNotes: "", availability: "reservado", featured: true, offer: false, demo: true },
    { id: "v-suv-04", type: "utilitario", brand: "Toyota", model: "Hilux", version: "SRX 2.8 Diesel 4x4", year: 2023, price: 289900, mileageKm: 24000, fuel: "diesel", transmission: "automatico", color: "Cinza", photos: [img("photo-1559416523-140ddc3d238c")], description: "Picape 4x4 pronta para trabalho e lazer.", equipment: ["Tração 4x4", "Controle de estabilidade", "Engate"], commercialNotes: "Consulte financiamento com a loja.", availability: "disponivel", featured: false, offer: true, demo: true },
    { id: "v-hatch-05", type: "carro", brand: "Volkswagen", model: "Polo", version: "1.0 TSI Highline", year: 2022, price: 94900, mileageKm: 28000, fuel: "flex", transmission: "automatico", color: "Vermelho", photos: [img("photo-1552519507-da3b142c6e3d")], description: "Hatch econômico e completo.", equipment: ["Multimídia com espelhamento", "Ar-condicionado"], commercialNotes: "", availability: "disponivel", featured: false, offer: true, demo: true },
    { id: "v-moto-06", type: "moto", brand: "Honda", model: "CB 500F", version: "ABS", year: 2023, price: 36900, mileageKm: 6500, fuel: "gasolina", transmission: "manual", color: "Preta", photos: [img("photo-1558981806-ec527fa84c39")], description: "Naked versátil, ideal para cidade e estrada.", equipment: ["Freios ABS", "Painel digital"], commercialNotes: "", availability: "disponivel", featured: true, offer: false, demo: true },
    { id: "v-moto-07", type: "moto", brand: "Yamaha", model: "MT-07", version: "ABS", year: 2022, price: 44900, mileageKm: 9800, fuel: "gasolina", transmission: "manual", color: "Cinza", photos: [img("photo-1609630875171-b1321377ee65")], description: "Motor bicilíndrico com ótimo torque.", equipment: ["Freios ABS", "Iluminação LED"], commercialNotes: "", availability: "vendido", featured: false, offer: false, demo: true },
    { id: "v-eletrico-08", type: "carro", brand: "BYD", model: "Dolphin", version: "EV", year: 2024, price: 139900, mileageKm: 4000, fuel: "eletrico", transmission: "automatico", color: "Branco", photos: [], description: "Elétrico compacto, baixo custo por km.", equipment: ["Carregador portátil", "Teto panorâmico"], commercialNotes: "", availability: "disponivel", featured: false, offer: false, demo: true },
  ],
  theme: { background: "#0a0a0b", surface: "#141416", surfaceAlt: "#1c1c1f", line: "#2a2a2e", text: "#f4f4f5", muted: "#a1a1aa", accent: "#e11d2e", headingFont: "Sora", bodyFont: "Manrope" },
};

/* ---------- Regras de negócio puras (usadas pelo site, Studio e testes) ---------- */

const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
export const formatBRL = (v: number | null | undefined) => (typeof v === "number" && Number.isFinite(v) ? brl.format(v) : "Consulte");
export const formatKm = (v: number | null | undefined) => (typeof v === "number" && Number.isFinite(v) ? `${v.toLocaleString("pt-BR")} km` : "—");

export const LABELS = {
  type: { carro: "Carro", moto: "Moto", utilitario: "Utilitário" } as Record<VehicleType, string>,
  fuel: { flex: "Flex", gasolina: "Gasolina", diesel: "Diesel", eletrico: "Elétrico", hibrido: "Híbrido" } as Record<Fuel, string>,
  transmission: { manual: "Manual", automatico: "Automático", cvt: "CVT" } as Record<Transmission, string>,
  availability: { disponivel: "Disponível", reservado: "Reservado", vendido: "Vendido" } as Record<Availability, string>,
};

export type VehicleFilters = {
  q?: string | undefined; brand?: string | undefined; model?: string | undefined; type?: string | undefined; fuel?: string | undefined; transmission?: string | undefined;
  yearMin?: number | undefined; yearMax?: number | undefined; priceMin?: number | undefined; priceMax?: number | undefined; kmMax?: number | undefined;
  sort?: "relevancia" | "preco-asc" | "preco-desc" | "ano-desc" | "ano-asc" | undefined;
  includeSold?: boolean | undefined;
};

export function filterVehicles(list: Vehicle[], f: VehicleFilters): Vehicle[] {
  const q = (f.q ?? "").trim().toLowerCase();
  const out = (list ?? []).filter((v) => {
    if (!v || !v.id) return false;
    if (!f.includeSold && v.availability === "vendido") return false;
    if (q && !`${v.brand} ${v.model} ${v.version}`.toLowerCase().includes(q)) return false;
    if (f.brand && v.brand !== f.brand) return false;
    if (f.model && v.model !== f.model) return false;
    if (f.type && v.type !== f.type) return false;
    if (f.fuel && v.fuel !== f.fuel) return false;
    if (f.transmission && v.transmission !== f.transmission) return false;
    if (f.yearMin && v.year < f.yearMin) return false;
    if (f.yearMax && v.year > f.yearMax) return false;
    if (f.priceMin && (v.price ?? 0) < f.priceMin) return false;
    if (f.priceMax && (v.price == null || v.price > f.priceMax)) return false;
    if (f.kmMax && (v.mileageKm == null || v.mileageKm > f.kmMax)) return false;
    return true;
  });
  const p = (v: Vehicle) => v.price ?? Number.POSITIVE_INFINITY;
  switch (f.sort) {
    case "preco-asc": return out.sort((a, b) => p(a) - p(b));
    case "preco-desc": return out.sort((a, b) => (b.price ?? -1) - (a.price ?? -1));
    case "ano-desc": return out.sort((a, b) => b.year - a.year);
    case "ano-asc": return out.sort((a, b) => a.year - b.year);
    default: return out;
  }
}

export const findVehicle = (list: Vehicle[], id: string) => (list ?? []).find((v) => v.id === id) ?? null;
export const vehicleTitle = (v: Vehicle) => `${v.brand} ${v.model}`.trim();

export function whatsappLink(phone: string, message: string) {
  const digits = (phone ?? "").replace(/\D/g, "");
  if (digits.length < 10) return null;
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}

export const uniqueValues = <K extends keyof Vehicle>(list: Vehicle[], key: K) =>
  Array.from(new Set((list ?? []).map((v) => v[key]).filter(Boolean))).sort() as Vehicle[K][];
