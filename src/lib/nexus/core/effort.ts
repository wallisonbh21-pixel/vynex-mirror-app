/**
 * NEXUSBUILD CORE — EFFORT BUDGET
 * Classificação aproximada de esforço para calibrar profundidade, contexto,
 * quantidade de ferramentas e nível de revisão. Não é um limite rígido: nunca
 * impede uma tarefa legítima, apenas evita esforço e custo desnecessários.
 */
export type NexusEffort = "LOW" | "MEDIUM" | "HIGH";

const HIGH_SIGNALS = [
  "construa",
  "construir",
  "crie o site",
  "criar o site",
  "monte",
  "montar",
  "loja",
  "e-commerce",
  "projeto completo",
  "planeje tudo",
  "melhor caminho",
  "analise meu projeto",
  "análise completa",
  "documentos do projeto",
  "revisão profunda",
];

const MEDIUM_SIGNALS = [
  "planeje",
  "planejamento",
  "briefing",
  "estratégia",
  "pesquise",
  "pesquisa",
  "analise",
  "análise",
  "identidade visual",
  "logo",
  "banner",
  "imagem",
  "proposta",
  "estrutura",
  "alternativa",
  "melhore",
  "sugira",
];

/** Heurística barata e determinística; o modelo pode subir o nível se o contexto exigir. */
export function classifyEffort(message: string): NexusEffort {
  const text = message.toLowerCase();
  if (HIGH_SIGNALS.some((s) => text.includes(s))) return "HIGH";
  if (message.length > 600) return "HIGH";
  if (MEDIUM_SIGNALS.some((s) => text.includes(s))) return "MEDIUM";
  if (message.length > 220) return "MEDIUM";
  return "LOW";
}

const EFFORT_GUIDE: Record<NexusEffort, string> = {
  LOW: `Esforço estimado: LOW. Responda de forma direta e curta. Evite ferramentas desnecessárias,
evite pesquisa web e use revisão leve. Não transforme isso em processo.`,
  MEDIUM: `Esforço estimado: MEDIUM. Traga estrutura e raciocínio, use as ferramentas realmente
necessárias (contexto do projeto, arquivos, pesquisa quando o assunto exigir atualidade) e faça
revisão proporcional antes de entregar.`,
  HIGH: `Esforço estimado: HIGH. Trabalhe pelo ciclo do projeto, use o contexto relevante e as
ferramentas necessárias em sequência, apresente plano antes de executar e faça revisão profunda.
Ainda assim, não faça chamadas extras apenas para parecer mais completa.`,
};

export function effortBlock(effort: NexusEffort): string {
  return `ORÇAMENTO DE ESFORÇO\n${EFFORT_GUIDE[effort]}`;
}
