import type { StudioData, StudioElement, StudioSection } from "@/types/studio";
import type { IaAutomacaoContent } from "./content";

/** Converte o Template 02 para StudioData (mesmo padrão do Template 01). */
let n = 0;
const id = (p: string) => `iaauto_${p}_${++n}`;
const el = (type: StudioElement["type"], content: any, styles: Record<string, any> = {}): StudioElement => ({ id: id(type), type, content, styles });
const sec = (type: string, order: number, styles: Record<string, any>, elements: StudioElement[]): StudioSection => ({ id: id(type), type, order, styles, elements });

export function iaAutomacaoToStudioData(c: IaAutomacaoContent): StudioData {
  n = 0;
  const t = c.theme;
  const center = { textAlign: "center" };
  const sections: StudioSection[] = [
    sec("hero", 0, { paddingTop: "9rem", paddingBottom: "8rem", backgroundColor: t.background }, [
      el("subtitle", { text: c.hero.eyebrow }, { color: t.accent2 }),
      el("title", { text: c.hero.title }, { fontSize: "3.5rem", color: t.text }),
      el("paragraph", { text: c.hero.text }, { color: t.muted }),
      el("button", { text: c.hero.primaryCta }, { backgroundColor: t.accent, color: t.accentText }),
      el("button", { text: c.hero.secondaryCta }, { backgroundColor: "transparent", color: t.text }),
    ]),
    sec("about", 1, {}, [
      el("title", { text: c.problem.title }, center),
      ...c.problem.items.flatMap((p) => [el("subtitle", { text: p.title }), el("paragraph", { text: p.text }, { color: t.muted })]),
      el("paragraph", { text: c.problem.transformation }, { ...center, color: t.accent2 }),
    ]),
    sec("services", 2, { backgroundColor: t.surface }, [
      el("title", { text: c.solutions.title }, center),
      el("paragraph", { text: c.solutions.subtitle }, { ...center, color: t.muted }),
      ...c.solutions.items.flatMap((s) => [el("subtitle", { text: s.title }), el("paragraph", { text: s.text }, { color: t.muted })]),
    ]),
    sec("highlights", 3, {}, [
      el("title", { text: c.agents.title }, center),
      ...c.agents.items.flatMap((a) => [el("subtitle", { text: `${a.name} · ${a.role}` }), el("paragraph", { text: a.text }, { color: t.muted })]),
    ]),
    sec("custom", 4, { backgroundColor: t.surface }, [
      el("title", { text: c.automations.title }, center),
      ...c.automations.flows.map((f) => el("paragraph", { text: `${f.title}: ${f.steps.join(" → ")}` }, center)),
    ]),
    sec("services", 5, {}, [
      el("title", { text: c.integrations.title }, center),
      el("paragraph", { text: c.integrations.items.map((i) => i.label).join(" · ") }, center),
      el("paragraph", { text: c.integrations.disclaimer }, { ...center, color: t.muted }),
    ]),
    sec("highlights", 6, { backgroundColor: t.surface }, [
      el("title", { text: c.results.title }, center),
      el("paragraph", { text: c.results.stats.map((s) => `${s.prefix ?? ""}${s.value}${s.suffix ?? ""} ${s.label}`).join(" · ") }, center),
      el("paragraph", { text: c.results.disclaimer }, { ...center, color: t.muted }),
    ]),
    sec("services", 7, {}, [
      el("title", { text: c.useCases.title }, center),
      ...c.useCases.items.flatMap((u) => [el("subtitle", { text: u.title }), el("paragraph", { text: `${u.text} (${u.steps.join(" → ")})` }, { color: t.muted })]),
    ]),
    sec("testimonials", 8, { backgroundColor: t.surface }, [
      el("title", { text: c.testimonials.title }, center),
      ...c.testimonials.items.map((x) => el("testimonial", { text: x.text, author: `${x.role} — ${x.segment}` })),
      el("paragraph", { text: c.testimonials.disclaimer }, { ...center, color: t.muted }),
    ]),
    sec("cta", 9, { paddingTop: "8rem", paddingBottom: "8rem", backgroundColor: "#06102a" }, [
      el("title", { text: c.cta.title }, { ...center, color: "#ffffff" }),
      el("paragraph", { text: c.cta.text }, { ...center, color: t.muted }),
      el("button", { text: c.cta.buttonLabel }, { backgroundColor: t.accent, color: t.accentText }),
    ]),
    sec("footer", 10, { backgroundColor: "#020409", color: "#ffffff" }, [
      el("subtitle", { text: c.brand.name }, { color: t.accent2 }),
      el("paragraph", { text: c.footer.description }, { color: t.muted }),
      el("contact", { text: `${c.contact.email} · ${c.contact.phone} · ${c.contact.city}` }),
    ]),
  ];
  return {
    design_system: {
      colors: { primary: t.accent, secondary: t.surface, accent: t.accent2, background: t.background, surface: t.surface, border: "#16233d", text: t.text, textSecondary: t.muted },
      typography: { headingFont: t.headingFont, bodyFont: t.bodyFont, headingWeight: "600", bodyWeight: "400" },
      buttons: { style: "solid", borderRadius: "0.75rem", shadow: "md", size: "lg" },
      cards: { borderRadius: "1rem", shadow: "lg", border: true },
    },
    sections,
  };
}
