/**
 * NEXUSBUILD CORE — resolução do contexto ativo no servidor.
 *
 * Busca apenas o essencial (projeto ativo + imagens recentes da conversa),
 * sempre com o cliente Supabase do próprio usuário (RLS aplicada).
 * Nunca amplia permissões: se o usuário não puder ver o projeto, ele não entra no contexto.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import type { ActiveVisualContext, NexusActiveContext } from "./context";

const VISUAL_CONTEXT_LIMIT = 6;

/** Descobre o projeto ativo: o gravado no contexto da conversa ou o último usado nela. */
export async function resolveActiveProjectId(
  supabase: SupabaseClient<any, any, any>,
  conversationId: string,
  conversationContext: Record<string, unknown> | null,
): Promise<string | null> {
  const fromContext = conversationContext?.["project_id"];
  if (typeof fromContext === "string" && fromContext.length > 0) return fromContext;

  const { data } = await supabase
    .from("nexusbuild_build_operations")
    .select("project_id")
    .eq("conversation_id", conversationId)
    .not("project_id", "is", null)
    .order("created_at", { ascending: false })
    .limit(1);
  const recent = (data ?? [])[0] as { project_id?: string } | undefined;
  return recent?.project_id ?? null;
}

export async function loadActiveContext(
  supabase: SupabaseClient<any, any, any>,
  conversationId: string,
  projectId: string | null,
): Promise<NexusActiveContext> {
  const visualsQuery = supabase
    .from("project_visual_assets")
    .select("id,title,purpose,kind,version,status,created_at,project_id")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: false })
    .limit(VISUAL_CONTEXT_LIMIT);

  if (!projectId) {
    const { data: visualRows } = await visualsQuery;
    return { project: null, visuals: mapVisuals(visualRows) };
  }

  const [{ data: project }, { data: briefing }, { data: plan }, { data: studio }, { count }, { data: visualRows }] =
    await Promise.all([
      supabase.from("projects").select("id,title,status,site_type").eq("id", projectId).maybeSingle(),
      supabase.from("project_briefings").select("project_id").eq("project_id", projectId).maybeSingle(),
      supabase.from("project_site_plans").select("project_id").eq("project_id", projectId).maybeSingle(),
      supabase.from("project_studio_data").select("project_id").eq("project_id", projectId).maybeSingle(),
      supabase
        .from("project_documents")
        .select("id", { count: "exact", head: true })
        .eq("project_id", projectId)
        .eq("status", "pronto"),
      visualsQuery,
    ]);

  if (!project) return { project: null, visuals: mapVisuals(visualRows) };

  const row = project as { id: string; title: string; status?: string | null; site_type?: string | null };
  return {
    project: {
      id: row.id,
      title: row.title,
      status: row.status ?? null,
      siteType: row.site_type ?? null,
      hasBriefing: Boolean(briefing),
      hasPlan: Boolean(plan),
      hasStudio: Boolean(studio),
      documentCount: count ?? 0,
    },
    visuals: mapVisuals(visualRows),
  };
}

/** Marca o projeto ativo da conversa, sem apagar o restante do contexto salvo. */
export async function setActiveProject(
  supabase: SupabaseClient<any, any, any>,
  conversationId: string,
  projectId: string,
): Promise<void> {
  const { data } = await supabase
    .from("nexusbuild_conversations")
    .select("context")
    .eq("id", conversationId)
    .maybeSingle();
  const current = ((data as any)?.context ?? {}) as Record<string, unknown>;
  if (current["project_id"] === projectId) return;
  await supabase
    .from("nexusbuild_conversations")
    .update({ context: { ...current, project_id: projectId } } as never)
    .eq("id", conversationId);
}

function mapVisuals(rows: unknown): ActiveVisualContext[] {
  if (!Array.isArray(rows)) return [];
  return rows.map((r: any) => ({
    id: String(r.id),
    title: r.title ?? null,
    purpose: String(r.purpose ?? "imagem"),
    kind: String(r.kind ?? "gerada"),
    version: Number(r.version ?? 1),
    status: String(r.status ?? "gerada"),
    createdAt: String(r.created_at ?? ""),
  }));
}
