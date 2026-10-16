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
import { classifyEffort } from "@/lib/nexus/core";
import { loadActiveContext, resolveActiveProjectId } from "@/lib/nexus/core/context.server";

import { callModel, resolveModel, type NexusChatMessage } from "@/lib/nexus/provider.server";
import { NEXUS_TOOLS, NEXUS_UNAVAILABLE_TOOLS, findTool, toolSchemas } from "@/lib/nexus/tools.server";

const bodySchema = z.object({
  conversation_id: z.string().uuid(),
  message: z.string().min(1).max(8000),
  web_research_requested: z.boolean().optional().default(false),
});

const MAX_TOOL_ROUNDS = 10;
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

        const { getBackendEnv } = await import("@/lib/backend-env.server");
        const { url: SUPABASE_URL, key: SUPABASE_PUBLISHABLE_KEY } = getBackendEnv();
        if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
          console.error("[nexus/chat] backend env ausente");
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

        const conversationContext = ((conversation as any)?.context ?? null) as Record<string, unknown> | null;
        const activeProjectId = await resolveActiveProjectId(supabase, body.conversation_id, conversationContext);

        // Memória: quando há projeto ativo, prioriza memória global + a do próprio projeto.
        const memoriesQuery = supabase
          .from("nexusbuild_memories")
          .select("kind,content,project_id")
          .eq("active", true);
        if (activeProjectId) memoriesQuery.or(`project_id.is.null,project_id.eq.${activeProjectId}`);

        const [{ data: profile }, { data: memories }, { data: history }, activeContext] = await Promise.all([
          supabase.from("profiles").select("full_name,nickname").eq("id", user.id).maybeSingle(),
          memoriesQuery.order("relevance", { ascending: false }).order("created_at", { ascending: false }).limit(12),
          // Mais recentes primeiro; a ordem cronológica é restaurada abaixo.
          supabase
            .from("nexusbuild_messages")
            .select("role,content,created_at")
            .eq("conversation_id", body.conversation_id)
            .order("created_at", { ascending: false })
            .limit(HISTORY_LIMIT),
          loadActiveContext(supabase, body.conversation_id, activeProjectId),
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
          conversationObjective: (conversationContext?.["objective"] ?? null) as string | null,
          conversationTemplate: (conversationContext?.["template"] ?? null) as string | null,
          activeContext,
          effort: classifyEffort(body.message),
        });


        const messages: NexusChatMessage[] = [
          { role: "system", content: system },
          ...((history ?? []) as any[])
            .slice()
            .reverse()
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
        const visualsCreated: Array<Record<string, unknown>> = [];
        let publishedSite: Record<string, unknown> | null = null;
        const origin = request.headers.get("origin") || new URL(request.url).origin;

        const stream = new ReadableStream<Uint8Array>({
          async start(controller) {
            const send = (payload: unknown) => controller.enqueue(encoder.encode(sse(payload)));
            let full = "";
            let exhausted = true;

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
                  exhausted = false;
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
                if (pending.length === 0) {
                  exhausted = false;
                  break;
                }

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
                      result = {
                        unavailable: true,
                        message: `A ferramenta "${call.name}" não existe. Use somente: ${NEXUS_TOOLS.map((t) => t.name).join(", ")}.`,
                      };
                    } else {
                      const args = call.args ? JSON.parse(call.args) : {};
                      result = await tool.run(args, {
                        supabase,
                        userId: user.id,
                        roles,
                        conversationId: body.conversation_id,
                        origin,
                      });
                      const site = (result as any)?.published === true ? (result as any).site : null;
                      if (site) {
                        publishedSite = site;
                        send({ type: "site", site });
                      }
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
                      const resultVisuals = (result as any)?.visual_assets;
                      if (Array.isArray(resultVisuals)) {
                        for (const asset of resultVisuals) {
                          if (asset?.id && !visualsCreated.some((item) => item["id"] === asset.id)) {
                            visualsCreated.push(asset as Record<string, unknown>);
                          }
                        }
                        if (resultVisuals.length > 0) send({ type: "visual", assets: resultVisuals });
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

              if (exhausted) {
                const note =
                  "\n\n**AGUARDANDO**\n\nAs etapas executadas até aqui já estão salvas. Ainda faltam etapas para concluir; responda \"continuar\" para eu seguir de onde parei, sem duplicar nada.";
                full += note;
                send({ type: "delta", text: note });
              }

              if (full.trim() || publishedSite) {
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
                    visuals: visualsCreated,
                    site: publishedSite,
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
                    ? "A NEXUSBUILD AI está indisponível neste ambiente (chave LOVABLE_API_KEY não configurada no servidor). Você ainda pode usar os modelos: em Modelos, clique em \"Editar site\" para editar e publicar manualmente."
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
