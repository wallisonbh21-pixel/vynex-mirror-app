/**
 * NEXUSBUILD AI — camada intermediária entre a IA e o projeto.
 *
 * IA → BUILD PLAN → VALIDATOR → EXECUTOR → PROJETO
 *
 * O modelo NUNCA escreve SQL nem arquivos. Ele só pode emitir operações
 * estruturadas descritas aqui. O servidor valida cada operação (tipo,
 * parâmetros, limites, formato) antes de qualquer execução.
 *
 * Este arquivo é puro (sem acesso a banco) para poder ser usado no servidor
 * e em testes sem efeitos colaterais.
 */
import { NICHE_TEMPLATES, SECTION_TEMPLATES } from "@/lib/studio/templates";

/** Modelos oficiais completos que a IA pode aplicar (mesma fonte da Biblioteca Central). */
export const OFFICIAL_SITE_TEMPLATES = NICHE_TEMPLATES.filter((t) => t.metadata?.["preview_route"]);
export const findOfficialTemplate = (id: string) => OFFICIAL_SITE_TEMPLATES.find((t) => t.id === id);
export function availableSiteTemplates() {
  return OFFICIAL_SITE_TEMPLATES.map((t) => ({ template_id: t.id, name: t.name, niche: t.niche, tags: t.tags }));
}

export type NexusBuildOperationType =
  | "ADD_SECTION"
  | "UPDATE_SECTION"
  | "REORDER_SECTIONS"
  | "UPDATE_DESIGN_SYSTEM"
  | "REMOVE_SECTION"
  | "APPLY_TEMPLATE";

/** Operações previstas na arquitetura, ainda NÃO executáveis neste modelo de dados. */
export const UNSUPPORTED_OPERATIONS: Record<string, string> = {
  CREATE_PAGE: "o projeto hoje é uma página única composta por seções; múltiplas páginas ainda não são suportadas",
  UPDATE_PAGE: "múltiplas páginas ainda não são suportadas",
  ADD_NAVIGATION: "navegação entre páginas depende do suporte a múltiplas páginas",
  ADD_COMPONENT: "inserção de componentes soltos fora de uma seção ainda não é suportada",
  ADD_INTEGRATION: "integrações automáticas ainda não são suportadas",
  ADD_CHART: "gráficos ainda não estão disponíveis na biblioteca do Studio",
};

export const DESTRUCTIVE_OPERATIONS: NexusBuildOperationType[] = ["REMOVE_SECTION"];

export const MAX_OPERATIONS_PER_CALL = 20;
export const MAX_SECTIONS_PER_PROJECT = 40;
export const MAX_TEXT_LENGTH = 600;

export interface NexusBuildOperation {
  type: NexusBuildOperationType;
  params: any;
}

export interface ValidationIssue {
  index: number;
  type: string;
  message: string;
}

export interface ValidationResult {
  valid: boolean;
  operations: NexusBuildOperation[];
  issues: ValidationIssue[];
  destructive: boolean;
}

export function availableSectionTemplates() {
  return Object.entries(SECTION_TEMPLATES).map(([key, item]) => ({
    template: key,
    name: (item as any).name as string,
    category: (item as any).category as string,
  }));
}

function textsValid(texts: unknown, index: number, type: string, issues: ValidationIssue[]) {
  if (texts === undefined || texts === null) return true;
  if (typeof texts !== "object" || Array.isArray(texts)) {
    issues.push({ index, type, message: "texts deve ser um objeto com title/subtitle/paragraph/button." });
    return false;
  }
  for (const [key, value] of Object.entries(texts as Record<string, unknown>)) {
    if (!["title", "subtitle", "paragraph", "button"].includes(key)) {
      issues.push({ index, type, message: `texts.${key} não é um campo de texto suportado.` });
      return false;
    }
    if (typeof value !== "string" || value.trim().length === 0 || value.length > MAX_TEXT_LENGTH) {
      issues.push({ index, type, message: `texts.${key} deve ser um texto de 1 a ${MAX_TEXT_LENGTH} caracteres.` });
      return false;
    }
  }
  return true;
}

/**
 * Valida o plano de build antes de qualquer execução.
 * Nada é executado aqui — apenas verificação de tipo, parâmetros, limites e formato.
 */
export function validateBuildPlan(rawOperations: unknown, currentSectionCount: number): ValidationResult {
  const issues: ValidationIssue[] = [];
  const operations: NexusBuildOperation[] = [];

  if (!Array.isArray(rawOperations) || rawOperations.length === 0) {
    return { valid: false, operations: [], destructive: false, issues: [{ index: -1, type: "-", message: "Nenhuma operação foi informada." }] };
  }
  if (rawOperations.length > MAX_OPERATIONS_PER_CALL) {
    return {
      valid: false,
      operations: [],
      destructive: false,
      issues: [{ index: -1, type: "-", message: `Máximo de ${MAX_OPERATIONS_PER_CALL} operações por execução.` }],
    };
  }

  let projectedSections = currentSectionCount;
  let replacesExisting = false;

  rawOperations.forEach((raw: any, index) => {
    const type = String(raw?.type ?? "").toUpperCase();
    const params = (raw?.params ?? {}) as any;

    if (UNSUPPORTED_OPERATIONS[type]) {
      issues.push({ index, type, message: `Operação não suportada: ${UNSUPPORTED_OPERATIONS[type]}.` });
      return;
    }

    switch (type) {
      case "APPLY_TEMPLATE": {
        const tpl = findOfficialTemplate(String(params.template_id ?? ""));
        if (!tpl) {
          issues.push({ index, type, message: `Modelo "${params.template_id}" não existe. Use um de: ${OFFICIAL_SITE_TEMPLATES.map((t) => t.id).join(", ")}.` });
          return;
        }
        if (currentSectionCount > 0) replacesExisting = true;
        projectedSections = ((tpl.structure as any).sections ?? []).length;
        operations.push({ type, params: { template_id: tpl.id } });
        return;
      }
      case "ADD_SECTION": {
        const template = String(params.template ?? "");
        if (!SECTION_TEMPLATES[template]) {
          issues.push({ index, type, message: `Template "${template}" não existe na biblioteca do Studio.` });
          return;
        }
        if (projectedSections + 1 > MAX_SECTIONS_PER_PROJECT) {
          issues.push({ index, type, message: `Limite de ${MAX_SECTIONS_PER_PROJECT} seções por projeto atingido.` });
          return;
        }
        if (params.position !== undefined && (!Number.isInteger(params.position) || params.position < 0)) {
          issues.push({ index, type, message: "position deve ser um inteiro maior ou igual a zero." });
          return;
        }
        if (!textsValid(params.texts, index, type, issues)) return;
        projectedSections += 1;
        operations.push({ type, params });
        return;
      }
      case "UPDATE_SECTION": {
        if (!params.section_id || typeof params.section_id !== "string") {
          issues.push({ index, type, message: "section_id é obrigatório." });
          return;
        }
        if (!textsValid(params.texts, index, type, issues)) return;
        if (params.styles !== undefined && (typeof params.styles !== "object" || Array.isArray(params.styles))) {
          issues.push({ index, type, message: "styles deve ser um objeto de estilos CSS simples." });
          return;
        }
        operations.push({ type, params });
        return;
      }
      case "REORDER_SECTIONS": {
        if (!Array.isArray(params.section_ids) || params.section_ids.some((id: unknown) => typeof id !== "string")) {
          issues.push({ index, type, message: "section_ids deve ser uma lista de identificadores de seção." });
          return;
        }
        operations.push({ type, params });
        return;
      }
      case "UPDATE_DESIGN_SYSTEM": {
        const allowed = ["colors", "typography", "buttons", "cards"];
        const keys = Object.keys(params ?? {});
        if (keys.length === 0 || keys.some((k) => !allowed.includes(k))) {
          issues.push({ index, type, message: `Use apenas ${allowed.join(", ")}.` });
          return;
        }
        operations.push({ type, params });
        return;
      }
      case "REMOVE_SECTION": {
        if (!params.section_id || typeof params.section_id !== "string") {
          issues.push({ index, type, message: "section_id é obrigatório." });
          return;
        }
        projectedSections = Math.max(0, projectedSections - 1);
        operations.push({ type, params });
        return;
      }
      default:
        issues.push({ index, type: type || "-", message: "Tipo de operação desconhecido." });
    }
  });

  return {
    valid: issues.length === 0 && operations.length > 0,
    operations,
    issues,
    destructive: replacesExisting || operations.some((op) => DESTRUCTIVE_OPERATIONS.includes(op.type)),
  };
}

export function describeOperation(op: NexusBuildOperation): string {
  switch (op.type) {
    case "ADD_SECTION":
      return `Adicionar seção "${SECTION_TEMPLATES[op.params.template]?.name ?? op.params.template}"`;
    case "UPDATE_SECTION":
      return `Atualizar a seção ${op.params.section_id}`;
    case "REORDER_SECTIONS":
      return "Reordenar as seções do site";
    case "UPDATE_DESIGN_SYSTEM":
      return "Atualizar o sistema visual (cores, tipografia, botões, cards)";
    case "APPLY_TEMPLATE":
      return `Aplicar o modelo "${findOfficialTemplate(op.params.template_id)?.name ?? op.params.template_id}" (substitui as seções atuais)`;
    case "REMOVE_SECTION":
      return `Remover a seção ${op.params.section_id} (ação destrutiva)`;
    default:
      return op.type;
  }
}
