/**
 * Orquestrador da NEXUSBUILD AI.
 *
 * Fluxo: autenticação → permissão → contexto (perfil + memória + histórico)
 * → modelo (streaming) → seleção/execução de ferramentas no servidor
 * → validação → resposta transmitida e persistida.
 *
 * O modelo decide o raciocínio e quais ferramentas usar; o servidor controla
 * permissões (RLS do próprio usuário) e a execução real.
 */
import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { buildSystemPrompt } from "@/lib/nexus/prompt";
import { callModel, resolveModel, type NexusChatMessage } from "@/lib/nexus/provider.server";
import { NEXUS_TOOLS, NEXUS_UNAVAILABLE_TOOLS, findTool, toolSchemas } from "@/lib/nexus/tools.server";

const bodySchema = z.object({
  conversation_id: z.string().uuid(),
  message: z.string().min(1).max(8000),
  web_research_requested: z.boolean().optional().default(false),
});

const MAX_TOOL_ROUNDS = 5;
const HISTORY_LIMIT = 24;

function sse(payload: unknown) {
  return `data: ${JSON.stringify(payload)}\n\n`;
}

export const Route = createFileRoute("/api/nexus/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const authHeader = request.headers.get("authorization") ?? "";
        const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
        if (!token || token.split(".").length !== 3) {
          return new Response("Unauthorized", { status: 401 });
        }

        const SUPABASE_URL = process.env["SUPABASE_URL"];
        const SUPABASE_PUBLISHABLE_KEY = process.env["SUPABASE_PUBLISHABLE_KEY"];
        if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
          return new Response("Backend indisponível", { status: 500 });
        }

        const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
          auth: { persistSession: false, autoRefreshToken: false },
          global: { headers: { apikey: SUPABASE_PUBLISHABLE_KEY, Authorization: `Bearer ${token}` } },
        });

        const { data: userData } = await supabase.auth.getUser(token);
        const user = userData?.user;
        if (!user) return new Response("Unauthorized", { status: 401 });

        const { data: roleRows } = await supabase.from("user_roles").select("role").eq("user_id", user.id);
        const roles = (roleRows ?? []).map((r: any) => r.role as string);
        if (!roles.includes("admin") && !roles.includes("criador")) {
          return new Response("Forbidden", { status: 403 });
        }

        let body: z.infer<typeof bodySchema>;
        try {
          body = bodySchema.parse(await request.json());
        } catch {
          return new Response("Requisição inválida", { status: 400 });
        }

        // Conversa precisa pertencer ao usuário (RLS garante, checamos para erro claro).
        const { data: conversation } = await supabase
          .from("nexusbuild_conversations")
          .select("id,context")
          .eq("id", body.conversation_id)
          .maybeSingle();
        if (!conversation) return new Response("Conversa não encontrada", { status: 404 });

        const [{ data: profile }, { data: memories }, { data: history }] = await Promise.all([
          supabase.from("profiles").select("full_name,nickname").eq("id", user.id).maybeSingle(),
          supabase
            .from("nexusbuild_memories")
            .select("kind,content")
            .eq("active", true)
            .order("relevance", { ascending: false })
            .order("created_at", { ascending: false })
            .limit(12),
          supabase
            .from("nexusbuild_messages")
            .select("role,content")
            .eq("conversation_id", body.conversation_id)
            .order("created_at", { ascending: true })
            .limit(HISTORY_LIMIT),
        ]);

        await supabase.from("nexusbuild_messages").insert({
          conversation_id: body.conversation_id,
          user_id: user.id,
          role: "user",
          content: body.message,
        });

        const system = buildSystemPrompt({
          userName: (profile as any)?.nickname || (profile as any)?.full_name || null,
          roles,
          memories: (memories ?? []) as any,
          availableTools: NEXUS_TOOLS.map((t) => `${t.name} [${t.category}] — ${t.description}`),
          unavailableTools: NEXUS_UNAVAILABLE_TOOLS,
          conversationObjective: ((conversation as any)?.context?.objective ?? null) as string | null,
          conversationTemplate: ((conversation as any)?.context?.template ?? null) as string | null,
        });

        const messages: NexusChatMessage[] = [
          { role: "system", content: system },
          ...((history ?? []) as any[])
            .filter((m) => m.role === "user" || m.role === "assistant")
            .map((m) => ({ role: m.role as "user" | "assistant", content: m.content as string })),
          {
            role: "user",
            content: body.web_research_requested
              ? `[INTENÇÃO EXPLÍCITA: PESQUISAR NA WEB. Use web_research antes de responder e apresente as fontes realmente consultadas.]\n\n${body.message}`
              : body.message,
          },
        ];

        const encoder = new TextEncoder();
        const toolsUsed: string[] = [];
        const sourcesUsed: Array<{ title: string; url: string; domain: string; consulted_at: string }> = [];

        const stream = new ReadableStream<Uint8Array>({
          async start(controller) {
            const send = (payload: unknown) => controller.enqueue(encoder.encode(sse(payload)));
            let full = "";

            try {
              for (let round = 0; round < MAX_TOOL_ROUNDS; round += 1) {
                const response = await callModel({ messages, tools: toolSchemas(), stream: true });

                if (!response.ok || !response.body) {
                  const status = response.status;
                  const message =
                    status === 429
                      ? "Limite de uso da IA atingido. Tente novamente em instantes."
                      : status === 402
                        ? "Créditos de IA esgotados no espaço de trabalho."
                        : `Falha ao falar com o modelo (status ${status}).`;
                  send({ type: "error", message });
                  break;
                }

                const reader = response.body.getReader();
                const decoder = new TextDecoder();
                let buffer = "";
                let roundText = "";
                const calls: Record<number, { id: string; name: string; args: string }> = {};

                while (true) {
                  const { done, value } = await reader.read();
                  if (done) break;
                  buffer += decoder.decode(value, { stream: true });
                  let nl: number;
                  while ((nl = buffer.indexOf("\n")) !== -1) {
                    const line = buffer.slice(0, nl).trim();
                    buffer = buffer.slice(nl + 1);
                    if (!line.startsWith("data:")) continue;
                    const data = line.slice(5).trim();
                    if (!data || data === "[DONE]") continue;
                    let parsed: any;
                    try {
                      parsed = JSON.parse(data);
                    } catch {
                      continue;
                    }
                    const delta = parsed?.choices?.[0]?.delta;
                    if (delta?.content) {
                      roundText += delta.content;
                      full += delta.content;
                      send({ type: "delta", text: delta.content });
                    }
                    for (const call of delta?.tool_calls ?? []) {
                      const idx = call.index ?? 0;
                      const acc = (calls[idx] ??= { id: "", name: "", args: "" });
                      if (call.id) acc.id = call.id;
                      if (call.function?.name) acc.name = call.function.name;
                      if (call.function?.arguments) acc.args += call.function.arguments;
                    }
                  }
                }

                const pending = Object.values(calls).filter((c) => c.name);
                if (pending.length === 0) break;

                messages.push({
                  role: "assistant",
                  content: roundText || null,
                  tool_calls: pending.map((c) => ({
                    id: c.id || c.name,
                    type: "function",
                    function: { name: c.name, arguments: c.args || "{}" },
                  })),
                });

                for (const call of pending) {
                  const startedAt = Date.now();
                  const tool = findTool(call.name);
                  send({ type: "tool", name: call.name });
                  let result: unknown;
                  let status: "OK" | "ERRO" | "INDISPONIVEL" = "OK";
                  try {
                    if (!tool) {
                      status = "INDISPONIVEL";
                      result = { unavailable: true, message: "Essa capacidade ainda não está disponível." };
                    } else {
                      const args = call.args ? JSON.parse(call.args) : {};
                      result = await tool.run(args, {
                        supabase,
                        userId: user.id,
                        roles,
                        conversationId: body.conversation_id,
                      });
                      toolsUsed.push(call.name);
                      const resultSources = (result as any)?.sources;
                      if (Array.isArray(resultSources)) {
                        for (const source of resultSources) {
                          if (source?.url && !sourcesUsed.some((item) => item.url === source.url)) {
                            sourcesUsed.push({
                              title: String(source.title ?? source.url),
                              url: String(source.url),
                              domain: String(source.domain ?? ""),
                              consulted_at: String(source.consulted_at ?? new Date().toISOString()),
                            });
                          }
                        }
                      }
                    }
                  } catch (error) {
                    status = "ERRO";
                    result = { error: error instanceof Error ? error.message : "Falha na ferramenta." };
                  }

                  messages.push({
                    role: "tool",
                    tool_call_id: call.id || call.name,
                    content: JSON.stringify(result).slice(0, 60000),
                  });

                  await supabase.from("nexusbuild_tool_runs").insert({
                    user_id: user.id,
                    conversation_id: body.conversation_id,
                    tool_name: call.name,
                    status,
                    duration_ms: Date.now() - startedAt,
                    summary: status === "OK" ? "execução concluída" : String((result as any)?.message ?? status),
                  });
                }
              }

              if (full.trim()) {
                await supabase.from("nexusbuild_messages").insert({
                  conversation_id: body.conversation_id,
                  user_id: user.id,
                  role: "assistant",
                  content: full,
                  metadata: {
                    engine: "lovable-ai-gateway",
                    model: resolveModel(),
                    tools: toolsUsed,
                    sources: sourcesUsed,
                  },
                });
                await supabase
                  .from("nexusbuild_conversations")
                  .update({ updated_at: new Date().toISOString() })
                  .eq("id", body.conversation_id);
              }

              send({ type: "done" });
            } catch (error) {
              console.error("[NEXUSBUILD]", error);
              send({
                type: "error",
                message:
                  error instanceof Error && error.message === "NEXUS_NO_MODEL_KEY"
                    ? "O modelo de IA não está configurado neste ambiente."
                    : "Ocorreu uma falha ao gerar a resposta.",
              });
            } finally {
              controller.close();
            }
          },
        });

        return new Response(stream, {
          headers: {
            "content-type": "text/event-stream; charset=utf-8",
            "cache-control": "no-cache, no-transform",
            connection: "keep-alive",
          },
        });
      },
    },
  },
});
