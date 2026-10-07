import type { StudioData, StudioElement, StudioSection } from "@/types/studio";
import type { TecnologiaSaasContent } from "./content";

/** Converte o Template 03 para StudioData (mesmo padrão dos Templates 01 e 02). */
let n = 0;
const id = (p: string) => `saas_${p}_${++n}`;
const el = (type: StudioElement["type"], content: any, styles: Record<string, any> = {}): StudioElement => ({ id: id(type), type, content, styles });
const sec = (type: string, order: number, styles: Record<string, any>, elements: StudioElement[]): StudioSection => ({ id: id(type), type, order, styles, elements });

export function tecnologiaSaasToStudioData(c: TecnologiaSaasContent): StudioData {
  n = 0;
  const t = c.theme;
  const center = { textAlign: "center" };
  const muted = { color: t.muted };
  let o = 0;
  const sections: StudioSection[] = [
    sec("hero", o++, { paddingTop: "9rem", paddingBottom: "8rem", backgroundColor: t.background }, [
      el("subtitle", { text: c.hero.eyebrow }, { color: t.accent2 }),
      el("title", { text: c.hero.title }, { fontSize: "3.5rem", color: t.text }),
      el("paragraph", { text: c.hero.text }, muted),
      el("button", { text: c.hero.primaryCta }, { backgroundColor: t.accent, color: t.accentText }),
      el("button", { text: c.hero.secondaryCta }, { backgroundColor: "transparent", color: t.text }),
    ]),
    sec("highlights", o++, { backgroundColor: t.surface }, [
      el("title", { text: c.showcase.title }, center),
      el("paragraph", { text: c.showcase.subtitle }, { ...center, ...muted }),
      el("paragraph", { text: c.showcase.kpis.map((k) => `${k.label}: ${k.value}`).join(" · ") }, center),
    ]),
    sec("about", o++, {}, [
      el("title", { text: c.problem.title }, center),
      ...c.problem.items.flatMap((p) => [el("subtitle", { text: p.title }), el("paragraph", { text: p.text }, muted)]),
    ]),
    sec("custom", o++, { backgroundColor: t.surface }, [
      el("title", { text: c.solution.title }, center),
      el("paragraph", { text: c.solution.text }, { ...center, ...muted }),
      el("paragraph", { text: c.solution.nodes.map((x) => x.label).join(" → ") }, center),
    ]),
    sec("services", o++, {}, [
      el("title", { text: c.features.title }, center),
      ...c.features.items.flatMap((f) => [el("subtitle", { text: f.title }), el("paragraph", { text: f.text }, muted)]),
    ]),
    sec("custom", o++, { backgroundColor: t.surface }, [
      el("title", { text: c.howItWorks.title }, center),
      ...c.howItWorks.steps.flatMap((s) => [el("subtitle", { text: `${s.number} — ${s.title}` }), el("paragraph", { text: s.text }, muted)]),
    ]),
    sec("gallery", o++, {}, [
      el("title", { text: c.product.title }, center),
      el("paragraph", { text: c.product.tabs.map((x) => x.label).join(" · ") }, { ...center, ...muted }),
    ]),
    sec("services", o++, { backgroundColor: t.surface }, [
      el("title", { text: c.integrations.title }, center),
      el("paragraph", { text: c.integrations.items.join(" · ") }, center),
      el("paragraph", { text: c.integrations.disclaimer }, { ...center, ...muted }),
    ]),
    sec("highlights", o++, {}, [
      el("title", { text: c.security.title }, center),
      ...c.security.items.flatMap((s) => [el("subtitle", { text: s.title }), el("paragraph", { text: s.text }, muted)]),
    ]),
    sec("highlights", o++, { backgroundColor: t.surface }, [
      el("title", { text: c.results.title }, center),
      el("paragraph", { text: c.results.stats.map((s) => `${s.prefix ?? ""}${s.value}${s.suffix ?? ""} ${s.label}`).join(" · ") }, center),
      el("paragraph", { text: c.results.disclaimer }, { ...center, ...muted }),
    ]),
    sec("pricing", o++, {}, [
      el("title", { text: c.pricing.title }, center),
      ...c.pricing.plans.flatMap((p) => [
        el("subtitle", { text: `${p.name} — ${p.price}${p.period}` }),
        el("paragraph", { text: `${p.description} ${p.features.join(" · ")}` }, muted),
        el("button", { text: p.ctaLabel }, { backgroundColor: p.highlighted ? t.accent : "transparent", color: t.text }),
      ]),
      el("paragraph", { text: c.pricing.disclaimer }, { ...center, ...muted }),
    ]),
    sec("testimonials", o++, { backgroundColor: t.surface }, [
      el("title", { text: c.testimonials.title }, center),
      ...c.testimonials.items.map((x) => el("testimonial", { text: x.text, author: `${x.name} — ${x.role}, ${x.company}` })),
      el("paragraph", { text: c.testimonials.disclaimer }, { ...center, ...muted }),
    ]),
    sec("faq", o++, {}, [
      el("title", { text: c.faq.title }, center),
      ...c.faq.items.map((q) => el("faq", { question: q.question, answer: q.answer, text: q.question })),
    ]),
    sec("cta", o++, { paddingTop: "8rem", paddingBottom: "8rem", backgroundColor: "#061532" }, [
      el("title", { text: c.cta.title }, { ...center, color: "#ffffff" }),
      el("paragraph", { text: c.cta.text }, { ...center, ...muted }),
      el("button", { text: c.cta.buttonLabel }, { backgroundColor: t.accent, color: t.accentText }),
    ]),
    sec("footer", o++, { backgroundColor: "#020409", color: "#ffffff" }, [
      el("subtitle", { text: c.brand.name }, { color: t.accent2 }),
      el("paragraph", { text: c.footer.description }, muted),
      el("contact", { text: `${c.contact.email} · ${c.contact.phone} · ${c.contact.city}` }),
    ]),
  ];
  return {
    design_system: {
      colors: { primary: t.accent, secondary: t.surface, accent: t.accent2, background: t.background, surface: t.surface, border: "#18233a", text: t.text, textSecondary: t.muted },
      typography: { headingFont: t.headingFont, bodyFont: t.bodyFont, headingWeight: "600", bodyWeight: "400" },
      buttons: { style: "solid", borderRadius: "0.625rem", shadow: "md", size: "lg" },
      cards: { borderRadius: "1rem", shadow: "lg", border: true },
    },
    sections,
  };
}
