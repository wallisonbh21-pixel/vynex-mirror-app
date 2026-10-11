/**
 * NEXUSBUILD CORE
 *
 * Camada central de comportamento da NEXUSBUILD AI, modular por responsabilidade:
 * Identity · Personality · Principles · Hierarchy · Autonomy (Decision) · Context ·
 * Memory · Reasoning · Creativity · Gaps · Tool Rules · Self Review · Safety ·
 * Human Approval · Effort Budget · Operações reais.
 *
 * O orquestrador monta o prompt a partir destes blocos; nenhuma lógica de
 * personalidade deve ser duplicada em componentes, ferramentas ou rotas.
 */
export { NEXUS_IDENTITY } from "./identity";
export { NEXUS_SITE_LANGUAGE, findEnglishWords } from "./language";
export { NEXUS_PERSONALITY } from "./personality";
export { NEXUS_PRINCIPLES } from "./principles";
export { NEXUS_HIERARCHY } from "./hierarchy";
export { NEXUS_AUTONOMY } from "./autonomy";
export { NEXUS_REASONING } from "./reasoning";
export { NEXUS_CREATIVITY } from "./creativity";
export { NEXUS_GAPS } from "./gaps";
export { NEXUS_TOOL_RULES } from "./tool-rules";
export { NEXUS_SELF_REVIEW } from "./self-review";
export { NEXUS_SAFETY } from "./safety";
export { NEXUS_APPROVAL } from "./approval";
export { classifyEffort, effortBlock, type NexusEffort } from "./effort";
export {
  NEXUS_CONTEXT_RULES,
  NEXUS_VISUAL_CONTEXT_RULES,
  renderActiveContext,
  type NexusActiveContext,
  type ActiveProjectContext,
  type ActiveVisualContext,
  type NexusContextKind,
} from "./context";
export { NEXUS_MEMORY_RULES, renderMemories, type NexusMemoryItem } from "./memory";
export { NEXUS_BUILD_FLOW, NEXUS_REAL_LIMITS } from "./operations";
