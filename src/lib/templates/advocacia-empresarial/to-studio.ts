import type { StudioData, StudioElement, StudioSection } from "@/types/studio";
import type { AdvocaciaContent } from "./content";

/** Converte o Template 05 para StudioData (mesmo padrão dos Templates 01–04). */
let n = 0;
const id = (p: string) => `adv_${p}_${++n}`;
const el = (type: StudioElement["type"], content: any, styles: Record<string, any> = {}): StudioElement => ({ id: id(type), type, content, styles });
const sec = (type: string, order: number, styles: Record<string, any>, elements: StudioElement[]): StudioSection => ({ id: id(type), type, order, styles, elements });

export function advocaciaToStudioData(c: AdvocaciaContent): StudioData {
  n = 0;
  const t = c.theme;
  const center = { textAlign: "center" };
  const muted = { color: t.muted };
  const gold = { color: t.gold, letterSpacing: "0.2em", textTransform: "uppercase", fontSize: "0.8rem" };
  const list = (items: { title: string; text: string }[]) => items.flatMap((i) => [el("subtitle", { text: i.title }), el("paragraph", { text: i.text }, muted)]);
  let o = 0;
  const sections: StudioSection[] = [
    sec("header", o++, { backgroundColor: t.navyDeep, color: "#ffffff" }, [
      el("subtitle", { text: c.brand.name }, { color: "#ffffff" }),
      el("paragraph", { text: c.nav.map((x) => x.label).join(" · ") }, { color: "#cbd2dc" }),
    ]),
    sec("hero", o++, { paddingTop: "9rem", paddingBottom: "8rem", backgroundColor: t.navyDeep, color: "#ffffff" }, [
      el("subtitle", { text: c.hero.eyebrow }, gold),
      el("title", { text: c.hero.title }, { fontSize: "3.5rem", color: "#ffffff" }),
      el("paragraph", { text: c.hero.text }, { color: "#cbd2dc" }),
      el("button", { text: c.hero.primaryCta }, { backgroundColor: t.gold, color: t.navyDeep }),
      el("image", { url: c.hero.imageUrl, alt: c.hero.imageAlt }),
    ]),
    sec("about", o++, { backgroundColor: t.paper }, [
      el("subtitle", { text: c.about.eyebrow }, gold), el("title", { text: c.about.title }),
      el("paragraph", { text: c.about.history }), el("paragraph", { text: c.about.positioning }, muted),
      el("image", { url: c.about.imageUrl, alt: c.brand.name }), ...list(c.about.values),
    ]),
    sec("services", o++, { backgroundColor: t.surface }, [el("subtitle", { text: c.areas.eyebrow }, { ...gold, ...center }), el("title", { text: c.areas.title }, center), ...list(c.areas.items)]),
    sec("highlights", o++, { backgroundColor: t.navy, color: "#ffffff" }, [
      el("subtitle", { text: c.advisory.eyebrow }, gold), el("title", { text: c.advisory.title }, { color: "#ffffff" }),
      el("paragraph", { text: c.advisory.text }, { color: "#cbd2dc" }),
      ...c.advisory.points.flatMap((p) => [el("subtitle", { text: p.title }, { color: "#ffffff" }), el("paragraph", { text: p.text }, { color: "#cbd2dc" })]),
      el("paragraph", { text: c.advisory.note }, { color: "#9aa3b2", fontSize: "0.85rem" }),
    ]),
    sec("services", o++, { backgroundColor: t.paper }, [
      el("subtitle", { text: c.solutions.eyebrow }, { ...gold, ...center }), el("title", { text: c.solutions.title }, center),
      ...c.solutions.items.flatMap((s) => [el("subtitle", { text: s.title }), el("paragraph", { text: s.text }, muted), el("paragraph", { text: s.topics.join(" · ") }, muted)]),
    ]),
    sec("custom", o++, { backgroundColor: t.surface }, [
      el("subtitle", { text: c.method.eyebrow }, { ...gold, ...center }), el("title", { text: c.method.title }, center),
      ...c.method.steps.flatMap((s) => [el("subtitle", { text: `${s.number} — ${s.title}` }), el("paragraph", { text: s.text }, muted)]),
    ]),
    sec("highlights", o++, { backgroundColor: t.paper }, [el("subtitle", { text: c.differentials.eyebrow }, { ...gold, ...center }), el("title", { text: c.differentials.title }, center), ...list(c.differentials.items)]),
    sec("about", o++, { backgroundColor: t.surface }, [
      el("subtitle", { text: c.team.eyebrow }, { ...gold, ...center }), el("title", { text: c.team.title }, center),
      ...c.team.members.flatMap((m) => [el("image", { url: m.photoUrl, alt: m.name }), el("subtitle", { text: m.name }), el("paragraph", { text: `${m.specialty} · ${m.education} · ${m.oab}` }, muted)]),
      el("paragraph", { text: c.team.disclaimer }, { ...center, ...muted }),
    ]),
    sec("custom", o++, { backgroundColor: t.paper }, [
      el("subtitle", { text: c.insights.eyebrow }, { ...gold, ...center }), el("title", { text: c.insights.title }, center),
      ...c.insights.articles.flatMap((a) => [el("subtitle", { text: a.title }), el("paragraph", { text: `${a.category} · ${a.date} — ${a.excerpt}` }, muted)]),
      el("paragraph", { text: c.insights.disclaimer }, { ...center, ...muted }),
    ]),
    sec("faq", o++, { backgroundColor: t.surface }, [
      el("title", { text: c.faq.title }, center),
      ...c.faq.items.flatMap((f) => [el("subtitle", { text: f.question }), el("paragraph", { text: f.answer }, muted)]),
      el("paragraph", { text: c.faq.disclaimer }, { ...center, ...muted }),
    ]),
    sec("contact", o++, { backgroundColor: t.paper }, [
      el("title", { text: c.contact.title }), el("paragraph", { text: c.contact.text }, muted),
      el("form", { fields: ["Nome", "Empresa", "E-mail", "Telefone (opcional)", "Descrição da demanda"], submit: "Enviar mensagem" }),
      el("paragraph", { text: c.contact.privacyNotice }, { ...muted, fontSize: "0.85rem" }),
      el("contact", { text: `${c.contact.email} · ${c.contact.phone} · ${c.contact.address}` }),
    ]),
    sec("cta", o++, { paddingTop: "7rem", paddingBottom: "7rem", backgroundColor: t.navyDeep }, [
      el("title", { text: c.cta.title }, { ...center, color: "#ffffff" }),
      el("paragraph", { text: c.cta.text }, { ...center, color: "#cbd2dc" }),
      el("button", { text: c.cta.buttonLabel }, { backgroundColor: t.gold, color: t.navyDeep }),
    ]),
    sec("footer", o++, { backgroundColor: t.navyDeep, color: "#ffffff" }, [
      el("subtitle", { text: c.brand.name }), el("paragraph", { text: c.footer.description }),
      el("paragraph", { text: c.areas.items.map((a) => a.title).join(" · ") }, { color: "#9aa3b2" }),
      el("paragraph", { text: c.footer.professionalInfo }, { color: "#9aa3b2" }),
      el("contact", { text: `${c.contact.email} · ${c.contact.phone}` }),
    ]),
  ];
  return {
    design_system: {
      colors: { primary: t.navy, secondary: t.navyDeep, accent: t.gold, background: t.paper, surface: t.surface, border: t.line, text: t.ink, textSecondary: t.muted },
      typography: { headingFont: t.headingFont, bodyFont: t.bodyFont, headingWeight: "600", bodyWeight: "400" },
      buttons: { style: "solid", borderRadius: "2px", shadow: "none", size: "lg" },
      cards: { borderRadius: "4px", shadow: "sm", border: true },
    },
    sections,
  };
}
