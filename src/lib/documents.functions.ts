import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  DOCUMENTS_BUCKET,
  MAX_FILE_BYTES,
  findAllowedType,
  validateDocumentMetadata,
} from "@/lib/documents/constants";

/**
 * Núcleo de documentos (ATA #019).
 * Toda a validação acontece no servidor; as permissões vêm das políticas
 * do banco através do cliente autenticado do utilizador (RLS).
 */

type AnyClient = any;

async function logEvent(
  supabase: AnyClient,
  payload: {
    projectId: string;
    documentId?: string | null;
    actorId: string;
    event: "upload" | "processamento" | "download" | "exclusao" | "erro";
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

/** Projetos que o utilizador autenticado pode usar como destino de documentos. */
export const listDocumentProjects = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const supabase = context.supabase as AnyClient;
    const { data, error } = await supabase
      .from("projects")
      .select("id,title,status")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return { projects: (data ?? []) as { id: string; title: string; status: string }[] };
  });

/** Lista documentos de um projeto autorizado. */
export const listProjectDocuments = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ projectId: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    const supabase = context.supabase as AnyClient;
    const { data: rows, error } = await supabase
      .from("project_documents")
      .select(
        "id,project_id,name,original_name,category,size_bytes,mime_type,extension,status,extraction_status,error_message,version,created_at,processed_at",
      )
      .eq("project_id", data.projectId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return { documents: rows ?? [] };
  });

/**
 * Valida os metadados no servidor, cria o registo em estado "enviando"
 * e devolve uma URL assinada de envio para o caminho correto do projeto.
 */
export const createDocumentUpload = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z
      .object({
        projectId: z.string().uuid(),
        name: z.string().min(1).max(180),
        size: z.number().int().positive(),
        mimeType: z.string().max(180).optional().nullable(),
        checksum: z.string().regex(/^[a-f0-9]{64}$/i).optional().nullable(),
        category: z.string().max(60).optional(),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    const supabase = context.supabase as AnyClient;
    const actorId = context.userId as string;
    if (!actorId) throw new Error("Não autorizado.");

    const validation = validateDocumentMetadata({
      name: data.name,
      size: data.size,
      mimeType: data.mimeType,
    });
    if (!validation.ok) return { ok: false as const, error: validation.error };

    // Projeto de destino precisa ser visível para este utilizador (RLS).
    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select("id")
      .eq("id", data.projectId)
      .maybeSingle();
    if (projectError) return { ok: false as const, error: projectError.message };
    if (!project) return { ok: false as const, error: "Projeto não encontrado ou sem permissão." };

    // Duplicidade por conteúdo dentro do mesmo projeto.
    if (data.checksum) {
      const { data: existing } = await supabase
        .from("project_documents")
        .select("id,name")
        .eq("project_id", data.projectId)
        .eq("checksum", data.checksum.toLowerCase())
        .maybeSingle();
      if (existing) {
        return {
          ok: false as const,
          error: `Este arquivo já existe neste projeto como "${existing.name}". Nada foi substituído.`,
          duplicateOf: existing.id as string,
        };
      }
    }

    const allowed = findAllowedType(validation.extension)!;
    const objectPath = `${data.projectId}/${crypto.randomUUID()}-${validation.safeName}`;

    const { data: inserted, error: insertError } = await supabase
      .from("project_documents")
      .insert({
        project_id: data.projectId,
        name: validation.safeName,
        original_name: data.name,
        safe_name: validation.safeName,
        file_path: objectPath,
        category: data.category?.trim() || "Documento",
        size_bytes: data.size,
        mime_type: (data.mimeType ?? allowed.mimes[0]) as string,
        extension: validation.extension,
        checksum: data.checksum ? data.checksum.toLowerCase() : null,
        status: "enviando",
        extraction_status: allowed.textLike ? "pendente" : "nao_suportado",
        uploaded_by: actorId,
      } as never)
      .select("id")
      .single();
    if (insertError || !inserted) {
      return { ok: false as const, error: insertError?.message ?? "Não foi possível registar o documento." };
    }

    const signed = await supabase.storage.from(DOCUMENTS_BUCKET).createSignedUploadUrl(objectPath);
    if (signed.error || !signed.data) {
      await supabase.from("project_documents").delete().eq("id", inserted.id);
      return { ok: false as const, error: "Sem permissão para enviar arquivos neste projeto." };
    }

    return {
      ok: true as const,
      documentId: inserted.id as string,
      signedUrl: signed.data.signedUrl as string,
      maxBytes: MAX_FILE_BYTES,
    };
  });

/**
 * Confere o objeto realmente gravado no Storage (existência, tamanho e
 * assinatura binária) e conclui o registo.
 */
export const finalizeDocumentUpload = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ documentId: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    const supabase = context.supabase as AnyClient;
    const actorId = context.userId as string;

    const { data: doc, error } = await supabase
      .from("project_documents")
      .select("id,project_id,file_path,size_bytes,extension,name")
      .eq("id", data.documentId)
      .maybeSingle();
    if (error || !doc) return { ok: false as const, error: "Documento não encontrado ou sem permissão." };

    const fail = async (message: string) => {
      await supabase
        .from("project_documents")
        .update({ status: "erro", error_message: message, updated_at: new Date().toISOString() } as never)
        .eq("id", doc.id);
      await logEvent(supabase, {
        projectId: doc.project_id,
        documentId: doc.id,
        actorId,
        event: "erro",
        detail: { stage: "finalize", message },
      });
      return { ok: false as const, error: message };
    };

    const folder = String(doc.file_path).split("/").slice(0, -1).join("/");
    const fileName = String(doc.file_path).split("/").pop()!;
    const listed = await supabase.storage.from(DOCUMENTS_BUCKET).list(folder, { search: fileName, limit: 1 });
    const object = listed.data?.find((o: { name: string }) => o.name === fileName);
    if (!object) return await fail("O arquivo não chegou ao armazenamento. Tente novamente.");

    const realSize = Number(object.metadata?.size ?? 0);
    if (realSize <= 0) return await fail("O arquivo enviado está vazio.");
    if (realSize > MAX_FILE_BYTES) {
      await supabase.storage.from(DOCUMENTS_BUCKET).remove([doc.file_path]);
      return await fail("O arquivo excede o limite de 50 MiB.");
    }

    // Verificação do tipo real pelos primeiros bytes do objeto.
    const allowed = findAllowedType(String(doc.extension ?? ""));
    if (allowed?.magic?.length) {
      const signedRead = await supabase.storage.from(DOCUMENTS_BUCKET).createSignedUrl(doc.file_path, 60);
      if (signedRead.data?.signedUrl) {
        const head = await fetch(signedRead.data.signedUrl, { headers: { Range: "bytes=0-15" } });
        const buffer = new Uint8Array(await head.arrayBuffer());
        const hex = Array.from(buffer)
          .map((b) => b.toString(16).padStart(2, "0"))
          .join("");
        const matches = allowed.magic.some((sig) => hex.startsWith(sig.toLowerCase()));
        if (!matches) {
          await supabase.storage.from(DOCUMENTS_BUCKET).remove([doc.file_path]);
          return await fail("O conteúdo do arquivo não corresponde à extensão informada.");
        }
      }
    }

    const now = new Date().toISOString();
    const { error: updateError } = await supabase
      .from("project_documents")
      .update({
        status: "pronto",
        size_bytes: realSize,
        error_message: null,
        processed_at: now,
        updated_at: now,
      } as never)
      .eq("id", doc.id);
    if (updateError) return await fail(updateError.message);

    await logEvent(supabase, {
      projectId: doc.project_id,
      documentId: doc.id,
      actorId,
      event: "upload",
      detail: { name: doc.name, size: realSize },
    });
    return { ok: true as const, size: realSize };
  });

/** Marca falha de envio ocorrida no navegador e limpa objeto parcial. */
export const failDocumentUpload = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z.object({ documentId: z.string().uuid(), message: z.string().max(300) }).parse(data),
  )
  .handler(async ({ data, context }) => {
    const supabase = context.supabase as AnyClient;
    const actorId = context.userId as string;
    const { data: doc } = await supabase
      .from("project_documents")
      .select("id,project_id,file_path")
      .eq("id", data.documentId)
      .maybeSingle();
    if (!doc) return { ok: false as const };
    await supabase.storage.from(DOCUMENTS_BUCKET).remove([doc.file_path]);
    await supabase
      .from("project_documents")
      .update({ status: "erro", error_message: data.message, updated_at: new Date().toISOString() } as never)
      .eq("id", doc.id);
    await logEvent(supabase, {
      projectId: doc.project_id,
      documentId: doc.id,
      actorId,
      event: "erro",
      detail: { stage: "upload", message: data.message },
    });
    return { ok: true as const };
  });

/** Link temporário de download (60 s), registado na auditoria. */
export const getDocumentDownloadUrl = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ documentId: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    const supabase = context.supabase as AnyClient;
    const actorId = context.userId as string;
    const { data: doc } = await supabase
      .from("project_documents")
      .select("id,project_id,file_path,name,status")
      .eq("id", data.documentId)
      .maybeSingle();
    if (!doc) return { ok: false as const, error: "Documento não encontrado ou sem permissão." };
    if (doc.status !== "pronto") return { ok: false as const, error: "Documento ainda não está disponível." };

    const signed = await supabase.storage
      .from(DOCUMENTS_BUCKET)
      .createSignedUrl(doc.file_path, 60, { download: doc.name });
    if (signed.error || !signed.data) return { ok: false as const, error: "Não foi possível gerar o link." };

    await logEvent(supabase, {
      projectId: doc.project_id,
      documentId: doc.id,
      actorId,
      event: "download",
      detail: { name: doc.name },
    });
    return { ok: true as const, url: signed.data.signedUrl as string };
  });

/** Exclui documento mantendo banco e Storage consistentes. */
export const deleteProjectDocument = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ documentId: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    const supabase = context.supabase as AnyClient;
    const actorId = context.userId as string;
    const { data: doc } = await supabase
      .from("project_documents")
      .select("id,project_id,file_path,name")
      .eq("id", data.documentId)
      .maybeSingle();
    if (!doc) return { ok: false as const, error: "Documento não encontrado ou sem permissão." };

    const removal = await supabase.storage.from(DOCUMENTS_BUCKET).remove([doc.file_path]);
    if (removal.error) return { ok: false as const, error: "Sem permissão para excluir este arquivo." };

    await logEvent(supabase, {
      projectId: doc.project_id,
      documentId: doc.id,
      actorId,
      event: "exclusao",
      detail: { name: doc.name },
    });

    const { error: deleteError } = await supabase.from("project_documents").delete().eq("id", doc.id);
    if (deleteError) return { ok: false as const, error: "Arquivo removido, mas o registo não pôde ser excluído." };
    return { ok: true as const };
  });
