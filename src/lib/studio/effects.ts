/** Efeitos visuais opcionais do Studio. Nada é ativado sem escolha explícita do Criador. */

export type EffectKey =
  | "float" | "shadow" | "reveal" | "hoverZoom" | "fadeIn"
  | "slideIn" | "parallax" | "glass" | "hoverGlow" | "loop";

export interface EffectConfig {
  enabled: boolean;
  /** 1–10 */
  intensity: number;
  /** segundos */
  duration: number;
  direction?: "left" | "right";
}

export type StudioEffects = Partial<Record<EffectKey, EffectConfig>>;

type Meta = {
  key: EffectKey;
  label: string;
  description: string;
  intensityLabel: string;
  duration?: [number, number];
  direction?: boolean;
  defaults: EffectConfig;
};

export const EFFECTS: Meta[] = [
  { key: "float", label: "Flutuação suave", description: "Movimento vertical contínuo.", intensityLabel: "Distância", duration: [2, 10], defaults: { enabled: true, intensity: 4, duration: 5 } },
  { key: "shadow", label: "Sombra elegante", description: "Sombra com desfoque e distância.", intensityLabel: "Intensidade", defaults: { enabled: true, intensity: 5, duration: 0 } },
  { key: "reveal", label: "Aparecer ao rolar", description: "Surge ao entrar na tela.", intensityLabel: "Distância", duration: [0.3, 2], defaults: { enabled: true, intensity: 5, duration: 0.8 } },
  { key: "hoverZoom", label: "Zoom no hover", description: "Aumenta ao passar o mouse ou tocar.", intensityLabel: "Zoom", duration: [0.2, 1.5], defaults: { enabled: true, intensity: 4, duration: 0.5 } },
  { key: "fadeIn", label: "Surgimento suave", description: "Transição gradual de opacidade.", intensityLabel: "Atraso", duration: [0.3, 3], defaults: { enabled: true, intensity: 1, duration: 1.2 } },
  { key: "slideIn", label: "Entrada lateral", description: "Entra pela esquerda ou direita.", intensityLabel: "Distância", duration: [0.3, 2], direction: true, defaults: { enabled: true, intensity: 5, duration: 0.8, direction: "left" } },
  { key: "parallax", label: "Parallax suave", description: "Move-se com a rolagem (desligado no celular).", intensityLabel: "Intensidade", defaults: { enabled: true, intensity: 3, duration: 0 } },
  { key: "glass", label: "Efeito vidro", description: "Transparência com desfoque de fundo.", intensityLabel: "Desfoque", defaults: { enabled: true, intensity: 5, duration: 0 } },
  { key: "hoverGlow", label: "Brilho no hover", description: "Realce discreto ao passar o cursor ou tocar.", intensityLabel: "Brilho", duration: [0.2, 1.5], defaults: { enabled: true, intensity: 4, duration: 0.4 } },
  { key: "loop", label: "Movimento contínuo", description: "Pulsação lenta e repetida.", intensityLabel: "Amplitude", duration: [2, 10], defaults: { enabled: true, intensity: 3, duration: 4 } },
];

const clamp = (n: unknown, min: number, max: number, fallback: number) => {
  const v = typeof n === "number" && Number.isFinite(n) ? n : fallback;
  return Math.min(max, Math.max(min, v));
};

/** Normaliza o que vem do banco; ignora chaves e valores desconhecidos. */
export function activeEffects(effects: unknown): Partial<Record<EffectKey, EffectConfig>> {
  const out: Partial<Record<EffectKey, EffectConfig>> = {};
  if (!effects || typeof effects !== "object") return out;
  for (const meta of EFFECTS) {
    const raw = (effects as Record<string, any>)[meta.key];
    if (!raw || raw.enabled !== true) continue;
    const range = meta.duration ?? [0, 0];
    out[meta.key] = {
      enabled: true,
      intensity: clamp(raw.intensity, 1, 10, meta.defaults.intensity),
      duration: meta.duration ? clamp(raw.duration, range[0], range[1], meta.defaults.duration) : 0,
      ...(meta.direction ? { direction: raw.direction === "right" ? "right" : "left" } : {}),
    };
  }
  return out;
}

export function hasActiveEffects(effects: unknown) {
  return Object.keys(activeEffects(effects)).length > 0;
}

/** Estilos/classes por camada: entrada (fora), parallax (meio), visual (dentro). */
export function effectLayers(effects: unknown) {
  const fx = activeEffects(effects);
  const entrance: string[] = [];
  const entranceStyle: Record<string, string> = {};
  if (fx.reveal) {
    entrance.push("fx-reveal");
    entranceStyle["--fx-rev-dist"] = `${fx.reveal.intensity * 8}px`;
    entranceStyle["--fx-rev-dur"] = `${fx.reveal.duration}s`;
  }
  if (fx.slideIn) {
    entrance.push("fx-slide");
    const d = fx.slideIn.intensity * 12 * (fx.slideIn.direction === "right" ? 1 : -1);
    entranceStyle["--fx-slide-x"] = `${d}px`;
    entranceStyle["--fx-slide-dur"] = `${fx.slideIn.duration}s`;
  }
  if (fx.fadeIn) {
    entrance.push("fx-fade");
    entranceStyle["--fx-fade-dur"] = `${fx.fadeIn.duration}s`;
    entranceStyle["--fx-fade-delay"] = `${(fx.fadeIn.intensity - 1) * 0.1}s`;
  }

  const visual: string[] = [];
  const visualStyle: Record<string, string> = {};
  if (fx.float) {
    visual.push("fx-float");
    visualStyle["--fx-float-dist"] = `${fx.float.intensity * 2}px`;
    visualStyle["--fx-float-dur"] = `${fx.float.duration}s`;
  }
  if (fx.loop) {
    visual.push("fx-loop");
    visualStyle["--fx-loop-scale"] = String(1 + fx.loop.intensity * 0.006);
    visualStyle["--fx-loop-dur"] = `${fx.loop.duration}s`;
  }
  if (fx.hoverZoom) {
    visual.push("fx-zoom");
    visualStyle["--fx-zoom"] = String(1 + fx.hoverZoom.intensity * 0.015);
    visualStyle["--fx-zoom-dur"] = `${fx.hoverZoom.duration}s`;
  }
  if (fx.hoverGlow) {
    visual.push("fx-glow");
    visualStyle["--fx-glow"] = String(1 + fx.hoverGlow.intensity * 0.015);
    visualStyle["--fx-glow-size"] = `${fx.hoverGlow.intensity * 3}px`;
    visualStyle["--fx-glow-dur"] = `${fx.hoverGlow.duration}s`;
  }
  if (fx.glass) {
    visual.push("fx-glass");
    visualStyle["--fx-glass-blur"] = `${fx.glass.intensity * 2}px`;
  }
  if (fx.shadow) {
    const i = fx.shadow.intensity;
    visualStyle["boxShadow"] = `0 ${i * 2}px ${i * 5}px rgba(0,0,0,${(0.06 + i * 0.025).toFixed(3)})`;
  }

  return {
    fx,
    entrance,
    entranceStyle,
    parallax: fx.parallax ? fx.parallax.intensity * 0.03 : 0,
    visual,
    visualStyle,
  };
}
