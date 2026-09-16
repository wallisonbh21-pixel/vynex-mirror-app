import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { ImagePlus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  createDocumentUpload,
  finalizeDocumentUpload,
  failDocumentUpload,
  listDocumentProjects,
} from "@/lib/documents.functions";
import { registerVisualReference } from "@/lib/visual.functions";
import { MAX_FILE_BYTES } from "@/lib/documents/constants";

const IMAGE_ACCEPT = ".png,.jpg,.jpeg,.webp";

async function sha256Hex(file: File) {
  const digest = await crypto.subtle.digest("SHA-256", await file.arrayBuffer());
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Envia uma imagem de referência para um projeto e a registra na Central Visual.
 * A imagem fica privada e nunca é confundida com uma imagem gerada.
 */
export function VisualReferenceDialog({
  open,
  onOpenChange,
  conversationId,
  onRegistered,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  conversationId?: string | null;
  onRegistered?: (info: { assetId: string; projectId: string; fileName: string }) => void;
}) {
  const listProjects = useServerFn(listDocumentProjects);
  const createUpload = useServerFn(createDocumentUpload);
  const finalize = useServerFn(finalizeDocumentUpload);
  const markFailed = useServerFn(failDocumentUpload);
  const register = useServerFn(registerVisualReference);

  const [projectId, setProjectId] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);

  const { data } = useQuery({
    queryKey: ["document-projects"],
    queryFn: () => listProjects(),
    enabled: open,
  });
  const projects = data?.projects ?? [];

  async function submit() {
    if (!projectId || !file) return;
    if (file.size > MAX_FILE_BYTES) {
      toast.error("A imagem ultrapassa o limite de 50 MB.");
      return;
    }
    setBusy(true);
    let documentId: string | null = null;
    try {
      const checksum = await sha256Hex(file);
      const created = await createUpload({
        data: {
          projectId,
          name: file.name,
          size: file.size,
          mimeType: file.type || null,
          checksum,
          category: "Referência",
        },
      });
      if (!created.ok) {
        toast.error(created.error);
        return;
      }
      documentId = created.documentId;

      const upload = await fetch(created.signedUrl, {
        method: "PUT",
        headers: { "content-type": file.type || "application/octet-stream" },
        body: file,
      });
      if (!upload.ok) throw new Error("upload");

      const finalized = await finalize({ data: { documentId } });
      if (!finalized.ok) {
        toast.error(finalized.error);
        return;
      }

      const registered = await register({
        data: { documentId, conversationId: conversationId ?? null, title: file.name },
      });
      if (!registered.ok) {
        toast.error(registered.error);
        return;
      }

      toast.success("Referência enviada.");
      onRegistered?.({ assetId: registered.assetId, projectId: registered.projectId, fileName: file.name });
      setFile(null);
      onOpenChange(false);
    } catch {
      if (documentId) await markFailed({ data: { documentId, error: "Falha no envio da referência." } });
      toast.error("Não foi possível enviar a imagem de referência.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Imagem de referência</DialogTitle>
          <DialogDescription>
            Envie uma imagem para orientar o estilo. Ela fica privada no projeto e serve apenas como inspiração.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label className="mb-1.5 block text-xs uppercase text-muted-foreground">Projeto</Label>
            <Select value={projectId} onValueChange={setProjectId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o projeto" />
              </SelectTrigger>
              <SelectContent>
                {projects.map((project) => (
                  <SelectItem key={project.id} value={project.id}>
                    {project.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="mb-1.5 block text-xs uppercase text-muted-foreground">Imagem</Label>
            <Input
              type="file"
              accept={IMAGE_ACCEPT}
              onChange={(event) => setFile(event.target.files?.[0] ?? null)}
            />
          </div>

          <Button className="w-full" disabled={!projectId || !file || busy} onClick={() => void submit()}>
            {busy ? <Loader2 className="size-4 animate-spin" /> : <ImagePlus className="size-4" />}
            {busy ? "Enviando..." : "Enviar referência"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
