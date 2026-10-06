import { useState } from 'react';
import { Globe, ExternalLink, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useProjectSite, usePublishSite, slugify } from '@/lib/studio/hooks';

interface Props {
  projectId: string;
  defaultName: string;
  /** Salva o rascunho atual antes de publicar. */
  onSaveBeforePublish: () => Promise<void>;
}

export function PublishSiteButton({ projectId, defaultName, onSaveBeforePublish }: Props) {
  const { data: site } = useProjectSite(projectId);
  const publish = usePublishSite();
  const [open, setOpen] = useState(false);
  const [slug, setSlug] = useState('');
  const versions = ((site as any)?.project_site_versions ?? []) as { version_number: number; published_at: string }[];
  const latest = versions.slice().sort((a, b) => b.version_number - a.version_number)[0];
  const effectiveSlug = site?.slug ?? (slug || slugify(defaultName));

  const handlePublish = async () => {
    try {
      await onSaveBeforePublish();
      const r = await publish.mutateAsync({ projectId, slug: effectiveSlug });
      toast.success(`Versão ${r.version_number} publicada em /s/${r.slug}`);
      setOpen(false);
    } catch (e: any) {
      toast.error(e?.message ?? 'Falha ao publicar');
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
            O rascunho atual será salvo e publicado como uma nova versão. Versões anteriores ficam registradas e não mudam.
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
    </div>
  );
}
