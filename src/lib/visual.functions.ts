import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { DOCUMENTS_BUCKET } from "@/lib/documents/constants";
import { VISUAL_ASPECTS, VISUAL_LIMITS, VISUAL_PURPOSES } from "@/lib/visual/constants";
import { generateProjectVisual } from "@/lib/visual/generate.server";

/**
 * Central Visual (ATA #020) — funções de servidor.
 * Autenticação obrigatória; permissões vêm das políticas do banco (RLS).
 */

type AnyClient = any;

const ASSET_COLUMNS =
  "id,project_id,document_id,generation_id,parent_asset_id,conversation_id,kind,purpose,title,prompt,version,status,use_in_builder,mime_type,size_bytes,created_at,approved_at";

async function logEvent(
  supabase: AnyClient,
  payload: {
    projectId: string;
    documentId?: string | null;
    actorId: string;
    event: "visualizacao" | "aprovacao" | "alteracao" | "exclusao" | "upload" | "erro";
    detail?: Record<string, unknown>;
  },
) {
  await supabase.from("project_document_events").insert({
    project_id: payload.projectId,
    document_id: payload.documentId ?? null,
    actor_id: payload.actorId,
    event: payload.event,
    detail: payload.detail ?? {},
  } as never);
}

/** Lista as imagens (geradas e referências) de um projeto autorizado. */
export const listVisualAssets = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ projectId: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    const supabase = context.supabase as AnyClient;
    const { data: rows, error } = await supabase
      .from("project_visual_assets")
      .select(ASSET_COLUMNS)
      .eq("project_id", data.projectId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return { assets: rows ?? [] };
  });

/** Link temporário (5 min) para exibir uma imagem privada. */
export const getVisualAssetUrl = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ assetId: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    const supabase = context.supabase as AnyClient;
    const actorId = context.userId as string;
    const { data: asset } = await supabase
      .from("project_visual_assets")
      .select("id,project_id,document_id,file_path")
      .eq("id", data.assetId)
      .maybeSingle();
    if (!asset) return { ok: false as const, error: "Imagem não encontrada ou sem permissão." };

    const signed = await supabase.storage.from(DOCUMENTS_BUCKET).createSignedUrl(asset.file_path, 300);
    if (signed.error || !signed.data) return { ok: false as const, error: "Não foi possível abrir a imagem." };

    await logEvent(supabase, {
      projectId: asset.project_id,
      documentId: asset.document_id,
      actorId,
      event: "visualizacao",
      detail: { asset_id: asset.id },
    });
    return { ok: true as const, url: signed.data.signedUrl as string };
  });

/** Geração/variação de imagem pela Central Visual (mesmo caminho usado pela IA). */
export const generateVisualAsset = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z
      .object({
        projectId: z.string().uuid(),
        prompt: z.string().min(8).max(VISUAL_LIMITS.maxPromptChars),
        purpose: z.enum(VISUAL_PURPOSES).default("imagem_site"),
        aspect: z.enum(VISUAL_ASPECTS).default("1:1"),
        count: z.number().int().min(1).max(VISUAL_LIMITS.perRequest).default(1),
        conversationId: z.string().uuid().optional().nullable(),
        referenceAssetId: z.string().uuid().optional().nullable(),
        parentAssetId: z.string().uuid().optional().nullable(),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    const supabase = context.supabase as AnyClient;
    const actorId = context.userId as string;
    const result = await generateProjectVisual(supabase, actorId, {
      projectId: data.projectId,
      prompt: data.prompt,
      purpose: data.purpose,
      aspect: data.aspect,
      count: data.count,
      conversationId: data.conversationId ?? null,
      referenceAssetId: data.referenceAssetId ?? null,
      parentAssetId: data.parentAssetId ?? null,
    });
    return result;
  });

/** Aprovação, análise ou rejeição de uma imagem. */
export const setVisualAssetStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z
      .object({
        assetId: z.string().uuid(),
        status: z.enum(["gerada", "em_analise", "aprovada", "rejeitada"]),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    const supabase = context.supabase as AnyClient;
    const actorId = context.userId as string;
    const { data: asset } = await supabase
      .from("project_visual_assets")
      .select("id,project_id,document_id,status")
      .eq("id", data.assetId)
      .maybeSingle();
    if (!asset) return { ok: false as const, error: "Imagem não encontrada ou sem permissão." };

    const approved = data.status === "aprovada";
    const { error } = await supabase
      .from("project_visual_assets")
      .update({
        status: data.status,
        approved_by: approved ? actorId : null,
        approved_at: approved ? new Date().toISOString() : null,
        updated_at: new Date().toISOString(),
      } as never)
      .eq("id", asset.id);
    if (error) return { ok: false as const, error: "Não foi possível atualizar o status da imagem." };

    await logEvent(supabase, {
      projectId: asset.project_id,
      documentId: asset.document_id,
      actorId,
      event: approved ? "aprovacao" : "alteracao",
      detail: { asset_id: asset.id, from: asset.status, to: data.status },
    });
    return { ok: true as const, status: data.status };
  });

/** Marca (ou desmarca) uma imagem aprovada para uso no construtor de sites. */
export const setVisualAssetUse = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z.object({ assetId: z.string().uuid(), use: z.boolean() }).parse(data),
  )
  .handler(async ({ data, context }) => {
    const supabase = context.supabase as AnyClient;
    const actorId = context.userId as string;
    const { data: asset } = await supabase
      .from("project_visual_assets")
      .select("id,project_id,document_id,status")
      .eq("id", data.assetId)
      .maybeSingle();
    if (!asset) return { ok: false as const, error: "Imagem não encontrada ou sem permissão." };
    if (data.use && asset.status !== "aprovada") {
      return { ok: false as const, error: "Aprove a imagem antes de liberá-la para o projeto." };
    }
    const { error } = await supabase
      .from("project_visual_assets")
      .update({ use_in_builder: data.use, updated_at: new Date().toISOString() } as never)
      .eq("id", asset.id);
    if (error) return { ok: false as const, error: "Não foi possível atualizar a imagem." };

    await logEvent(supabase, {
      projectId: asset.project_id,
      documentId: asset.document_id,
      actorId,
      event: "alteracao",
      detail: { asset_id: asset.id, use_in_builder: data.use },
    });
    return { ok: true as const };
  });

/**
 * Registra como REFERÊNCIA visual um documento de imagem já enviado pelo
 * fluxo de documentos (ATA #019). Não é confundido com imagem gerada.
 */
export const registerVisualReference = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z
      .object({
        documentId: z.string().uuid(),
        conversationId: z.string().uuid().optional().nullable(),
        title: z.string().max(140).optional(),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    const supabase = context.supabase as AnyClient;
    const actorId = context.userId as string;
    const { data: doc } = await supabase
      .from("project_documents")
      .select("id,project_id,file_path,mime_type,size_bytes,original_name,status")
      .eq("id", data.documentId)
      .maybeSingle();
    if (!doc) return { ok: false as const, error: "Arquivo não encontrado ou sem permissão." };
    if (doc.status !== "pronto") return { ok: false as const, error: "O arquivo ainda não está pronto." };
    if (!String(doc.mime_type ?? "").startsWith("image/")) {
      return { ok: false as const, error: "Somente imagens podem ser usadas como referência visual." };
    }

    const { data: existing } = await supabase
      .from("project_visual_assets")
      .select("id")
      .eq("document_id", doc.id)
      .maybeSingle();
    if (existing) return { ok: true as const, assetId: existing.id as string, projectId: doc.project_id as string };

    const { data: asset, error } = await supabase
      .from("project_visual_assets")
      .insert({
        project_id: doc.project_id,
        document_id: doc.id,
        created_by: actorId,
        conversation_id: data.conversationId ?? null,
        kind: "referencia",
        purpose: "referencia",
        title: data.title?.slice(0, 140) || doc.original_name || "Referência visual",
        origin: "upload",
        version: 1,
        status: "gerada",
        file_path: doc.file_path,
        mime_type: doc.mime_type ?? "image/png",
        size_bytes: doc.size_bytes ?? null,
      } as never)
      .select("id")
      .single();
    if (error || !asset) return { ok: false as const, error: "Não foi possível registrar a referência." };

    await logEvent(supabase, {
      projectId: doc.project_id,
      documentId: doc.id,
      actorId,
      event: "upload",
      detail: { asset_id: asset.id, kind: "referencia" },
    });
    return { ok: true as const, assetId: asset.id as string, projectId: doc.project_id as string };
  });

/** Exclui uma imagem mantendo banco e Storage consistentes. */
export const deleteVisualAsset = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ assetId: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    const supabase = context.supabase as AnyClient;
    const actorId = context.userId as string;
    const { data: asset } = await supabase
      .from("project_visual_assets")
      .select("id,project_id,document_id,file_path,title")
      .eq("id", data.assetId)
      .maybeSingle();
    if (!asset) return { ok: false as const, error: "Imagem não encontrada ou sem permissão." };

    const removal = await supabase.storage.from(DOCUMENTS_BUCKET).remove([asset.file_path]);
    if (removal.error) return { ok: false as const, error: "Sem permissão para excluir esta imagem." };

    await logEvent(supabase, {
      projectId: asset.project_id,
      documentId: asset.document_id,
      actorId,
      event: "exclusao",
      detail: { asset_id: asset.id, title: asset.title },
    });

    if (asset.document_id) await supabase.from("project_documents").delete().eq("id", asset.document_id);
    await supabase.from("project_visual_assets").delete().eq("id", asset.id);
    return { ok: true as const };
  });
