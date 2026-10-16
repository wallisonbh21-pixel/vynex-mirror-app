import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  SITE_IMAGES_BUCKET,
  SITE_IMAGE_MAX_BYTES,
  SITE_IMAGE_PATH_RE,
  matchesImageSignature,
  siteImageUrl,
} from "@/lib/studio/site-images";

/**
 * Confere no servidor uma imagem recém-enviada: permissão no projeto,
 * tamanho e tipo real (assinatura do arquivo). Se não passar, apaga.
 */
export const verifySiteImage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ projectId: z.string().uuid(), path: z.string().max(200) }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const supabase = context.supabase as any;
    if (!SITE_IMAGE_PATH_RE.test(data.path) || !data.path.startsWith(`${data.projectId}/`)) {
      return { ok: false as const, error: "Endereço de imagem inválido." };
    }
    const { data: allowed } = await supabase.rpc("can_edit_project_site", { _project_id: data.projectId });
    if (!allowed) return { ok: false as const, error: "Você não tem permissão para editar este projeto." };

    const file = await supabase.storage.from(SITE_IMAGES_BUCKET).download(data.path);
    if (file.error || !file.data) return { ok: false as const, error: "A imagem não foi encontrada após o envio. Tente de novo." };
    const blob = file.data as Blob;
    const ext = data.path.split(".").pop()!;
    const head = new Uint8Array(await blob.slice(0, 16).arrayBuffer());
    if (blob.size > SITE_IMAGE_MAX_BYTES || !matchesImageSignature(head, ext)) {
      await supabase.storage.from(SITE_IMAGES_BUCKET).remove([data.path]);
      return {
        ok: false as const,
        error: blob.size > SITE_IMAGE_MAX_BYTES ? "Imagem maior que 5 MB." : "O arquivo não é uma imagem válida do formato informado.",
      };
    }
    return { ok: true as const, url: siteImageUrl(data.path) };
  });
