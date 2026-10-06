import { createFileRoute, Link } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { SectionRenderer } from '@/components/studio/SectionRenderer';
import type { StudioDesignSystem, StudioSection } from '@/types/studio';

export const Route = createFileRoute('/s/$slug')({
  head: ({ params }) => ({
    meta: [
      { title: `${params.slug} — Site publicado` },
      { name: 'description', content: 'Site publicado com ScaleNexus.' },
      { property: 'og:title', content: `${params.slug} — Site publicado` },
      { property: 'og:description', content: 'Site publicado com ScaleNexus.' },
      { property: 'og:type', content: 'website' },
      { name: 'twitter:card', content: 'summary_large_image' },
    ],
  }),
  component: PublicSitePage,
});

const noop = () => {};

function PublicSitePage() {
  const { slug } = Route.useParams();
  const { data, isLoading, error } = useQuery({
    queryKey: ['published-site', slug],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_published_site', { p_slug: slug });
      if (error) throw error;
      return (Array.isArray(data) ? data[0] : data) ?? null;
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-muted-foreground">
        <Loader2 className="size-6 animate-spin" />
      </div>
    );
  }
  if (error || !data) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 bg-background text-foreground p-6 text-center">
        <h1 className="text-2xl font-bold">{error ? 'Não foi possível carregar este site' : 'Site ainda não publicado'}</h1>
        <p className="text-muted-foreground">
          {error ? 'Tente novamente em alguns instantes.' : 'Este endereço não possui uma versão publicada.'}
        </p>
        <Link to="/" className="text-primary underline">Voltar</Link>
      </div>
    );
  }

  const designSystem = data.design_system as unknown as StudioDesignSystem;
  const sections = ((data.sections as unknown as StudioSection[]) ?? [])
    .slice()
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  return (
    <div style={{ backgroundColor: designSystem.colors.background, fontFamily: designSystem.typography.bodyFont }}>
      {data.site_title && <title>{data.site_title}</title>}
      {sections.map((section) => (
        <SectionRenderer
          key={section.id}
          section={section}
          designSystem={designSystem}
          selectedElementId={null}
          onSelectElement={noop}
          onSelectSection={noop}
          onMoveSection={noop}
          onDuplicateSection={noop}
          onDeleteSection={noop}
          readOnly
        />
      ))}
    </div>
  );
}
