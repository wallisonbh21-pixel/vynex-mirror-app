import type { StudioData, StudioElement, StudioSection } from "@/types/studio";
import type { EducacaoContent } from "./content";

/** Converte o Template 04 para StudioData (mesmo padrão dos Templates 01–03). */
let n = 0;
const id = (p: string) => `edu_${p}_${++n}`;
const el = (type: StudioElement["type"], content: any, styles: Record<string, any> = {}): StudioElement => ({ id: id(type), type, content, styles });
const sec = (type: string, order: number, styles: Record<string, any>, elements: StudioElement[]): StudioSection => ({ id: id(type), type, order, styles, elements });

export function educacaoToStudioData(c: EducacaoContent): StudioData {
  n = 0;
  const t = c.theme;
  const center = { textAlign: "center" };
  const muted = { color: t.muted };
  const list = (items: { title: string; text: string }[]) =>
    items.flatMap((i) => [el("subtitle", { text: i.title }), el("paragraph", { text: i.text }, muted)]);
  const p = c.professional;
  const sections: StudioSection[] = [
    sec("hero", 0, { paddingTop: "9rem", paddingBottom: "7rem", backgroundColor: t.background }, [
      el("subtitle", { text: c.hero.eyebrow }, { color: t.primary }),
      el("title", { text: c.hero.title }, { fontSize: "3.25rem", color: t.text }),
      el("paragraph", { text: c.hero.text }, muted),
      el("button", { text: c.hero.primaryCta }, { backgroundColor: t.primary, color: t.primaryText }),
      el("button", { text: c.hero.secondaryCta }, { backgroundColor: "transparent", color: t.primary }),
      el("image", { url: c.hero.imageUrl, alt: c.hero.imageAlt }),
    ]),
    sec("about", 1, { backgroundColor: t.surface }, [
      el("title", { text: c.about.title }),
      el("image", { url: p.photoUrl, alt: p.photoAlt }),
      el("subtitle", { text: `${p.name} · ${p.role}` }),
      el("paragraph", { text: p.bio }),
      el("paragraph", { text: `Formação: ${p.education} · Experiência: ${p.experience}` }, muted),
      el("paragraph", { text: p.specializations.join(" · ") }, muted),
    ]),
    sec("services", 2, {}, [el("title", { text: c.process.title }, center), ...c.process.steps.flatMap((s) => [el("subtitle", { text: `${s.number} — ${s.title}` }), el("paragraph", { text: s.text }, muted)])]),
    sec("services", 3, { backgroundColor: t.surfaceAlt }, [el("title", { text: c.areas.title }, center), ...list(c.areas.items)]),
    sec("highlights", 4, {}, [el("title", { text: c.approach.title }, center), el("paragraph", { text: c.approach.flow.join(" → ") }, center), ...list(c.approach.elements)]),
    sec("custom", 5, { backgroundColor: t.surface }, [
      el("title", { text: c.journal.title }, center),
      ...c.journal.entries.map((e) => el("paragraph", { text: `${e.label}: ${e.text}` })),
      el("paragraph", { text: c.journal.disclaimer }, { ...center, ...muted }),
    ]),
    sec("services", 6, {}, [el("title", { text: c.resources.title }, center), ...list(c.resources.items)]),
    sec("about", 7, { backgroundColor: t.surfaceAlt }, [
      el("title", { text: c.partnership.title }, center),
      el("paragraph", { text: c.partnership.actors.map((a) => a.label).join(" ↔ ") }, center),
      ...list(c.partnership.pillars),
      el("paragraph", { text: c.partnership.disclaimer }, { ...center, ...muted }),
    ]),
    sec("testimonials", 8, {}, [
      el("title", { text: c.testimonials.title }, center),
      ...c.testimonials.items.map((x) => el("testimonial", { text: x.text, author: `${x.name} — ${x.relation}` })),
      el("paragraph", { text: c.testimonials.disclaimer }, { ...center, ...muted }),
    ]),
    sec("custom", 9, { backgroundColor: t.surface }, [el("title", { text: c.faq.title }, center), ...c.faq.items.flatMap((f) => [el("subtitle", { text: f.question }), el("paragraph", { text: f.answer }, muted)])]),
    sec("cta", 10, { paddingTop: "7rem", paddingBottom: "7rem", backgroundColor: t.primary }, [
      el("title", { text: c.cta.title }, { ...center, color: t.primaryText }),
      el("paragraph", { text: c.cta.text }, { ...center, color: t.primaryText }),
      el("button", { text: c.cta.buttonLabel }, { backgroundColor: t.surface, color: t.primary }),
    ]),
    sec("footer", 11, { backgroundColor: t.text, color: "#ffffff" }, [
      el("subtitle", { text: c.brand.name }),
      el("paragraph", { text: c.footer.description }),
      el("contact", { text: `${c.contact.email} · ${c.contact.phone} · ${c.contact.city}` }),
    ]),
  ];
  return {
    design_system: {
      colors: { primary: t.primary, secondary: t.sage, accent: t.accent, background: t.background, surface: t.surface, border: t.line, text: t.text, textSecondary: t.muted },
      typography: { headingFont: t.headingFont, bodyFont: t.bodyFont, headingWeight: "500", bodyWeight: "400" },
      buttons: { style: "solid", borderRadius: "999px", shadow: "sm", size: "lg" },
      cards: { borderRadius: "1.5rem", shadow: "sm", border: true },
    },
    sections,
  };
}
