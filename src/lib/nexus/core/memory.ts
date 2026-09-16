/**
 * NEXUSBUILD CORE — MEMORY
 * Diferencia memória global (vale para o usuário) de memória do projeto ativo.
 * A estrutura de dados existente (nexusbuild_memories) é preservada.
 */
export interface NexusMemoryItem {
  kind: string;
  content: string;
  project_id?: string | null;
}

export const NEXUS_MEMORY_RULES = `MEMÓRIA

- MEMÓRIA DO PROJETO: decisões e preferências ligadas ao projeto ativo. Prevalece quando o assunto
  for esse projeto.
- MEMÓRIA GLOBAL: preferências e fatos do usuário válidos em qualquer projeto.
- Salve com memory_save apenas decisões duradouras (ex.: "tema escuro", "CTA principal é WhatsApp").
  Quando a decisão for de um projeto, informe project_id para vinculá-la a ele.
- Nunca salve a conversa inteira, dados sensíveis ou informação provisória.
- Não use memória irrelevante só para preencher contexto.`;

export function renderMemories(memories: NexusMemoryItem[], activeProjectId: string | null): string[] {
  if (memories.length === 0) return [];
  const projectMemories = activeProjectId ? memories.filter((m) => m.project_id === activeProjectId) : [];
  const globalMemories = memories.filter((m) => !projectMemories.includes(m));
  const parts: string[] = [];

  if (projectMemories.length > 0) {
    parts.push(
      `MEMÓRIA DO PROJETO ATIVO (decisões já confirmadas)
${projectMemories.map((m) => `- [${m.kind}] ${m.content}`).join("\n")}`,
    );
  }
  if (globalMemories.length > 0) {
    parts.push(
      `MEMÓRIA GLOBAL (fatos e preferências do usuário)
${globalMemories.map((m) => `- [${m.kind}] ${m.content}`).join("\n")}`,
    );
  }
  return parts;
}
