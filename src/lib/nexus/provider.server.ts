/**
 * Camada de provedor de modelo da NEXUSBUILD AI.
 * Isola o gateway de IA para permitir trocar de modelo/provedor sem tocar
 * no orquestrador, nas ferramentas ou na interface.
 */

export interface NexusChatMessage {
  role: "system" | "user" | "assistant" | "tool";
  content: string | null;
  tool_calls?: unknown;
  tool_call_id?: string;
}

export interface NexusToolSchema {
  type: "function";
  function: { name: string; description: string; parameters: Record<string, unknown> };
}

export const NEXUS_MODELS = {
  /** Raciocínio e uso de ferramentas (padrão). */
  reasoning: "google/gemini-2.5-pro",
  /** Respostas rápidas e de baixo custo. */
  fast: "google/gemini-2.5-flash",
} as const;

export function resolveModel(): string {
  return process.env["NEXUS_AI_MODEL"] || NEXUS_MODELS.reasoning;
}

const GATEWAY_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";

/** Chamada ao gateway. `stream: true` devolve a resposta SSE bruta do provedor. */
export async function callModel(options: {
  messages: NexusChatMessage[];
  tools?: NexusToolSchema[];
  stream: boolean;
  model?: string;
}): Promise<Response> {
  const apiKey = process.env["LOVABLE_API_KEY"];
  if (!apiKey) throw new Error("NEXUS_NO_MODEL_KEY");

  return fetch(GATEWAY_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: options.model || resolveModel(),
      messages: options.messages,
      ...(options.tools && options.tools.length > 0 ? { tools: options.tools } : {}),
      stream: options.stream,
    }),
  });
}
