import { createFileRoute } from '@tanstack/react-router';
import { LandingPage } from '@/components/landing/LandingPage';

export const Route = createFileRoute('/')({
  head: () => ({
    meta: [
      { title: "ScaleNexus — Plataforma de Crescimento Digital" },
      { name: "description", content: "ScaleNexus é uma plataforma completa para prospecção, vendas, criação de sites e gestão de projetos digitais." },
      { property: "og:title", content: "ScaleNexus — Plataforma de Crescimento Digital" },
      { property: "og:description", content: "Plataforma completa para o ecossistema de negócios digitais." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: LandingPage,
});
