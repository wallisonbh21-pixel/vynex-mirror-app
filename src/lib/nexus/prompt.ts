/**
 * NEXUSBUILD AI — montagem do system prompt.
 *
 * Este arquivo apenas COMPÕE os blocos do NEXUSBUILD CORE (src/lib/nexus/core).
 * Nenhuma regra de identidade, personalidade ou segurança deve ser escrita aqui:
 * cada responsabilidade vive em seu próprio módulo do core.
 */
import {
  NEXUS_APPROVAL,
  NEXUS_AUTONOMY,
  NEXUS_BUILD_FLOW,
  NEXUS_CONTEXT_RULES,
  NEXUS_CREATIVITY,
  NEXUS_GAPS,
  NEXUS_HIERARCHY,
  NEXUS_IDENTITY,
  NEXUS_MEMORY_RULES,
  NEXUS_PERSONALITY,
  NEXUS_PRINCIPLES,
  NEXUS_REAL_LIMITS,
  NEXUS_REASONING,
  NEXUS_SAFETY,
  NEXUS_SELF_REVIEW,
  NEXUS_SITE_LANGUAGE,
  NEXUS_TOOL_RULES,
  NEXUS_VISUAL_CONTEXT_RULES,
  effortBlock,
  renderActiveContext,
  renderMemories,
  type NexusActiveContext,
  type NexusEffort,
  type NexusMemoryItem,
} from "./core";

export { NEXUS_IDENTITY } from "./core";

export interface NexusPromptContext {
  userName?: string | null;
  roles: string[];
  memories: NexusMemoryItem[];
  availableTools: string[];
  unavailableTools: { name: string; reason: string }[];
  /** Objetivo declarado da conversa (ex.: CRIAR_SITE), vindo do contexto salvo. */
  conversationObjective?: string | null;
  conversationTemplate?: string | null;
  /** Projeto ativo e imagens recentes da conversa (ATA #021). */
  activeContext?: NexusActiveContext;
  /** Esforço estimado da mensagem atual. */
  effort?: NexusEffort;
}

const OBJECTIVE_LABELS: Record<string, string> = {
  CRIAR_SITE: "MODE: website_creation — o objetivo desta conversa é criar um site. Siga o fluxo de criação.",
  CRIAR_APLICATIVO:
    "MODE: app_planning — o objetivo desta conversa é um aplicativo. O App Builder ainda não existe: conduza o levantamento e o planejamento e deixe isso claro.",
  CRIAR_COM_TEMPLATE:
    "MODE: template_start — o usuário escolheu um modelo como ponto de partida. Ainda não há template real cadastrado: confirme as expectativas e planeje.",
};

export function buildSystemPrompt(ctx: NexusPromptContext): string {
  const parts = [
    // 1. Quem é e como se comporta
    NEXUS_IDENTITY,
    NEXUS_PERSONALITY,
    NEXUS_PRINCIPLES,
    // 2. O que vence o quê
    NEXUS_HIERARCHY,
    NEXUS_SAFETY,
    NEXUS_AUTONOMY,
    NEXUS_APPROVAL,
    // 3. Como pensa e cria
    NEXUS_REASONING,
    NEXUS_CREATIVITY,
    NEXUS_GAPS,
    NEXUS_SELF_REVIEW,
    // 4. Como usa contexto e ferramentas
    NEXUS_CONTEXT_RULES,
    NEXUS_VISUAL_CONTEXT_RULES,
    NEXUS_MEMORY_RULES,
    NEXUS_TOOL_RULES,
    // 5. Operação real do ScaleNexus
    NEXUS_BUILD_FLOW,
    NEXUS_SITE_LANGUAGE,
    NEXUS_REAL_LIMITS,
  ];

  if (ctx.effort) parts.push(effortBlock(ctx.effort));

  const objective = ctx.conversationObjective ? OBJECTIVE_LABELS[ctx.conversationObjective] : null;
  if (objective) {
    parts.push(
      `OBJETIVO DESTA CONVERSA\n${objective}${ctx.conversationTemplate ? `\nModelo escolhido: ${ctx.conversationTemplate}.` : ""}`,
    );
  }

  parts.push(
    `CONTEXTO DO USUÁRIO
Nome: ${ctx.userName?.trim() || "não informado"} (use o nome naturalmente, sem repetir em excesso; nunca invente nomes)
Papéis no ScaleNexus: ${ctx.roles.join(", ") || "não informado"}`,
  );

  if (ctx.activeContext) parts.push(...renderActiveContext(ctx.activeContext));

  parts.push(...renderMemories(ctx.memories, ctx.activeContext?.project?.id ?? null));

  parts.push(
    `FERRAMENTAS DISPONÍVEIS AGORA
${ctx.availableTools.map((t) => `- ${t}`).join("\n")}`,
  );

  if (ctx.unavailableTools.length > 0) {
    parts.push(
      `CAPACIDADES AINDA NÃO DISPONÍVEIS (nunca simule; informe o usuário se ele pedir)
${ctx.unavailableTools.map((t) => `- ${t.name}: ${t.reason}`).join("\n")}`,
    );
  }

  return parts.join("\n\n");
}
