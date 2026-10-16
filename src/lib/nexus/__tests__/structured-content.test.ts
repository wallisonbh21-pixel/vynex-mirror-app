import { describe, expect, test } from "vitest";
import { validateBuildPlan } from "../build-plan";
import { applyItems, applyVehicles, validateItemsParams, DEMO_LABEL } from "../structured-content";
import { motorsToStudioData } from "@/lib/templates/scalenexus-motors/to-studio";
import { MOTORS_DEFAULT_CONTENT } from "@/lib/templates/scalenexus-motors/content";

const car = { id: "onix-2022", brand: "Chevrolet", model: "Onix", year: 2022, price: 75000, fuel: "flex", transmission: "manual", demo: false };

describe("SET_ITEMS", () => {
  test("FAQ sem resposta é recusado", () => {
    expect(validateItemsParams({ section_id: "s1", kind: "faq", demo: false, items: [{ title: "Pergunta?" }] }).length).toBeGreaterThan(0);
  });
  test("depoimentos demonstrativos são recusados", () => {
    expect(validateItemsParams({ section_id: "s1", kind: "testimonials", demo: true, items: [{ title: "x", text: "ótimo", author: "Ana" }] }).join()).toContain("não podem ser demonstrativos");
  });
  test("galeria exige https", () => {
    expect(validateItemsParams({ section_id: "s1", kind: "gallery", demo: true, items: [{ image_url: "http://x.com/a.jpg" }] }).length).toBe(1);
  });
  test("aplica itens, remove contêiner vazio e é idempotente", () => {
    const sec: any = { id: "s1", type: "services", order: 0, styles: {}, elements: [{ id: "t", type: "title", content: { text: "O Que Fazemos" }, styles: {} }, { id: "c", type: "container", content: {}, styles: {} }] };
    const params = { kind: "products" as const, demo: true, items: [{ title: "Lavagem", price: 50 }, { title: "Polimento", price: null }] };
    applyItems(sec, params);
    applyItems(sec, params);
    expect(sec.elements.some((e: any) => e.type === "container")).toBe(false);
    expect(sec.elements.filter((e: any) => e.type === "subtitle").length).toBe(2);
    expect(sec.elements.find((e: any) => e.id.endsWith("02_price")).content.text).toBe("Consulte");
    expect(sec.elements.at(-1).content.text).toBe(DEMO_LABEL);
  });
});

describe("SET_VEHICLES (Template 06)", () => {
  test("veículo sem câmbio válido é recusado", () => {
    expect(validateBuildPlan([{ type: "SET_VEHICLES", params: { vehicles: [{ ...car, transmission: "x" }] } }], 10).valid).toBe(false);
  });
  test("demo é obrigatório", () => {
    const { demo, ...noDemo } = car;
    expect(validateBuildPlan([{ type: "SET_VEHICLES", params: { vehicles: [noDemo] } }], 10).valid).toBe(false);
  });
  test("substitui todo o estoque após a seção de destaques", () => {
    const plan = validateBuildPlan([{ type: "SET_VEHICLES", params: { vehicles: [car, { ...car, id: "cg-160", brand: "Honda", model: "CG 160", type: "moto", price: null, demo: true }] } }], 10);
    expect(plan.valid).toBe(true);
    const base = motorsToStudioData(MOTORS_DEFAULT_CONTENT).sections;
    const out = applyVehicles(base, plan.operations[0]!.params.vehicles);
    const v = out.filter((s) => s.id.startsWith("mot_vehicle_"));
    expect(v.map((s) => s.id)).toEqual(["mot_vehicle_onix-2022", "mot_vehicle_cg-160"]);
    expect(out[out.findIndex((s) => s.id === "mot_featured") + 1]!.id).toBe("mot_vehicle_onix-2022");
    expect(v[0]!.elements.find((e) => e.id.endsWith("_price"))!.content.text).toContain("75.000");
    expect(v[1]!.elements.find((e) => e.id.endsWith("_price"))!.content.text).toBe("Consulte");
    expect(v[1]!.elements.find((e) => e.id.endsWith("_desc"))!.content.text).toContain("demonstrativo");
  });
  test("recusa projeto que não é Motors", () => {
    expect(() => applyVehicles([{ id: "a", type: "hero", order: 0, styles: {}, elements: [] }], [])).toThrow();
  });
});
