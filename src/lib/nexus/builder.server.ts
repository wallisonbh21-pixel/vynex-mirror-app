/**
 * NEXUSBUILD AI — executor das operações de construção.
 *
 * Só roda no servidor, sempre com o cliente Supabase do próprio usuário
 * (RLS aplicada). Executa apenas operações já aprovadas pelo validador.
 *
 * Nada aqui simula construção: se uma operação não puder ser aplicada,
 * ela é reportada como falha, com motivo.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import { SECTION_TEMPLATES } from "@/lib/studio/templates";
import type { StudioDesignSystem, StudioSection } from "@/types/studio";
import type { NexusBuildOperation } from "./build-plan";
import { findEnglishWords } from "./core/language";

const DEFAULT_DESIGN_SYSTEM: StudioDesignSystem = {
  colors: {
    primary: "#3B82F6",
    secondary: "#1E293B",
    accent: "#10B981",
    background: "#FFFFFF",
    surface: "#F8FAFC",
    border: "#E2E8F0",
    text: "#0F172A",
    textSecondary: "#64748B",
  },
  typography: { headingFont: "Inter", bodyFont: "Inter", headingWeight: "700", bodyWeight: "400" },
  buttons: { style: "solid", borderRadius: "0.5rem", shadow: "sm", size: "md" },
  cards: { borderRadius: "0.75rem", shadow: "sm", border: true },
};

const newId = () => Math.random().toString(36).slice(2, 11);

function applyTexts(section: StudioSection, texts?: Record<string, string>) {
  if (!texts) return;
  const map: Record<string, string[]> = {
    title: ["title"],
    subtitle: ["subtitle", "title"],
    paragraph: ["paragraph"],
    button: ["button"],
  };
  for (const [field, value] of Object.entries(texts)) {
    const candidates = map[field] ?? [];
    const target = section.elements.find((el) => candidates.includes(el.type));
    if (target) target.content = { ...(target.content ?? {}), text: value };
  }
}

export interface StudioSnapshotState {
  sections: StudioSection[];
  designSystem: StudioDesignSystem;
  exists: boolean;
}

export async function loadStudioState(
  supabase: SupabaseClient<any, any, any>,
  projectId: string,
): Promise<StudioSnapshotState> {
  const { data, error } = await supabase
    .from("project_studio_data")
    .select("sections,design_system")
    .eq("project_id", projectId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return {
    sections: ((data?.sections as unknown as StudioSection[]) ?? []).slice(),
    designSystem: (data?.design_system as unknown as StudioDesignSystem) ?? DEFAULT_DESIGN_SYSTEM,
    exists: Boolean(data),
  };
}

export interface ExecutionEntry {
  type: string;
  status: "APLICADA" | "FALHOU";
  detail: string;
}

export interface ExecutionReport {
  applied: number;
  failed: number;
  entries: ExecutionEntry[];
  sections: { id: string; type: string; order: number }[];
  language_warnings?: string[];
  post_validation: { ok: boolean; problems: string[] };
}

export async function executeBuildOperations(
  supabase: SupabaseClient<any, any, any>,
  projectId: string,
  operations: NexusBuildOperation[],
): Promise<ExecutionReport> {
  const state = await loadStudioState(supabase, projectId);
  const entries: ExecutionEntry[] = [];
  let sections = state.sections;
  let designSystem = state.designSystem;

  for (const op of operations) {
    try {
      switch (op.type) {
        case "ADD_SECTION": {
          const template = SECTION_TEMPLATES[op.params.template];
          const structure = JSON.parse(JSON.stringify((template as any).structure)) as StudioSection;
          structure.id = newId();
          structure.elements = (structure.elements ?? []).map((el) => ({ ...el, id: newId() }));
          applyTexts(structure, op.params.texts);
          if (op.params.styles && typeof op.params.styles === "object") {
            structure.styles = { ...(structure.styles ?? {}), ...op.params.styles };
          }
          const position = Number.isInteger(op.params.position)
            ? Math.min(Math.max(0, op.params.position), sections.length)
            : sections.length;
          sections.splice(position, 0, structure);
          entries.push({ type: op.type, status: "APLICADA", detail: `Seção "${(template as any).name}" inserida na posição ${position + 1}.` });
          break;
        }
        case "UPDATE_SECTION": {
          const section = sections.find((s) => s.id === op.params.section_id);
          if (!section) throw new Error("Seção não encontrada no projeto.");
          applyTexts(section, op.params.texts);
          if (op.params.styles) section.styles = { ...(section.styles ?? {}), ...op.params.styles };
          entries.push({ type: op.type, status: "APLICADA", detail: `Seção ${section.id} atualizada.` });
          break;
        }
        case "REORDER_SECTIONS": {
          const ids: string[] = op.params.section_ids;
          const known = new Set(sections.map((s) => s.id));
          const missing = ids.filter((id) => !known.has(id));
          if (missing.length > 0) throw new Error(`Seções inexistentes: ${missing.join(", ")}.`);
          const ordered = ids.map((id) => sections.find((s) => s.id === id)!);
          const rest = sections.filter((s) => !ids.includes(s.id));
          sections = [...ordered, ...rest];
          entries.push({ type: op.type, status: "APLICADA", detail: "Ordem das seções atualizada." });
          break;
        }
        case "UPDATE_DESIGN_SYSTEM": {
          designSystem = {
            ...designSystem,
            colors: { ...designSystem.colors, ...(op.params.colors ?? {}) },
            typography: { ...designSystem.typography, ...(op.params.typography ?? {}) },
            buttons: { ...designSystem.buttons, ...(op.params.buttons ?? {}) },
            cards: { ...designSystem.cards, ...(op.params.cards ?? {}) },
          };
          entries.push({ type: op.type, status: "APLICADA", detail: "Sistema visual atualizado." });
          break;
        }
        case "REMOVE_SECTION": {
          const before = sections.length;
          sections = sections.filter((s) => s.id !== op.params.section_id);
          if (sections.length === before) throw new Error("Seção não encontrada no projeto.");
          entries.push({ type: op.type, status: "APLICADA", detail: `Seção ${op.params.section_id} removida.` });
          break;
        }
        default:
          throw new Error("Operação não suportada pelo executor.");
      }
    } catch (error) {
      entries.push({
        type: op.type,
        status: "FALHOU",
        detail: error instanceof Error ? error.message : "Falha desconhecida.",
      });
    }
  }

  const applied = entries.filter((e) => e.status === "APLICADA").length;

  if (applied > 0) {
    sections = sections.map((section, index) => ({ ...section, order: index }));
    const payload = {
      project_id: projectId,
      sections: sections as unknown as any,
      design_system: designSystem as unknown as any,
      last_saved_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    const { error } = state.exists
      ? await supabase.from("project_studio_data").update(payload as never).eq("project_id", projectId)
      : await supabase.from("project_studio_data").insert(payload as never);
    if (error) throw new Error(`Falha ao salvar a construção: ${error.message}`);
  }

  // Validação pós-execução: relê o estado realmente gravado.
  const after = await loadStudioState(supabase, projectId);
  const problems: string[] = [];
  if (applied > 0 && after.sections.length !== sections.length) {
    problems.push("A quantidade de seções gravadas não confere com a esperada.");
  }
  if (after.sections.some((s) => !s.id || !s.type)) problems.push("Existe seção gravada sem identificador ou tipo.");
  const duplicated = new Set<string>();
  for (const s of after.sections) {
    if (duplicated.has(s.id)) problems.push(`Identificador de seção duplicado: ${s.id}.`);
    duplicated.add(s.id);
  }

  // Verificação de idioma (pt-BR): sinaliza possíveis textos em inglês visíveis.
  const language_warnings: string[] = [];
  for (const s of after.sections) {
    for (const el of s.elements ?? []) {
      const text = (el.content as any)?.text;
      if (typeof text !== "string") continue;
      const hits = findEnglishWords(text);
      if (hits.length) language_warnings.push(`Seção ${s.id}: possível texto em inglês ("${text.slice(0, 60)}") — revisar.`);
    }
  }

  return {
    applied,
    language_warnings,
    failed: entries.length - applied,
    entries,
    sections: after.sections.map((s) => ({ id: s.id, type: s.type, order: s.order })),
    post_validation: { ok: problems.length === 0, problems },
  };
}
