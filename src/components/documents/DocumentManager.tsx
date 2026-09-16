import { useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import {
  AlertCircle,
  CheckCircle2,
  Download,
  FileText,
  Loader2,
  RotateCcw,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  deleteProjectDocument,
  getDocumentDownloadUrl,
  listProjectDocuments,
} from "@/lib/documents.functions";
import { ACCEPT_ATTRIBUTE, MAX_FILE_BYTES, formatBytes } from "@/lib/documents/constants";
import { useDocumentUploads } from "@/lib/documents/useDocumentUploads";

export type DocumentProjectOption = { id: string; title: string };

const STATUS_STYLE: Record<string, string> = {
  pronto: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
  processando: "bg-amber-500/10 text-amber-500 border-amber-500/20",
  enviando: "bg-sky-500/10 text-sky-500 border-sky-500/20",
  erro: "bg-destructive/10 text-destructive border-destructive/20",
};

/** Núcleo de documentos: envio múltiplo, status, download e exclusão. */
export function DocumentManager({
  projects,
  canDelete,
  emptyHint,
}: {
  projects: DocumentProjectOption[];
  canDelete: boolean;
  emptyHint?: string;
}) {
  const [projectId, setProjectId] = useState<string>(projects[0]?.id ?? "");
  const inputRef = useRef<HTMLInputElement | null>(null);
  const queryClient = useQueryClient();

  const listFn = useServerFn(listProjectDocuments);
  const downloadFn = useServerFn(getDocumentDownloadUrl);
  const deleteFn = useServerFn(deleteProjectDocument);

  const { data, isLoading } = useQuery({
    queryKey: ["project-documents", projectId],
    enabled: !!projectId,
    queryFn: () => listFn({ data: { projectId } }),
  });

  const refresh = () => queryClient.invalidateQueries({ queryKey: ["project-documents", projectId] });
  const uploads = useDocumentUploads(refresh);

  const download = useMutation({
    mutationFn: (documentId: string) => downloadFn({ data: { documentId } }),
    onSuccess: (result) => {
      if (result.ok) window.open(result.url, "_blank", "noopener");
      else toast.error(result.error);
    },
    onError: () => toast.error("Não foi possível gerar o link de download."),
  });

  const remove = useMutation({
    mutationFn: (documentId: string) => deleteFn({ data: { documentId } }),
    onSuccess: (result) => {
      if (result.ok) {
        toast.success("Documento excluído.");
        refresh();
      } else toast.error(result.error);
    },
    onError: () => toast.error("Não foi possível excluir o documento."),
  });

  if (projects.length === 0) {
    return (
      <Card className="border-dashed p-12 text-center">
        <FileText className="mx-auto mb-4 size-12 text-muted-foreground/20" />
        <p className="text-muted-foreground">{emptyHint ?? "Nenhum projeto disponível para documentos."}</p>
      </Card>
    );
  }

  const documents = data?.documents ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="w-full sm:max-w-xs">
          <Select value={projectId} onValueChange={setProjectId}>
            <SelectTrigger aria-label="Selecionar projeto">
              <SelectValue placeholder="Selecione o projeto" />
            </SelectTrigger>
            <SelectContent>
              {projects.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <input
            ref={inputRef}
            type="file"
            multiple
            accept={ACCEPT_ATTRIBUTE}
            className="hidden"
            onChange={(e) => {
              const files = Array.from(e.target.files ?? []);
              if (files.length && projectId) uploads.addFiles(files, projectId);
              e.target.value = "";
            }}
          />
          <Button onClick={() => inputRef.current?.click()} disabled={!projectId}>
            <Upload className="mr-2 size-4" />
            Enviar documentos
          </Button>
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        Até {formatBytes(MAX_FILE_BYTES)} por arquivo. Formatos aceitos: PDF, DOCX, XLSX, PPTX, TXT, MD, CSV, JSON,
        PNG, JPG e WEBP.
      </p>

      {uploads.items.length > 0 && (
        <Card>
          <CardContent className="space-y-3 p-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">Envios</h3>
              <Button variant="ghost" size="sm" onClick={uploads.clearDone}>
                Limpar concluídos
              </Button>
            </div>
            {uploads.items.map((item) => (
              <div key={item.id} className="rounded-lg border border-border/60 p-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{item.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatBytes(item.size)} • {item.status}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    {item.status === "pronto" && <CheckCircle2 className="size-4 text-emerald-500" />}
                    {(item.status === "enviando" || item.status === "processando") && (
                      <Loader2 className="size-4 animate-spin text-muted-foreground" />
                    )}
                    {item.status === "erro" && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => uploads.retry(item.id, projectId)}
                        aria-label="Tentar novamente"
                      >
                        <RotateCcw className="size-4" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => uploads.dismiss(item.id)}
                      aria-label="Remover da lista"
                    >
                      <X className="size-4" />
                    </Button>
                  </div>
                </div>
                {item.status !== "erro" ? (
                  <Progress value={item.progress} className="mt-2 h-1.5" />
                ) : (
                  <p className="mt-2 flex items-start gap-1 text-xs text-destructive">
                    <AlertCircle className="mt-0.5 size-3 shrink-0" />
                    {item.error}
                  </p>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-44 w-full" />
          ))}
        </div>
      ) : documents.length === 0 ? (
        <Card className="border-dashed p-12 text-center">
          <FileText className="mx-auto mb-4 size-12 text-muted-foreground/20" />
          <p className="text-muted-foreground">Nenhum documento neste projeto ainda.</p>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {documents.map((doc: any) => (
            <Card key={doc.id} className="group border-sidebar-border/50 bg-sidebar/30 backdrop-blur-sm">
              <CardContent className="flex h-full flex-col p-4">
                <div className="mb-4 flex items-start justify-between gap-2">
                  <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <FileText className="size-5" />
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <Badge variant="secondary" className="text-[10px] uppercase">
                      {doc.category}
                    </Badge>
                    <Badge variant="outline" className={`text-[10px] uppercase ${STATUS_STYLE[doc.status] ?? ""}`}>
                      {doc.status}
                    </Badge>
                  </div>
                </div>
                <h3 className="mb-1 line-clamp-2 text-sm font-semibold">{doc.original_name ?? doc.name}</h3>
                <p className="text-xs text-muted-foreground">
                  {formatBytes(doc.size_bytes)} • {new Date(doc.created_at).toLocaleDateString("pt-BR")}
                  {doc.extension ? ` • .${doc.extension}` : ""}
                </p>
                {doc.status === "erro" && doc.error_message && (
                  <p className="mt-2 text-xs text-destructive">{doc.error_message}</p>
                )}
                <div className="mt-auto flex items-center gap-2 border-t border-sidebar-border/30 pt-4">
                  <Button
                    variant="ghost"
                    className="flex-1 justify-between text-xs hover:bg-primary/10 hover:text-primary"
                    disabled={doc.status !== "pronto" || download.isPending}
                    onClick={() => download.mutate(doc.id)}
                  >
                    Baixar
                    <Download className="ml-2 size-3" />
                  </Button>
                  {canDelete && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-muted-foreground hover:text-destructive"
                      disabled={remove.isPending}
                      onClick={() => remove.mutate(doc.id)}
                      aria-label="Excluir documento"
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
