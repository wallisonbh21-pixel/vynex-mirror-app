import { describe, expect, it } from "vitest";
import { isSafeImageUrl, matchesImageSignature, validateSiteImageFile } from "../site-images";
import { activeEffects, effectLayers, hasActiveEffects } from "../effects";

const hex = (s: string) => Uint8Array.from(s.match(/../g)!.map((h) => parseInt(h, 16)));

describe("imagens do site", () => {
  it("recusa arquivo acima de 5 MB", () => {
    expect(validateSiteImageFile({ type: "image/png", size: 5 * 1024 * 1024 + 1 }).ok).toBe(false);
  });
  it("recusa formato fora de JPG/PNG/WebP/GIF", () => {
    expect(validateSiteImageFile({ type: "image/svg+xml", size: 100 }).ok).toBe(false);
  });
  it("aceita PNG real e recusa texto renomeado para .png", () => {
    expect(matchesImageSignature(hex("89504e470d0a1a0a0000000d49484452"), "png")).toBe(true);
    expect(matchesImageSignature(hex("3c68746d6c3e0000000000000000000000"), "png")).toBe(false);
  });
  it("bloqueia javascript: e aceita imagem enviada ao projeto", () => {
    expect(isSafeImageUrl("javascript:alert(1)")).toBe(false);
    expect(isSafeImageUrl(`/api/public/site-image/11111111-1111-1111-1111-111111111111/${"a".repeat(64)}.png`)).toBe(true);
  });
});

describe("efeitos visuais", () => {
  it("nenhum efeito sem escolha explícita", () => {
    expect(hasActiveEffects(undefined)).toBe(false);
    expect(hasActiveEffects({ float: { enabled: false, intensity: 5, duration: 5 } })).toBe(false);
  });
  it("limita valores fora da faixa", () => {
    expect(activeEffects({ float: { enabled: true, intensity: 99, duration: 0 } }).float).toMatchObject({ intensity: 10, duration: 2 });
  });
  it("entrada lateral pela direita usa deslocamento positivo", () => {
    expect(effectLayers({ slideIn: { enabled: true, intensity: 5, duration: 1, direction: "right" } }).entranceStyle["--fx-slide-x"]).toBe("60px");
  });
});
