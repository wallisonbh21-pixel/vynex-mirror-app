import { createFileRoute } from "@tanstack/react-router";
import { publicDb } from "@/lib/public-db.server";
import { SITE_IMAGES_BUCKET, SITE_IMAGE_PATH_RE, siteImageMimeForExt } from "@/lib/studio/site-images";

/**
 * Entrega pública das imagens dos sites (Studio e sites publicados).
 * Só lê do espaço "site-images"; o nome do arquivo é o hash do conteúdo,
 * então o cache pode ser permanente.
 */
export const Route = createFileRoute("/api/public/site-image/$")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const path = (params as { _splat?: string })._splat ?? "";
        if (!SITE_IMAGE_PATH_RE.test(path)) return new Response("Not found", { status: 404 });
        const { data, error } = await publicDb().storage.from(SITE_IMAGES_BUCKET).download(path);
        if (error || !data) return new Response("Not found", { status: 404 });
        const ext = path.split(".").pop()!;
        return new Response(data, {
          headers: {
            "content-type": siteImageMimeForExt(ext),
            "cache-control": "public, max-age=31536000, immutable",
            "x-content-type-options": "nosniff",
          },
        });
      },
    },
  },
});
