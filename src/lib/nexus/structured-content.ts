/**
 * NEXUSBUILD AI — preenchimento de conteúdo estruturado (listas, FAQ, galerias,
 * produtos e estoque de veículos do Template 06).
 *
 * Puro (sem banco): validação + transformação de seções. O renderizador do
 * Studio e do site publicado só exibe title/subtitle/paragraph/button/image,
 * então cada item vira elementos desses tipos, com ids estáveis.
 */
import type { StudioElement, StudioSection } from "@/types/studio";
import { motorsToStudioData } from "@/lib/templates/scalenexus-motors/to-studio";
import {
  MOTORS_DEFAULT_CONTENT,
  type Availability,
  type Fuel,
  type Transmission,
  type Vehicle,
  type VehicleType,
} from "@/lib/templates/scalenexus-motors/content";

export const ITEM_KINDS = ["list", "faq", "gallery", "products", "testimonials"] as const;
export type ItemKind = (typeof ITEM_KINDS)[number];
export const MAX_ITEMS = 24;
export const MAX_VEHICLES = 40;
export const DEMO_LABEL = "Conteúdo demonstrativo — substitua pelos dados reais.";

export interface StructuredItem {
  title: string;
  text?: string;
  image_url?: string;
  image_alt?: string;
  price?: number | null;
  button_text?: string;
  button_href?: string;
  author?: string;
}

const str = (v: unknown, max: number) => typeof v === "string" && v.trim().length > 0 && v.length <= max;
const optStr = (v: unknown, max: number) => v === undefined || v === null || v === "" || str(v, max);
const isUrl = (v: unknown) => typeof v === "string" && /^https:\/\/[^\s]+$/i.test(v);
const optUrl = (v: unknown) => v === undefined || v === null || v === "" || isUrl(v);
const isHref = (v: unknown) => typeof v === "string" && /^(https:\/\/|mailto:|tel:|#|\/)[^\s]*$/i.test(v);

/** Valida SET_ITEMS. Retorna mensagens de erro (vazio = válido). */
export function validateItemsParams(params: any): string[] {
  const errors: string[] = [];
  if (!str(params?.section_id, 80)) errors.push("section_id é obrigatório.");
  if (!ITEM_KINDS.includes(params?.kind)) errors.push(`kind deve ser um de: ${ITEM_KINDS.join(", ")}.`);
  const items = params?.items;
  if (!Array.isArray(items)) return [...errors, "items deve ser uma lista."];
  if (items.length > MAX_ITEMS) errors.push(`Máximo de ${MAX_ITEMS} itens por seção.`);
  if (typeof params?.demo !== "boolean") errors.push("demo é obrigatório (true quando o conteúdo não veio do cliente).");
  items.forEach((it: any, i: number) => {
    const p = `items[${i}]`;
    if (!it || typeof it !== "object") return errors.push(`${p} inválido.`);
    if (params.kind === "gallery") {
      if (!isUrl(it.image_url)) errors.push(`${p}.image_url deve ser uma URL https.`);
      if (!optStr(it.title, 120)) errors.push(`${p}.title muito longo.`);
    } else if (!str(it.title, 160)) errors.push(`${p}.title é obrigatório (até 160 caracteres).`);
    if (params.kind === "faq" && !str(it.text, 800)) errors.push(`${p}.text (resposta) é obrigatório.`);
    if (params.kind === "testimonials" && (!str(it.text, 600) || !str(it.author, 80)))
      errors.push(`${p}: depoimento exige text e author fornecidos pelo cliente.`);
    if (!optStr(it.text, 800)) errors.push(`${p}.text muito longo (até 800).`);
    if (!optUrl(it.image_url)) errors.push(`${p}.image_url deve ser https.`);
    if (!optStr(it.image_alt, 160)) errors.push(`${p}.image_alt muito longo.`);
    if (it.price !== undefined && it.price !== null && !(typeof it.price === "number" && it.price >= 0 && it.price < 1e9))
      errors.push(`${p}.price deve ser número >= 0 ou null.`);
    if (!optStr(it.button_text, 60)) errors.push(`${p}.button_text muito longo.`);
    if (it.button_href && !isHref(it.button_href)) errors.push(`${p}.button_href inválido.`);
  });
  if (params?.kind === "testimonials" && params?.demo === true)
    errors.push("Depoimentos não podem ser demonstrativos/inventados. Use somente depoimentos reais fornecidos pelo cliente.");
  return errors;
}

const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

/** Substitui os itens de uma seção, preservando título/cabeçalho e estilos. */
export function applyItems(section: StudioSection, params: { kind: ItemKind; items: StructuredItem[]; demo: boolean }) {
  const prefix = `itm_${section.id}_`;
  // Remove contêineres vazios (não renderizáveis) e itens gerados anteriormente.
  const kept = (section.elements ?? []).filter((el) => !el.id.startsWith(prefix) && !(el.type === "container" && !el.content?.children));
  const out: StudioElement[] = [];
  const el = (suffix: string, type: StudioElement["type"], content: any, styles: Record<string, any> = {}): StudioElement => ({
    id: `${prefix}${suffix}`,
    type,
    content,
    styles,
  });
  params.items.forEach((it, i) => {
    const n = String(i + 1).padStart(2, "0");
    if (params.kind === "gallery") {
      out.push(el(`${n}_img`, "image", { url: it.image_url, alt: it.image_alt || it.title || `Imagem ${i + 1}` }, { borderRadius: "0.75rem" }));
      if (it.title) out.push(el(`${n}_cap`, "paragraph", { text: it.title }, { fontSize: "0.85rem", opacity: 0.8 }));
      return;
    }
    if (it.image_url) out.push(el(`${n}_img`, "image", { url: it.image_url, alt: it.image_alt || it.title }, { borderRadius: "0.75rem" }));
    out.push(el(`${n}_title`, "subtitle", { text: params.kind === "faq" ? it.title : it.title }));
    if (params.kind === "products" && it.price !== undefined)
      out.push(el(`${n}_price`, "title", { text: typeof it.price === "number" ? brl.format(it.price) : "Consulte" }, { fontSize: "1.5rem" }));
    if (it.text) out.push(el(`${n}_text`, "paragraph", { text: params.kind === "testimonials" ? `“${it.text}” — ${it.author}` : it.text }));
    if (it.button_text) out.push(el(`${n}_btn`, "button", { text: it.button_text, href: it.button_href || "#" }));
  });
  if (params.demo && params.items.length > 0) out.push(el("demo_notice", "paragraph", { text: DEMO_LABEL }, { fontSize: "0.75rem", opacity: 0.7 }));
  section.elements = [...kept, ...out];
  return out.length;
}

// ---------- Template 06: estoque de veículos ----------

const VEHICLE_TYPES: VehicleType[] = ["carro", "moto", "utilitario"];
const FUELS: Fuel[] = ["flex", "gasolina", "diesel", "eletrico", "hibrido"];
const TRANSMISSIONS: Transmission[] = ["manual", "automatico", "cvt"];
const AVAILABILITY: Availability[] = ["disponivel", "reservado", "vendido"];

/** Valida e normaliza a lista de veículos. Lança erros acumulados. */
export function validateVehicles(raw: unknown): { vehicles: Vehicle[]; errors: string[] } {
  const errors: string[] = [];
  if (!Array.isArray(raw) || raw.length === 0) return { vehicles: [], errors: ["vehicles deve ser uma lista com pelo menos 1 veículo."] };
  if (raw.length > MAX_VEHICLES) errors.push(`Máximo de ${MAX_VEHICLES} veículos.`);
  const ids = new Set<string>();
  const year = new Date().getFullYear();
  const vehicles: Vehicle[] = raw.slice(0, MAX_VEHICLES).map((v: any, i: number) => {
    const p = `vehicles[${i}]`;
    const id = String(v?.id ?? "").trim().toLowerCase();
    if (!/^[a-z0-9-]{1,40}$/.test(id)) errors.push(`${p}.id deve ter letras minúsculas, números ou hífens.`);
    if (ids.has(id)) errors.push(`${p}.id duplicado: ${id}.`);
    ids.add(id);
    if (!str(v?.brand, 40)) errors.push(`${p}.brand é obrigatório.`);
    if (!str(v?.model, 60)) errors.push(`${p}.model é obrigatório.`);
    if (!optStr(v?.version, 80)) errors.push(`${p}.version muito longo.`);
    if (!Number.isInteger(v?.year) || v.year < 1950 || v.year > year + 1) errors.push(`${p}.year inválido.`);
    if (v?.price !== null && v?.price !== undefined && !(typeof v.price === "number" && v.price > 0 && v.price < 1e8)) errors.push(`${p}.price deve ser número positivo ou null ("Consulte").`);
    if (v?.mileage_km !== null && v?.mileage_km !== undefined && !(Number.isInteger(v.mileage_km) && v.mileage_km >= 0)) errors.push(`${p}.mileage_km inválido.`);
    if (v?.type !== undefined && !VEHICLE_TYPES.includes(v.type)) errors.push(`${p}.type deve ser ${VEHICLE_TYPES.join("/")}.`);
    if (!FUELS.includes(v?.fuel)) errors.push(`${p}.fuel deve ser ${FUELS.join("/")}.`);
    if (!TRANSMISSIONS.includes(v?.transmission)) errors.push(`${p}.transmission deve ser ${TRANSMISSIONS.join("/")}.`);
    if (v?.availability !== undefined && !AVAILABILITY.includes(v.availability)) errors.push(`${p}.availability inválido.`);
    if (v?.photos !== undefined && (!Array.isArray(v.photos) || v.photos.some((u: unknown) => !isUrl(u)) || v.photos.length > 12)) errors.push(`${p}.photos deve ser lista (até 12) de URLs https.`);
    if (!optStr(v?.description, 800)) errors.push(`${p}.description muito longo.`);
    if (typeof v?.demo !== "boolean") errors.push(`${p}.demo é obrigatório (true se não veio do estoque real do cliente).`);
    const demo = v?.demo !== false;
    const description = String(v?.description ?? "").trim();
    return {
      id,
      type: v?.type ?? "carro",
      brand: String(v?.brand ?? "").trim(),
      model: String(v?.model ?? "").trim(),
      version: String(v?.version ?? "").trim(),
      year: Number(v?.year),
      price: typeof v?.price === "number" ? v.price : null,
      mileageKm: Number.isInteger(v?.mileage_km) ? v.mileage_km : null,
      fuel: v?.fuel,
      transmission: v?.transmission,
      color: String(v?.color ?? "").trim(),
      photos: Array.isArray(v?.photos) ? v.photos : [],
      description: demo ? `${description}${description ? " " : ""}(Veículo demonstrativo)` : description,
      equipment: Array.isArray(v?.equipment) ? v.equipment.filter((x: unknown) => typeof x === "string").slice(0, 30) : [],
      commercialNotes: "",
      availability: v?.availability ?? "disponivel",
      featured: Boolean(v?.featured),
      offer: Boolean(v?.offer),
      demo,
    } satisfies Vehicle;
  });
  return { vehicles, errors };
}

export const isMotorsProject = (sections: StudioSection[]) => sections.some((s) => s.id === "mot_featured");

/**
 * Substitui o estoque do Template 06: remove as seções `mot_vehicle_*` e insere
 * as novas logo após "mot_featured", no mesmo formato do template.
 */
export function applyVehicles(sections: StudioSection[], vehicles: Vehicle[], whatsapp?: string): StudioSection[] {
  if (!isMotorsProject(sections)) throw new Error("O projeto não usa o modelo ScaleNexus Motors (seção de destaques não encontrada).");
  const content = { ...MOTORS_DEFAULT_CONTENT, store: { ...MOTORS_DEFAULT_CONTENT.store, whatsapp: whatsapp || MOTORS_DEFAULT_CONTENT.store.whatsapp }, vehicles };
  const generated = motorsToStudioData(content).sections.filter((s) => s.id.startsWith("mot_vehicle_"));
  const rest = sections.filter((s) => !s.id.startsWith("mot_vehicle_"));
  const at = rest.findIndex((s) => s.id === "mot_featured") + 1;
  return [...rest.slice(0, at), ...generated, ...rest.slice(at)].map((s, i) => ({ ...s, order: i }));
}
