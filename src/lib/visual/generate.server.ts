/**
 * Geração visual da NEXUSBUILD AI (ATA #020).
 *
 * Fluxo: validação server-side → limites → serviço de imagem (gateway Lovable)
 * → Storage privado do projeto (bucket da ATA #019) → registro de documento,
 * asset visual, versão e evento de auditoria.
 *
 * A chave do serviço nunca sai do servidor; o navegador só recebe links
 * temporários assinados.
 */
import { DOCUMENTS_BUCKET } from "@/lib/documents/constants";
import {
  ASPECT_HINT,
  VISUAL_LIMITS,
  VISUAL_MODEL,
  VISUAL_PROVIDER,
  purposeLabel,
} from "@/lib/visual/constants";

type AnyClient = any;

const GATEWAY_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";

export interface VisualGenerationInput {
  projectId: string;
  prompt: string;
  purpose: string;
  aspect?: string;
  count?: number;
  conversationId?: string | null;
  referenceAssetId?: string | null;
  parentAssetId?: string | null;
  context?: string | null;
}

export interface GeneratedVisualAsset {
  id: string;
  title: string;
  purpose: string;
  version: number;
  status: string;
  kind: string;
  parent_asset_id: string | null;
  project_id: string;
  created_at: string;
}

function dataUrlToBytes(dataUrl: string): { bytes: Uint8Array; mime: string } | null {
  const match = /^data:(image\/[a-z+]+);base64,(.+)$/i.exec(dataUrl.trim());
  if (!match) return null;
  const binary = atob(match[2]!);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return { bytes, mime: match[1]!.toLowerCase() };
}

async function sha256Hex(bytes: Uint8Array): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", bytes as unknown as ArrayBuffer);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function logEvent(
  supabase: AnyClient,
  payload: {
    projectId: string;
    documentId?: string | null;
    actorId: string;
    event: "geracao" | "visualizacao" | "aprovacao" | "nova_versao" | "alteracao" | "erro" | "exclusao";
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

/** Verifica os limites de uso antes de chamar o serviço externo. */
async function checkLimits(supabase: AnyClient, userId: string, projectId: string, count: number) {
  if (count > VISUAL_LIMITS.perRequest) {
    return `Máximo de ${VISUAL_LIMITS.perRequest} imagens por solicitação.`;
  }
  const since = new Date(Date.now() - 86_400_000).toISOString();
  const [{ count: dayCount }, { count: projectCount }] = await Promise.all([
    supabase
      .from("project_visual_generations")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .gte("created_at", since),
    supabase
      .from("project_visual_assets")
      .select("id", { count: "exact", head: true })
      .eq("project_id", projectId)
      .eq("kind", "gerada"),
  ]);
  if ((dayCount ?? 0) >= VISUAL_LIMITS.perUserPerDay) {
    return `Limite de ${VISUAL_LIMITS.perUserPerDay} gerações nas últimas 24 horas atingido.`;
  }
  if ((projectCount ?? 0) + count > VISUAL_LIMITS.perProjectTotal) {
    return `Este projeto atingiu o limite de ${VISUAL_LIMITS.perProjectTotal} imagens geradas.`;
  }
  return null;
}

/** Monta a instrução final enviada ao serviço visual. */
function buildPrompt(input: VisualGenerationInput, referenceNote: boolean) {
  const lines = [
    `Crie uma imagem original de alta qualidade para: ${purposeLabel(input.purpose)}.`,
    `Descrição: ${input.prompt}`,
    `Proporção desejada: ${ASPECT_HINT[input.aspect ?? "1:1"] ?? "formato quadrado (1:1)"}.`,
  ];
  if (input.context) lines.push(`Contexto do projeto: ${input.context}`);
  if (referenceNote) {
    lines.push(
      "Use a imagem anexada apenas como REFERÊNCIA de estilo e direção visual. Não copie marcas, logotipos ou identidade de terceiros.",
    );
  }
  lines.push(
    "Produza uma composição original, sem marcas registradas de terceiros e sem texto ilegível ou inventado.",
  );
  return lines.join("\n");
}

async function referenceDataUrl(supabase: AnyClient, assetId: string, projectId: string) {
  const { data: ref } = await supabase
    .from("project_visual_assets")
    .select("id,file_path,mime_type,project_id")
    .eq("id", assetId)
    .maybeSingle();
  if (!ref || ref.project_id !== projectId) return null;
  const file = await supabase.storage.from(DOCUMENTS_BUCKET).download(ref.file_path);
  if (file.error || !file.data) return null;
  const buffer = new Uint8Array(await file.data.arrayBuffer());
  let binary = "";
  for (const byte of buffer) binary += String.fromCharCode(byte);
  return `data:${ref.mime_type || "image/png"};base64,${btoa(binary)}`;
}

/** Executa a geração completa com o cliente autenticado do usuário (RLS aplicada). */
export async function generateProjectVisual(
  supabase: AnyClient,
  userId: string,
  input: VisualGenerationInput,
): Promise<
  | { ok: true; generationId: string; assets: GeneratedVisualAsset[] }
  | { ok: false; error: string; generationId?: string }
> {
  const prompt = String(input.prompt ?? "").trim().slice(0, VISUAL_LIMITS.maxPromptChars);
  if (prompt.length < 8) return { ok: false, error: "Descreva a imagem desejada com mais detalhes." };

  const count = Math.min(Math.max(Number(input.count) || 1, 1), VISUAL_LIMITS.perRequest);
  const purpose = String(input.purpose ?? "imagem_site");
  const aspect = String(input.aspect ?? "1:1");

  const { data: project } = await supabase
    .from("projects")
    .select("id,title,description")
    .eq("id", input.projectId)
    .maybeSingle();
  if (!project) return { ok: false, error: "Projeto não encontrado ou sem permissão." };

  const limitError = await checkLimits(supabase, userId, input.projectId, count);
  if (limitError) return { ok: false, error: limitError };

  const apiKey = process.env["LOVABLE_API_KEY"];
  if (!apiKey) return { ok: false, error: "O serviço de geração de imagens não está configurado neste ambiente." };

  const { data: generation, error: genError } = await supabase
    .from("project_visual_generations")
    .insert({
      project_id: input.projectId,
      user_id: userId,
      conversation_id: input.conversationId ?? null,
      prompt,
      purpose,
      aspect_ratio: aspect,
      model: VISUAL_MODEL,
      provider: VISUAL_PROVIDER,
      requested_count: count,
      status: "generating",
      reference_asset_id: input.referenceAssetId ?? null,
      parent_asset_id: input.parentAssetId ?? null,
    } as never)
    .select("id")
    .single();
  if (genError || !generation) {
    return { ok: false, error: "Não foi possível registrar a solicitação de imagem." };
  }
  const generationId = generation.id as string;

  const failGeneration = async (message: string) => {
    await supabase
      .from("project_visual_generations")
      .update({ status: "failed", error_message: message.slice(0, 400), updated_at: new Date().toISOString() } as never)
      .eq("id", generationId);
    await logEvent(supabase, {
      projectId: input.projectId,
      actorId: userId,
      event: "erro",
      detail: { stage: "geracao_visual", message: message.slice(0, 300), generation_id: generationId },
    });
    return { ok: false as const, error: message, generationId };
  };

  let reference: string | null = null;
  if (input.referenceAssetId) {
    reference = await referenceDataUrl(supabase, input.referenceAssetId, input.projectId);
    if (!reference) return await failGeneration("A imagem de referência informada não é válida para este projeto.");
  }

  const instruction = buildPrompt({ ...input, prompt, purpose, aspect }, Boolean(reference));
  const content: unknown = reference
    ? [
        { type: "text", text: instruction },
        { type: "image_url", image_url: { url: reference } },
      ]
    : instruction;

  const assets: GeneratedVisualAsset[] = [];
  const baseVersion = input.parentAssetId
    ? ((
        await supabase
          .from("project_visual_assets")
          .select("version")
          .eq("id", input.parentAssetId)
          .maybeSingle()
      ).data?.version ?? 1)
    : 0;

  for (let i = 0; i < count; i += 1) {
    let response: Response;
    try {
      response = await fetch(GATEWAY_URL, {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: VISUAL_MODEL,
          messages: [{ role: "user", content }],
          modalities: ["image", "text"],
        }),
      });
    } catch {
      if (assets.length === 0) return await failGeneration("Não foi possível falar com o serviço de imagens.");
      break;
    }

    if (!response.ok) {
      const message =
        response.status === 429
          ? "Limite de uso da IA atingido. Tente novamente em instantes."
          : response.status === 402
            ? "Créditos de IA esgotados no espaço de trabalho."
            : "O serviço de imagens não conseguiu gerar a imagem agora.";
      if (assets.length === 0) return await failGeneration(message);
      break;
    }

    const payload = (await response.json()) as any;
    const imageUrl: string | undefined = payload?.choices?.[0]?.message?.images?.[0]?.image_url?.url;
    const decoded = imageUrl ? dataUrlToBytes(imageUrl) : null;
    if (!decoded) {
      if (assets.length === 0) return await failGeneration("O serviço não devolveu nenhuma imagem utilizável.");
      break;
    }

    const extension = decoded.mime === "image/jpeg" ? "jpg" : decoded.mime === "image/webp" ? "webp" : "png";
    const version = baseVersion + 1 + i;
    const safeTitle = `${purpose}-v${version}`;
    const fileName = `${crypto.randomUUID()}-${safeTitle}.${extension}`;
    const objectPath = `${input.projectId}/visual/${fileName}`;

    const upload = await supabase.storage
      .from(DOCUMENTS_BUCKET)
      .upload(objectPath, decoded.bytes, { contentType: decoded.mime, upsert: false });
    if (upload.error) {
      if (assets.length === 0) return await failGeneration("Não foi possível guardar a imagem no armazenamento.");
      break;
    }

    const checksum = await sha256Hex(decoded.bytes);
    const { data: doc, error: docError } = await supabase
      .from("project_documents")
      .insert({
        project_id: input.projectId,
        name: `${safeTitle}.${extension}`,
        original_name: `${safeTitle}.${extension}`,
        safe_name: `${safeTitle}.${extension}`,
        file_path: objectPath,
        category: purposeLabel(purpose),
        size_bytes: decoded.bytes.byteLength,
        mime_type: decoded.mime,
        extension,
        checksum,
        status: "pronto",
        extraction_status: "nao_suportado",
        uploaded_by: userId,
        processed_at: new Date().toISOString(),
        version,
      } as never)
      .select("id")
      .single();
    if (docError || !doc) {
      await supabase.storage.from(DOCUMENTS_BUCKET).remove([objectPath]);
      if (assets.length === 0) return await failGeneration("Não foi possível registrar a imagem gerada.");
      break;
    }

    const { data: asset, error: assetError } = await supabase
      .from("project_visual_assets")
      .insert({
        project_id: input.projectId,
        document_id: doc.id,
        generation_id: generationId,
        parent_asset_id: input.parentAssetId ?? null,
        conversation_id: input.conversationId ?? null,
        created_by: userId,
        kind: "gerada",
        purpose,
        title: `${purposeLabel(purpose)} v${version}`,
        prompt,
        origin: "nexusbuild",
        version,
        status: "gerada",
        file_path: objectPath,
        mime_type: decoded.mime,
        size_bytes: decoded.bytes.byteLength,
      } as never)
      .select("id,title,purpose,version,status,kind,parent_asset_id,project_id,created_at")
      .single();
    if (assetError || !asset) {
      await supabase.storage.from(DOCUMENTS_BUCKET).remove([objectPath]);
      await supabase.from("project_documents").delete().eq("id", doc.id);
      if (assets.length === 0) return await failGeneration("Não foi possível registrar a imagem na Central Visual.");
      break;
    }

    assets.push(asset as GeneratedVisualAsset);
    await logEvent(supabase, {
      projectId: input.projectId,
      documentId: doc.id,
      actorId: userId,
      event: input.parentAssetId ? "nova_versao" : "geracao",
      detail: { generation_id: generationId, purpose, version, asset_id: asset.id },
    });
  }

  await supabase
    .from("project_visual_generations")
    .update({
      status: assets.length > 0 ? "ready" : "failed",
      generated_count: assets.length,
      updated_at: new Date().toISOString(),
    } as never)
    .eq("id", generationId);

  if (assets.length === 0) return { ok: false, error: "Nenhuma imagem foi gerada.", generationId };
  return { ok: true, generationId, assets };
}
