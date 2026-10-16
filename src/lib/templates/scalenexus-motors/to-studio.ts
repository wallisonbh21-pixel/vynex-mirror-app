import type { StudioData, StudioElement, StudioSection } from "@/types/studio";
import { formatBRL, formatKm, LABELS, vehicleTitle, type MotorsContent } from "./content";

/**
 * Converte o Template 06 para StudioData (mesmo contrato dos Templates 01–05).
 * Identificadores de seção/elemento são estáveis e derivados das chaves do
 * conteúdo (ex.: id do veículo), nunca do texto visível.
 */
export function motorsToStudioData(c: MotorsContent): StudioData {
  const t = c.theme;
  const el = (id: string, type: StudioElement["type"], content: any, styles: Record<string, any> = {}): StudioElement => ({ id: `mot_${id}`, type, content, styles });
  const sections: StudioSection[] = [];
  const sec = (key: string, type: string, styles: Record<string, any>, elements: StudioElement[]) =>
    sections.push({ id: `mot_${key}`, type, order: sections.length, styles: { backgroundColor: t.background, color: t.text, ...styles }, elements });
  const muted = { color: t.muted };
  const accent = { color: t.accent, textTransform: "uppercase", letterSpacing: "0.18em", fontSize: "0.8rem" };

  sec("header", "header", { backgroundColor: t.background }, [
    el("header_brand", "subtitle", { text: c.store.name }),
    el("header_cta", "button", { text: "Fale conosco", href: `https://wa.me/${c.store.whatsapp}` }, { backgroundColor: t.accent, color: "#ffffff" }),
  ]);
  sec("hero", "hero", { paddingTop: "8rem", paddingBottom: "8rem" }, [
    el("hero_eyebrow", "subtitle", { text: c.hero.eyebrow }, accent),
    el("hero_title", "title", { text: c.hero.title }, { fontSize: "3.75rem", fontWeight: "800" }),
    el("hero_text", "paragraph", { text: c.hero.text }, muted),
    el("hero_cta", "button", { text: c.hero.primaryCta }, { backgroundColor: t.accent, color: "#ffffff" }),
    el("hero_image", "image", { url: c.hero.imageUrl, alt: "Veículo em destaque" }),
  ]);
  sec("featured", "services", { backgroundColor: t.surface }, [
    el("featured_title", "title", { text: c.featured.title }),
    el("featured_text", "paragraph", { text: c.featured.text }, muted),
  ]);
  for (const v of c.vehicles.filter((x) => x?.id)) {
    sec(`vehicle_${v.id}`, "vehicle", { backgroundColor: t.surface }, [
      el(`vehicle_${v.id}_photo`, "image", { url: v.photos?.[0] ?? "", alt: vehicleTitle(v) }),
      el(`vehicle_${v.id}_title`, "subtitle", { text: `${vehicleTitle(v)} ${v.version}`.trim() }),
      el(`vehicle_${v.id}_price`, "title", { text: formatBRL(v.price) }, { color: t.accent, fontSize: "1.75rem" }),
      el(`vehicle_${v.id}_specs`, "paragraph", { text: `${v.year} · ${formatKm(v.mileageKm)} · ${LABELS.fuel[v.fuel] ?? ""} · ${LABELS.transmission[v.transmission] ?? ""}` }, muted),
      el(`vehicle_${v.id}_desc`, "paragraph", { text: v.description }, muted),
      el(`vehicle_${v.id}_cta`, "button", { text: "Consultar pelo WhatsApp", href: `https://wa.me/${c.store.whatsapp}` }, { backgroundColor: t.accent, color: "#ffffff" }),
    ]);
  }
  sec("offers", "highlights", {}, [
    el("offers_title", "title", { text: c.offers.title }),
    el("offers_text", "paragraph", { text: c.offers.text }, muted),
    el("offers_disclaimer", "paragraph", { text: c.offers.disclaimer }, { ...muted, fontSize: "0.8rem" }),
  ]);
  sec("differentials", "features", { backgroundColor: t.surface }, [
    el("differentials_title", "title", { text: c.differentials.title }, { textAlign: "center" }),
    ...c.differentials.items.flatMap((d) => [el(`diff_${d.id}_title`, "subtitle", { text: d.title }), el(`diff_${d.id}_text`, "paragraph", { text: d.text }, muted)]),
  ]);
  sec("tradein", "cta", { backgroundColor: t.accent }, [
    el("tradein_title", "title", { text: c.tradeIn.title }, { color: "#ffffff" }),
    el("tradein_text", "paragraph", { text: c.tradeIn.text }, { color: "#ffffff" }),
    el("tradein_cta", "button", { text: c.tradeIn.cta }, { backgroundColor: "#ffffff", color: t.accent }),
  ]);
  if (c.testimonials.items.length) {
    sec("testimonials", "testimonials", {}, [
      el("testimonials_title", "title", { text: c.testimonials.title }),
      ...c.testimonials.items.map((x) => el(`testimonial_${x.id}`, "testimonial", { text: x.text, author: x.name })),
    ]);
  }
  sec("contact", "contact", { backgroundColor: t.surface }, [
    el("contact_title", "title", { text: c.contact.title }),
    el("contact_text", "paragraph", { text: c.contact.text }, muted),
    el("contact_info", "contact", { phone: c.store.phone, whatsapp: c.store.whatsapp, email: c.store.email, address: `${c.store.address}, ${c.store.city}`, text: c.store.hours.join(" · ") }),
  ]);
  sec("footer", "footer", { backgroundColor: "#000000" }, [
    el("footer_brand", "subtitle", { text: c.store.name }),
    el("footer_legal", "paragraph", { text: c.footer.legal }, { ...muted, fontSize: "0.8rem" }),
  ]);

  return {
    design_system: {
      colors: { primary: t.accent, secondary: t.surface, accent: t.accent, background: t.background, surface: t.surface, border: t.line, text: t.text, textSecondary: t.muted },
      typography: { headingFont: t.headingFont, bodyFont: t.bodyFont, headingWeight: "800", bodyWeight: "400" },
      buttons: { style: "solid", borderRadius: "0.5rem", shadow: "md", size: "lg" },
      cards: { borderRadius: "0.75rem", shadow: "lg", border: true },
    },
    sections,
  };
}
