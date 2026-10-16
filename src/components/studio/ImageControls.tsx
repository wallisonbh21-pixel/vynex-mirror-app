import React, { useEffect, useRef, useState } from 'react';
import { useServerFn } from '@tanstack/react-start';
import { toast } from 'sonner';
import { ImageOff, Loader2, RotateCcw, Upload, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import {
  SITE_IMAGES_BUCKET,
  SITE_IMAGE_ACCEPT,
  isSafeImageUrl,
  siteImageUrl,
  validateSiteImageFile,
} from '@/lib/studio/site-images';
import { verifySiteImage } from '@/lib/studio/site-images.functions';

async function sha256Hex(file: File) {
  const digest = await crypto.subtle.digest('SHA-256', await file.arrayBuffer());
  return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

function putWithProgress(url: string, file: File, onProgress: (n: number) => void, xhrRef: React.MutableRefObject<XMLHttpRequest | null>) {
  return new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhrRef.current = xhr;
    xhr.open('PUT', url, true);
    xhr.setRequestHeader('content-type', file.type);
    xhr.setRequestHeader('x-upsert', 'false');
    xhr.upload.onprogress = (e) => { if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 90)); };
    xhr.onload = () => (xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error('O armazenamento recusou o arquivo.')));
    xhr.onerror = () => reject(new Error('Conexão interrompida durante o envio.'));
    xhr.onabort = () => reject(new Error('__cancelado__'));
    xhr.send(file);
  });
}

type Props = {
  projectId: string;
  label: string;
  url: string | undefined;
  removed?: boolean;
  originalUrl?: string | undefined;
  /** Aplica a mudança. `url` vazio + removed=true = imagem removida. */
  onChange: (next: { url: string; removed: boolean; originalUrl?: string | undefined }) => void;
  emptyMode?: 'collapse' | 'placeholder' | undefined;
  onEmptyModeChange?: ((mode: 'collapse' | 'placeholder') => void) | undefined;
};

/** Controles individuais de uma imagem: enviar, trocar por link, remover e restaurar. */
export function ImageControls({ projectId, label, url, removed, originalUrl, onChange, emptyMode, onEmptyModeChange }: Props) {
  const verify = useServerFn(verifySiteImage);
  const inputRef = useRef<HTMLInputElement>(null);
  const xhrRef = useRef<XMLHttpRequest | null>(null);
  const [pending, setPending] = useState<{ file: File; preview: string } | null>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [linkDraft, setLinkDraft] = useState('');

  useEffect(() => () => { if (pending) URL.revokeObjectURL(pending.preview); }, [pending]);

  // A imagem original é guardada na primeira alteração, para poder restaurar.
  const keepOriginal = originalUrl ?? (url && !removed ? url : undefined);
  const apply = (nextUrl: string, nextRemoved: boolean) => onChange({ url: nextUrl, removed: nextRemoved, originalUrl: keepOriginal });

  const pick = (file: File | undefined) => {
    setError(null);
    if (!file) return;
    const check = validateSiteImageFile(file);
    if (!check.ok) { setError(check.error); return; }
    if (pending) URL.revokeObjectURL(pending.preview);
    setPending({ file, preview: URL.createObjectURL(file) });
  };

  const cancelSelection = () => {
    if (pending) URL.revokeObjectURL(pending.preview);
    setPending(null);
    setError(null);
    if (inputRef.current) inputRef.current.value = '';
  };

  const confirmUpload = async () => {
    if (!pending) return;
    const { file } = pending;
    const check = validateSiteImageFile(file);
    if (!check.ok) { setError(check.error); return; }
    setError(null);
    setProgress(0);
    try {
      const hash = await sha256Hex(file);
      const path = `${projectId}/${hash}.${check.ext}`;
      const bucket = supabase.storage.from(SITE_IMAGES_BUCKET);
      // Reutiliza a mesma imagem se ela já foi enviada a este projeto.
      const existing = await bucket.list(projectId, { search: hash, limit: 1 });
      const already = existing.data?.some((o) => o.name === `${hash}.${check.ext}`);
      if (!already) {
        const signed = await bucket.createSignedUploadUrl(path);
        if (signed.error || !signed.data) throw new Error('Sem permissão para enviar imagens neste projeto.');
        await putWithProgress(signed.data.signedUrl, file, setProgress, xhrRef);
      }
      setProgress(95);
      const res = await verify({ data: { projectId, path } });
      if (!res.ok) throw new Error(res.error);
      apply(res.url ?? siteImageUrl(path), false);
      toast.success(already ? 'Imagem reaproveitada — ela já estava no projeto.' : 'Imagem enviada.');
      cancelSelection();
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Falha no envio.';
      if (msg === '__cancelado__') toast.message('Envio cancelado.');
      else { setError(msg); toast.error(msg); }
    } finally {
      xhrRef.current = null;
      setProgress(null);
    }
  };

  const uploading = progress !== null;
  const showRestore = !!keepOriginal && (removed || keepOriginal !== url);

  return (
    <div className="space-y-3">
      <Label className="text-xs text-slate-400">{label}</Label>

      <div className="rounded-lg border border-slate-800 bg-slate-900 overflow-hidden aspect-video flex items-center justify-center">
        {pending ? (
          <img src={pending.preview} alt="Prévia da nova imagem" className="w-full h-full object-cover" />
        ) : !removed && isSafeImageUrl(url) ? (
          <img src={url} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="flex flex-col items-center gap-1 text-slate-500 text-xs"><ImageOff className="size-5" />{removed ? 'Imagem removida' : 'Sem imagem'}</div>
        )}
      </div>

      <input ref={inputRef} type="file" accept={SITE_IMAGE_ACCEPT} className="hidden" onChange={(e) => pick(e.target.files?.[0])} />

      {pending ? (
        <div className="space-y-2">
          <p className="text-[11px] text-slate-400 truncate">{pending.file.name} · {(pending.file.size / 1024 / 1024).toFixed(2)} MB</p>
          {uploading && <Progress value={progress ?? 0} className="h-1.5" />}
          <div className="flex gap-2">
            {uploading ? (
              <Button size="sm" variant="outline" className="flex-1" onClick={() => xhrRef.current?.abort()}>
                <Loader2 className="size-3.5 animate-spin" /> Cancelar envio
              </Button>
            ) : (
              <>
                <Button size="sm" className="flex-1" onClick={confirmUpload}>Usar esta imagem</Button>
                <Button size="sm" variant="outline" onClick={() => inputRef.current?.click()}>Trocar</Button>
                <Button size="sm" variant="ghost" onClick={cancelSelection} aria-label="Cancelar seleção"><X className="size-4" /></Button>
              </>
            )}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          <Button size="sm" variant="secondary" onClick={() => inputRef.current?.click()}><Upload className="size-3.5" /> Enviar do computador</Button>
          <Button size="sm" variant="outline" disabled={removed} onClick={() => apply('', true)}><ImageOff className="size-3.5" /> Remover imagem</Button>
          {showRestore && (
            <Button size="sm" variant="ghost" className="col-span-2" onClick={() => apply(keepOriginal!, false)}><RotateCcw className="size-3.5" /> Restaurar imagem original</Button>
          )}
        </div>
      )}

      {error && <p className="text-xs text-red-400">{error}</p>}
      <p className="text-[10px] text-slate-500">JPG, PNG, WebP ou GIF, até 5 MB.</p>

      <div className="space-y-1">
        <Label className="text-[11px] text-slate-500">Ou trocar por um link (https://)</Label>
        <div className="flex gap-2">
          <Input value={linkDraft} onChange={(e) => setLinkDraft(e.target.value)} placeholder="https://..." className="bg-slate-900 border-slate-800 text-slate-200 h-8 text-xs" />
          <Button size="sm" variant="outline" disabled={!/^https:\/\//i.test(linkDraft.trim()) || !isSafeImageUrl(linkDraft)} onClick={() => { apply(linkDraft.trim(), false); setLinkDraft(''); }}>Aplicar</Button>
        </div>
      </div>

      {removed && onEmptyModeChange && (
        <div className="space-y-1">
          <Label className="text-[11px] text-slate-500">No site publicado</Label>
          <div className="grid grid-cols-2 gap-2">
            <Button size="sm" variant={emptyMode !== 'placeholder' ? 'secondary' : 'outline'} onClick={() => onEmptyModeChange('collapse')}>Ajustar layout</Button>
            <Button size="sm" variant={emptyMode === 'placeholder' ? 'secondary' : 'outline'} onClick={() => onEmptyModeChange('placeholder')}>Manter espaço</Button>
          </div>
        </div>
      )}
    </div>
  );
}
