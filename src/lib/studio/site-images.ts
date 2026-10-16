/** Imagens dos sites (Studio + site publicado) — regras compartilhadas entre navegador e servidor. */

export const SITE_IMAGES_BUCKET = "site-images";
/** Igual ao limite configurado no armazenamento (5 MB). */
export const SITE_IMAGE_MAX_BYTES = 5 * 1024 * 1024;
export const SITE_IMAGE_ROUTE = "/api/public/site-image/";

export const SITE_IMAGE_TYPES = [
  { ext: "jpg", mime: "image/jpeg", magic: ["ffd8ff"] },
  { ext: "png", mime: "image/png", magic: ["89504e470d0a1a0a"] },
  { ext: "webp", mime: "image/webp", magic: ["52494646"] },
  { ext: "gif", mime: "image/gif", magic: ["474946383761", "474946383961"] },
] as const;

export const SITE_IMAGE_ACCEPT = "image/jpeg,image/png,image/webp,image/gif,.jpg,.jpeg,.png,.webp,.gif";

const UUID = "[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}";
export const SITE_IMAGE_PATH_RE = new RegExp(`^${UUID}/[a-f0-9]{64}\\.(jpg|png|webp|gif)$`);

export function siteImageExtForMime(mime: string): string | null {
  return SITE_IMAGE_TYPES.find((t) => t.mime === mime.toLowerCase())?.ext ?? null;
}

export function siteImageMimeForExt(ext: string): string {
  return SITE_IMAGE_TYPES.find((t) => t.ext === ext)?.mime ?? "application/octet-stream";
}

export type SiteImageCheck = { ok: true; ext: string } | { ok: false; error: string };

/** Validação rápida (nome/tipo/tamanho) usada antes do envio. */
export function validateSiteImageFile(file: { type: string; size: number }): SiteImageCheck {
  const ext = siteImageExtForMime(file.type || "");
  if (!ext) return { ok: false, error: "Formato não aceito. Envie JPG, PNG, WebP ou GIF." };
  if (!Number.isFinite(file.size) || file.size <= 0) return { ok: false, error: "Arquivo vazio." };
  if (file.size > SITE_IMAGE_MAX_BYTES) return { ok: false, error: "Imagem maior que 5 MB. Reduza o tamanho e tente de novo." };
  return { ok: true, ext };
}

/** Confere a assinatura real do arquivo (primeiros bytes). WebP também exige "WEBP" no byte 8. */
export function matchesImageSignature(bytes: Uint8Array, ext: string): boolean {
  const hex = Array.from(bytes.slice(0, 16)).map((b) => b.toString(16).padStart(2, "0")).join("");
  const type = SITE_IMAGE_TYPES.find((t) => t.ext === ext);
  if (!type) return false;
  if (!type.magic.some((m) => hex.startsWith(m))) return false;
  if (ext === "webp") return hex.slice(16, 24) === "57454250";
  return true;
}

export function siteImageUrl(path: string) {
  return `${SITE_IMAGE_ROUTE}${path}`;
}

/** Aceita http(s), imagens enviadas ao projeto e caminhos do próprio site; bloqueia javascript:, data: etc. */
export function isSafeImageUrl(url: string | null | undefined): boolean {
  if (!url || typeof url !== "string") return false;
  const u = url.trim();
  if (/["'()\\\s]/.test(u)) return false;
  if (u.startsWith(SITE_IMAGE_ROUTE)) return SITE_IMAGE_PATH_RE.test(u.slice(SITE_IMAGE_ROUTE.length));
  if (u.startsWith("/") && !u.startsWith("//")) return true;
  return /^https?:\/\//i.test(u);
}
