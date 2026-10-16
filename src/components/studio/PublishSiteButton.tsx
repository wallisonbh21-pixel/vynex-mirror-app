import { useEffect, useState } from 'react';
import { Globe, ExternalLink, Loader2, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { createClient } from '@supabase/supabase-js';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { useProjectSite, usePublishSite, slugify } from '@/lib/studio/hooks';

interface Props {
  projectId: string;
  defaultName: string;
  /** Salva o rascunho atual antes de publicar. */
  onSaveBeforePublish: () => Promise<void>;
  /** Abre o painel de publicação automaticamente (vindo de "Publicar site" no catálogo). */
  autoOpen?: boolean;
}

/** Confere, sem sessão (como um visitante), se o endereço público responde com conteúdo. */
async function verifyPublic(slug: string, expectedVersion: number) {
  const url = import.meta.env['VITE_SUPABASE_URL'] as string;
  const key = import.meta.env['VITE_SUPABASE_PUBLISHABLE_KEY'] as string;
  const anon = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data, error } = await anon.rpc('get_published_site' as never, { p_slug: slug } as never);
  if (error) return false;
  const row = (Array.isArray(data) ? data[0] : data) as { version_number?: number; sections?: unknown[] } | null;
  return !!row && (row.version_number ?? 0) >= expectedVersion && Array.isArray(row.sections) && row.sections.length > 0;
}

export function PublishSiteButton({ projectId, defaultName, onSaveBeforePublish, autoOpen }: Props) {
  const { data: site } = useProjectSite(projectId);
  const publish = usePublishSite();
  const [open, setOpen] = useState(false);
  const [slug, setSlug] = useState('');
  const [result, setResult] = useState<{ url: string; version: number; verified: boolean } | null>(null);
  const versions = ((site as any)?.project_site_versions ?? []) as { version_number: number; published_at: string }[];
  const latest = versions.slice().sort((a, b) => b.version_number - a.version_number)[0];
  const effectiveSlug = site?.slug ?? (slug || slugify(defaultName));

  useEffect(() => {
    if (autoOpen) setOpen(true);
  }, [autoOpen]);

  const handlePublish = async () => {
    try {
      await onSaveBeforePublish();
    } catch (e: any) {
      toast.error(`Não foi possível salvar: ${e?.message ?? 'erro'}. Nada foi publicado.`);
      return;
    }
    try {
      let r;
      let attempt = 0;
      // Endereço já usado por outro site: tenta uma variação (só na primeira publicação).
      for (;;) {
        const candidate = site?.slug ?? (attempt === 0 ? effectiveSlug : `${effectiveSlug.slice(0, 54)}-${attempt + 1}`);
        try {
          r = await publish.mutateAsync({ projectId, slug: candidate });
          break;
        } catch (e: any) {
          const msg = String(e?.message ?? '');
          if (!site && attempt < 4 && /uso|exist|duplic|unique/i.test(msg)) { attempt++; continue; }
          throw e;
        }
      }
      const verified = await verifyPublic(r.slug, r.version_number);
      setOpen(false);
      setResult({ url: `${window.location.origin}/s/${r.slug}`, version: r.version_number, verified });
    } catch (e: any) {
      toast.error(`Falha ao publicar: ${e?.message ?? 'erro'}. Suas alterações continuam salvas no Studio.`);
    }
  };

  return (
    <div className="flex items-center gap-2">
      {site?.status === 'PUBLICADO' && (
        <Button variant="ghost" size="sm" className="gap-2" asChild>
          <a href={`/s/${site.slug}`} target="_blank" rel="noreferrer">
            <ExternalLink className="size-4" /> Visualizar site publicado
          </a>
        </Button>
      )}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button size="sm" variant="secondary" className="gap-2 font-bold">
            <Globe className="size-4" /> Publicar site
          </Button>
        </PopoverTrigger>
        <PopoverContent align="end" className="w-80 space-y-3">
          <div className="text-sm font-semibold">Publicar site</div>
          <p className="text-xs text-muted-foreground">
            O rascunho atual será salvo e publicado como uma nova versão. O projeto continua editável; versões anteriores ficam registradas.
          </p>
          <div className="space-y-1">
            <label className="text-xs font-medium">Endereço público</label>
            {site ? (
              <div className="text-sm font-mono">/s/{site.slug}</div>
            ) : (
              <Input
                value={slug || slugify(defaultName)}
                onChange={(e) => setSlug(slugify(e.target.value))}
                placeholder="minha-empresa"
              />
            )}
          </div>
          <div className="text-xs text-muted-foreground">
            Status: {site?.status ?? 'RASCUNHO'}
            {latest && ` · versão ${latest.version_number} em ${new Date(latest.published_at).toLocaleString('pt-BR')}`}
          </div>
          <Button className="w-full gap-2" onClick={handlePublish} disabled={publish.isPending || effectiveSlug.length < 3}>
            {publish.isPending ? <Loader2 className="size-4 animate-spin" /> : <Globe className="size-4" />}
            {latest ? `Publicar versão ${latest.version_number + 1}` : 'Publicar versão 1'}
          </Button>
        </PopoverContent>
      </Popover>

      <Dialog open={!!result} onOpenChange={(o) => !o && setResult(null)}>
        <DialogContent className="max-w-md">
          {result && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="size-5 text-primary" />
                <DialogTitle>Site publicado — versão {result.version}</DialogTitle>
              </div>
              <DialogDescription>
                {result.verified
                  ? 'Conferimos que o endereço abre para qualquer visitante, sem login.'
                  : 'A versão foi gravada, mas não conseguimos confirmar o acesso público agora. Abra o link para conferir.'}
              </DialogDescription>
              <div className="break-all rounded-md border border-border bg-muted/40 p-2 font-mono text-xs">{result.url}</div>
              <Button asChild className="w-full gap-2">
                <a href={result.url} target="_blank" rel="noreferrer"><ExternalLink className="size-4" /> Abrir site publicado</a>
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
