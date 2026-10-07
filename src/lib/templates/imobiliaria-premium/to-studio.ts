import type { StudioData, StudioElement, StudioSection } from "@/types/studio";
import type { ImobiliariaContent } from "./content";

/**
 * Converte o conteúdo do Template 01 para o formato do Studio existente
 * (StudioData com seções/elementos já suportados), para que o Criador possa
 * editar textos, imagens, cores e ordem das seções, salvar e publicar
 * pelo fluxo atual (publish_project_site).
 */
let n = 0;
const id = (p: string) => `imob_${p}_${++n}`;
const el = (type: StudioElement["type"], content: any, styles: Record<string, any> = {}): StudioElement => ({ id: id(type), type, content, styles });
const sec = (type: string, order: number, styles: Record<string, any>, elements: StudioElement[]): StudioSection => ({ id: id(type), type, order, styles, elements });

export function imobiliariaToStudioData(c: ImobiliariaContent): StudioData {
  n = 0;
  const t = c.theme;
  const sections: StudioSection[] = [
    sec("hero", 0, { backgroundImage: c.hero.image, paddingTop: "10rem", paddingBottom: "10rem" }, [
      el("subtitle", { text: c.hero.eyebrow }, { color: t.accent }),
      el("title", { text: c.hero.title }, { fontSize: "3.5rem", color: "#ffffff" }),
      el("paragraph", { text: c.hero.text }, { color: "#e7e2d8" }),
      el("button", { text: c.hero.primaryCta }, { backgroundColor: t.accent, color: t.accentText }),
    ]),
    sec("listing", 1, {}, [
      el("title", { text: c.featured.title }, { textAlign: "center" }),
      el("paragraph", { text: c.featured.subtitle }, { textAlign: "center", color: t.muted }),
      ...c.featured.properties.flatMap((p) => [
        el("image", { url: p.image, alt: p.title }),
        el("subtitle", { text: `${p.title} — ${p.price}` }),
        el("paragraph", { text: `${p.location} · ${p.bedrooms} quartos · ${p.bathrooms} banheiros · ${p.parking} vagas · ${p.area} m²` }, { color: t.muted }),
      ]),
    ]),
    sec("services", 2, { backgroundColor: t.surface }, [
      el("title", { text: c.types.title }, { textAlign: "center" }),
      ...c.types.categories.map((x) => el("paragraph", { text: `${x.label} — ${x.count}` }, { textAlign: "center" })),
    ]),
    sec("gallery", 3, {}, [
      el("title", { text: c.developments.title }),
      ...c.developments.items.flatMap((d) => [
        el("image", { url: d.image, alt: d.name }),
        el("subtitle", { text: `${d.name} · ${d.status}` }),
        el("paragraph", { text: `${d.location} — ${d.priceRange}` }, { color: t.muted }),
        el("button", { text: d.ctaLabel }, { backgroundColor: t.accent, color: t.accentText }),
      ]),
    ]),
    sec("highlights", 4, { backgroundColor: t.surface }, [
      el("title", { text: c.differentials.title }, { textAlign: "center" }),
      ...c.differentials.items.flatMap((d) => [el("subtitle", { text: d.title }), el("paragraph", { text: d.text }, { color: t.muted })]),
    ]),
    sec("about", 5, {}, [
      el("subtitle", { text: c.about.eyebrow }, { color: t.accent }),
      el("title", { text: c.about.title }),
      ...c.about.paragraphs.map((p) => el("paragraph", { text: p })),
      el("image", { url: c.about.image, alt: c.about.title }),
      el("paragraph", { text: c.about.stats.map((s) => `${s.prefix ?? ""}${s.value}${s.suffix ?? ""} ${s.label}`).join(" · ") + ` (${c.about.disclaimer})` }, { color: t.muted }),
    ]),
    sec("testimonials", 6, { backgroundColor: t.surface }, [
      el("title", { text: c.testimonials.title }, { textAlign: "center" }),
      ...c.testimonials.items.map((x) => el("testimonial", { text: x.text, author: `${x.name} — ${x.location}` })),
      el("paragraph", { text: c.testimonials.disclaimer }, { textAlign: "center", color: t.muted }),
    ]),
    sec("cta", 7, { backgroundImage: c.cta.image, paddingTop: "8rem", paddingBottom: "8rem" }, [
      el("title", { text: c.cta.title }, { textAlign: "center", color: "#ffffff" }),
      el("paragraph", { text: c.cta.text }, { textAlign: "center", color: "#e7e2d8" }),
      el("button", { text: c.cta.buttonLabel }, { backgroundColor: t.accent, color: t.accentText }),
      el("whatsapp", { text: c.contact.whatsapp }),
    ]),
    sec("footer", 8, { backgroundColor: "#0a0907", color: "#ffffff" }, [
      el("subtitle", { text: c.brand.name }, { color: t.accent }),
      el("paragraph", { text: c.footer.description }, { color: t.muted }),
      el("contact", { text: `${c.contact.address} · ${c.contact.phone} · ${c.contact.email}` }),
    ]),
  ];
  return {
    design_system: {
      colors: { primary: t.accent, secondary: t.surface, accent: t.accent, background: t.background, surface: t.surface, border: "#2a2620", text: t.text, textSecondary: t.muted },
      typography: { headingFont: t.headingFont, bodyFont: t.bodyFont, headingWeight: "500", bodyWeight: "400" },
      buttons: { style: "solid", borderRadius: "999px", shadow: "md", size: "lg" },
      cards: { borderRadius: "1rem", shadow: "lg", border: true },
    },
    sections,
  };
}
