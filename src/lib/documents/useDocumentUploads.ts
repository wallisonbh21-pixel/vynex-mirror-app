import { useCallback, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import {
  createDocumentUpload,
  failDocumentUpload,
  finalizeDocumentUpload,
} from "@/lib/documents.functions";
import { MAX_FILE_BYTES, validateDocumentMetadata } from "@/lib/documents/constants";

export type UploadItem = {
  id: string;
  file: File;
  name: string;
  size: number;
  status: "enviando" | "processando" | "pronto" | "erro";
  progress: number;
  error?: string;
};

async function sha256(file: File): Promise<string | null> {
  try {
    const buffer = await file.arrayBuffer();
    const digest = await crypto.subtle.digest("SHA-256", buffer);
    return Array.from(new Uint8Array(digest))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  } catch {
    return null;
  }
}

function putWithProgress(url: string, file: File, onProgress: (pct: number) => void) {
  return new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", url, true);
    xhr.setRequestHeader("content-type", file.type || "application/octet-stream");
    xhr.setRequestHeader("x-upsert", "false");
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 95));
    };
    xhr.onload = () =>
      xhr.status >= 200 && xhr.status < 300
        ? resolve()
        : reject(new Error("Falha ao transferir o arquivo."));
    xhr.onerror = () => reject(new Error("Conexão interrompida durante o envio."));
    xhr.onabort = () => reject(new Error("Envio cancelado."));
    xhr.send(file);
  });
}

/** Envio de múltiplos documentos com estado e progresso individuais. */
export function useDocumentUploads(onFinished?: () => void) {
  const [items, setItems] = useState<UploadItem[]>([]);
  const filesRef = useRef(new Map<string, File>());
  const create = useServerFn(createDocumentUpload);
  const finalize = useServerFn(finalizeDocumentUpload);
  const markFailed = useServerFn(failDocumentUpload);

  const patch = useCallback((id: string, changes: Partial<UploadItem>) => {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, ...changes } : i)));
  }, []);

  const runOne = useCallback(
    async (localId: string, file: File, projectId: string, category?: string) => {
      patch(localId, { status: "enviando", progress: 0, error: undefined });

      const local = validateDocumentMetadata({ name: file.name, size: file.size, mimeType: file.type });
      if (!local.ok) {
        patch(localId, { status: "erro", error: local.error });
        return;
      }

      const checksum = await sha256(file);
      let documentId: string | null = null;
      try {
        const created = await create({
          data: { projectId, name: file.name, size: file.size, mimeType: file.type || null, checksum, category },
        });
        if (!created.ok) {
          patch(localId, { status: "erro", error: created.error });
          return;
        }
        documentId = created.documentId;
        await putWithProgress(created.signedUrl, file, (pct) => patch(localId, { progress: pct }));
        patch(localId, { status: "processando", progress: 97 });
        const done = await finalize({ data: { documentId } });
        if (!done.ok) {
          patch(localId, { status: "erro", error: done.error });
          return;
        }
        patch(localId, { status: "pronto", progress: 100 });
        onFinished?.();
      } catch (error) {
        const message = error instanceof Error ? error.message : "Falha inesperada no envio.";
        if (documentId) {
          try {
            await markFailed({ data: { documentId, message: message.slice(0, 300) } });
          } catch {
            /* o registo fica marcado como erro na próxima tentativa */
          }
        }
        patch(localId, { status: "erro", error: message });
      }
    },
    [create, finalize, markFailed, onFinished, patch],
  );

  const addFiles = useCallback(
    (files: File[], projectId: string, category?: string) => {
      const accepted = files.slice(0, 20);
      const next: UploadItem[] = accepted.map((file) => {
        const id = crypto.randomUUID();
        filesRef.current.set(id, file);
        return { id, file, name: file.name, size: file.size, status: "enviando", progress: 0 };
      });
      setItems((prev) => [...next, ...prev]);
      next.forEach((item) => void runOne(item.id, item.file, projectId, category));
    },
    [runOne],
  );

  const retry = useCallback(
    (localId: string, projectId: string, category?: string) => {
      const file = filesRef.current.get(localId);
      if (file) void runOne(localId, file, projectId, category);
    },
    [runOne],
  );

  const dismiss = useCallback((localId: string) => {
    filesRef.current.delete(localId);
    setItems((prev) => prev.filter((i) => i.id !== localId));
  }, []);

  const clearDone = useCallback(() => {
    setItems((prev) => prev.filter((i) => i.status !== "pronto"));
  }, []);

  return { items, addFiles, retry, dismiss, clearDone, maxBytes: MAX_FILE_BYTES };
}
