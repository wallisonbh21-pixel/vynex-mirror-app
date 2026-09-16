/** Núcleo de documentos (ATA #019) — regras compartilhadas entre interface e servidor. */

export const DOCUMENTS_BUCKET = "project-documents";

/** Limite por arquivo alinhado com o bucket do Storage (50 MiB). */
export const MAX_FILE_BYTES = 52_428_800;

export type DocumentStatus = "enviando" | "processando" | "pronto" | "erro";
export type ExtractionStatus = "pendente" | "nao_suportado" | "concluido" | "erro";

type AllowedType = {
  ext: string;
  mimes: string[];
  /** Assinatura binária esperada (magic bytes) em hex, quando aplicável. */
  magic?: string[];
  /** Conteúdo já legível como texto simples pela NexusBuild AI. */
  textLike: boolean;
};

export const ALLOWED_TYPES: AllowedType[] = [
  { ext: "pdf", mimes: ["application/pdf"], magic: ["25504446"], textLike: false },
  {
    ext: "docx",
    mimes: ["application/vnd.openxmlformats-officedocument.wordprocessingml.document"],
    magic: ["504b0304", "504b0506", "504b0708"],
    textLike: false,
  },
  {
    ext: "xlsx",
    mimes: ["application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"],
    magic: ["504b0304", "504b0506", "504b0708"],
    textLike: false,
  },
  {
    ext: "pptx",
    mimes: ["application/vnd.openxmlformats-officedocument.presentationml.presentation"],
    magic: ["504b0304", "504b0506", "504b0708"],
    textLike: false,
  },
  { ext: "txt", mimes: ["text/plain"], textLike: true },
  { ext: "md", mimes: ["text/markdown", "text/plain"], textLike: true },
  { ext: "csv", mimes: ["text/csv", "text/plain", "application/csv"], textLike: true },
  { ext: "json", mimes: ["application/json", "text/plain"], textLike: true },
  { ext: "png", mimes: ["image/png"], magic: ["89504e47"], textLike: false },
  { ext: "jpg", mimes: ["image/jpeg"], magic: ["ffd8ff"], textLike: false },
  { ext: "jpeg", mimes: ["image/jpeg"], magic: ["ffd8ff"], textLike: false },
  { ext: "webp", mimes: ["image/webp"], magic: ["52494646"], textLike: false },
];

export const ACCEPT_ATTRIBUTE = ALLOWED_TYPES.map((t) => `.${t.ext}`).join(",");

export const ALLOWED_EXTENSIONS = ALLOWED_TYPES.map((t) => t.ext);

export function findAllowedType(extension: string): AllowedType | undefined {
  return ALLOWED_TYPES.find((t) => t.ext === extension.toLowerCase());
}

export function fileExtension(name: string): string {
  const parts = name.toLowerCase().split(".");
  return parts.length > 1 ? parts[parts.length - 1]! : "";
}

/** Nome seguro: sem caminhos, acentos ou caracteres especiais. */
export function safeFileName(name: string): string {
  const ext = fileExtension(name);
  const base = name
    .slice(0, ext ? name.length - ext.length - 1 : name.length)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9-_ ]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 80);
  const safeBase = base.length > 0 ? base : "documento";
  return ext ? `${safeBase}.${ext}` : safeBase;
}

export function formatBytes(bytes?: number | null): string {
  if (!bytes || bytes <= 0) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

export type DocumentValidationResult =
  | { ok: true; extension: string; safeName: string; textLike: boolean }
  | { ok: false; error: string };

/** Validação determinística usada no navegador E no servidor. */
export function validateDocumentMetadata(input: {
  name: string;
  size: number;
  mimeType?: string | null | undefined;
}): DocumentValidationResult {
  const name = (input.name ?? "").trim();
  if (!name || name.length > 180) {
    return { ok: false, error: "Nome de arquivo inválido." };
  }
  if (/[\\/]|\.\./.test(name)) {
    return { ok: false, error: "Nome de arquivo com caracteres não permitidos." };
  }
  if (!Number.isFinite(input.size) || input.size <= 0) {
    return { ok: false, error: "Arquivo vazio ou tamanho inválido." };
  }
  if (input.size > MAX_FILE_BYTES) {
    return { ok: false, error: `Arquivo maior que o limite de ${formatBytes(MAX_FILE_BYTES)}.` };
  }
  const extension = fileExtension(name);
  const allowed = findAllowedType(extension);
  if (!allowed) {
    return {
      ok: false,
      error: `Formato .${extension || "?"} não permitido. Aceitos: ${ALLOWED_EXTENSIONS.join(", ")}.`,
    };
  }
  const mime = (input.mimeType ?? "").toLowerCase().split(";")[0]!.trim();
  if (mime && !allowed.mimes.includes(mime) && mime !== "application/octet-stream") {
    return { ok: false, error: `O tipo informado (${mime}) não corresponde à extensão .${extension}.` };
  }
  return { ok: true, extension, safeName: safeFileName(name), textLike: allowed.textLike };
}
