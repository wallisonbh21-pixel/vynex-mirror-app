import { createFileRoute } from '@tanstack/react-router';
import { TemplatesPage } from '@/components/landing/TemplatesPage';

export const Route = createFileRoute('/modelos')({
  head: () => ({
    meta: [
      { title: "Modelos de site prontos — ScaleNexus" },
      { name: "description", content: "12 modelos de site prontos para hamburgueria, barbearia, clínica, advocacia e mais. R$ 497 de setup + R$ 97/mês, no ar em 48h." },
      { property: "og:title", content: "Modelos de site prontos — ScaleNexus" },
      { property: "og:description", content: "Escolha um modelo, coloque o nome da sua empresa e receba o site pronto em 48 horas." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: TemplatesPage,
});
