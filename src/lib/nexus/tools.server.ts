/**
 * Registro de ferramentas da NEXUSBUILD AI.
 *
 * Princípios:
 * - Toda execução acontece no servidor, com o cliente Supabase do próprio usuário
 *   (RLS aplicada). A IA nunca tem mais poder do que o usuário autenticado.
 * - Cada ferramenta declara sua categoria (READ / WRITE / DESTRUCTIVE).
 * - Ferramentas ainda não implementadas NÃO são registradas: elas são declaradas
 *   como indisponíveis no system prompt, para a IA nunca fingir que as executou.
 * - Adicionar uma ferramenta nova = adicionar um item em NEXUS_TOOLS.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import { buildProjectContext, buildStudioSnapshot, generateIntelligence } from "@/lib/ai-core";
import { createBuildPlan } from "@/lib/forge";
import type { NexusToolSchema } from "./provider.server";
import { inspectWebsite, searchWeb } from "./web-research.server";
import {
  availableSectionTemplates,
  describeOperation,
  validateBuildPlan,
  MAX_OPERATIONS_PER_CALL,
} from "./build-plan";
import { executeBuildOperations, loadStudioState } from "./builder.server";

export type NexusToolCategory = "READ" | "WRITE" | "DESTRUCTIVE";

export interface NexusToolRuntime {
  supabase: SupabaseClient<any, any, any>;
  userId: string;
  roles: string[];
  conversationId: string;
}

export interface NexusTool {
  name: string;
  category: NexusToolCategory;
  description: string;
  parameters: Record<string, unknown>;
  run: (args: any, rt: NexusToolRuntime) => Promise<unknown>;
}

/** Capacidades previstas na arquitetura, ainda não implementadas. */
export const NEXUS_UNAVAILABLE_TOOLS = [
  { name: "app_builder", reason: "construção de aplicativos ainda não foi liberada" },
  { name: "document_generator", reason: "geração de arquivos pela IA ainda não foi liberada" },
  { name: "deployment_assistant", reason: "assistente de publicação ainda não foi liberado" },
  {
    name: "website_builder (páginas múltiplas, navegação, formulários, gráficos, animações e integrações)",
    reason:
      "o construtor atual monta apenas a página única do Studio, por seções da biblioteca; páginas extras, navegação, formulários, gráficos, animações e integrações ainda não são executáveis",
  },
  { name: "template_engine", reason: "ainda não há template real cadastrado para gerar projeto automaticamente" },
  { name: "image_generation", reason: "geração de imagens pela IA ainda não foi liberada" },
];

async function loadProjectBundle(projectId: string, rt: NexusToolRuntime) {
  const [{ data: project, error }, briefing, plan, studio] = await Promise.all([
    rt.supabase.from("projects").select("*").eq("id", projectId).maybeSingle(),
    rt.supabase.from("project_briefings").select("data").eq("project_id", projectId).maybeSingle(),
    rt.supabase.from("project_site_plans").select("*").eq("project_id", projectId).maybeSingle(),
    rt.supabase.from("project_studio_data").select("*").eq("project_id", projectId).maybeSingle(),
  ]);
  if (error) throw new Error(error.message);
  if (!project) throw new Error("Projeto não encontrado ou sem permissão de acesso.");
  return {
    project,
    briefing: (briefing.data?.data ?? null) as any,
    sitePlan: (plan.data as any) ?? null,
    studio: (studio.data as any) ?? null,
  };
}

export const NEXUS_TOOLS: NexusTool[] = [
  {
    name: "web_research",
    category: "READ",
    description:
      "Pesquisa informações atuais na internet com fontes verificáveis. Use seletivamente quando o usuário pedir pesquisa ou quando preços, políticas, requisitos, versões, APIs, documentação ou tendências atuais precisarem de confirmação. Para temas técnicos, legais, políticas e publicação, formule a consulta priorizando fontes oficiais.",
    parameters: {
      type: "object",
      properties: {
        query: { type: "string", description: "Consulta objetiva; inclua site:dominio-oficial quando apropriado" },
        objective: { type: "string", description: "O que precisa ser verificado ou decidido com a pesquisa" },
        result_count: { type: "number", description: "Quantidade entre 2 e 8; use 5 por padrão" },
        project_id: { type: "string", description: "Projeto relacionado, quando houver" },
      },
      required: ["query", "objective"],
      additionalProperties: false,
    },
    run: async (args, rt) => {
      const startedAt = Date.now();
      const query = String(args.query ?? "").trim().slice(0, 500);
      const objective = String(args.objective ?? "").trim().slice(0, 1_000);
      if (!query || !objective) throw new Error("Consulta e objetivo da pesquisa são obrigatórios.");
      let result: Awaited<ReturnType<typeof searchWeb>> | null = null;
      let failure: unknown;
      try {
        result = await searchWeb({ query, objective, limit: Number(args.result_count) || 5 });
        if (result.sources.length === 0) throw new Error("Nenhuma fonte verificável foi encontrada.");
        return result;
      } catch (error) {
        failure = error;
        throw error;
      } finally {
        const { error: logError } = await rt.supabase.from("nexusbuild_web_researches").insert({
          user_id: rt.userId,
          conversation_id: rt.conversationId,
          project_id: args.project_id ? String(args.project_id) : null,
          query,
          objective,
          sources: result?.sources ?? [],
          result_summary: result ? `${result.sources.length} fonte(s) encontrada(s).` : failure instanceof Error ? failure.message : "Falha na pesquisa.",
          status: result ? "OK" : "ERRO",
          duration_ms: Date.now() - startedAt,
        } as never);
        if (logError) console.error("[NEXUSBUILD WEB] Falha ao registrar pesquisa:", logError.message);
      }
    },
  },
  {
    name: "list_projects",
    category: "READ",
    description:
      "Lista os projetos do ScaleNexus que o usuário atual tem permissão para acessar. Use quando o projeto em contexto estiver ambíguo.",
    parameters: { type: "object", properties: {}, additionalProperties: false },
    run: async (_args, rt) => {
      const { data, error } = await rt.supabase
        .from("projects")
        .select("id,title,status,site_type,description,due_date,updated_at")
        .order("updated_at", { ascending: false })
        .limit(30);
      if (error) throw new Error(error.message);
      return { projects: data ?? [] };
    },
  },
  {
    name: "project_context",
    category: "READ",
    description:
      "Retorna o contexto autorizado de um projeto: dados gerais, briefing, plano de site e estrutura montada no Studio.",
    parameters: {
      type: "object",
      properties: { project_id: { type: "string", description: "ID do projeto" } },
      required: ["project_id"],
      additionalProperties: false,
    },
    run: async (args, rt) => {
      const bundle = await loadProjectBundle(String(args.project_id), rt);
      const studioData = bundle.studio
        ? { sections: bundle.studio.sections ?? [], design_system: bundle.studio.design_system ?? null }
        : null;
      return {
        project: {
          id: bundle.project.id,
          title: bundle.project.title,
          description: bundle.project.description,
          status: bundle.project.status,
          site_type: bundle.project.site_type,
          due_date: bundle.project.due_date,
        },
        briefing: bundle.briefing,
        site_plan: bundle.sitePlan,
        studio_snapshot: buildStudioSnapshot(studioData as any),
      };
    },
  },
  {
    name: "project_analysis",
    category: "READ",
    description:
      "Executa o motor de análise interno do ScaleNexus (ai-core) sobre um projeto e retorna pontuação, pontos fortes, problemas e oportunidades.",
    parameters: {
      type: "object",
      properties: { project_id: { type: "string" } },
      required: ["project_id"],
      additionalProperties: false,
    },
    run: async (args, rt) => {
      const bundle = await loadProjectBundle(String(args.project_id), rt);
      const studioData = bundle.studio
        ? { sections: bundle.studio.sections ?? [], design_system: bundle.studio.design_system ?? null }
        : null;
      const context = buildProjectContext(
        String(args.project_id),
        bundle.briefing,
        (bundle.sitePlan?.data ?? bundle.sitePlan) as any,
        studioData as any,
      );
      const intelligence = generateIntelligence(context, studioData as any);
      return {
        score: (intelligence as any).score,
        strengths: (intelligence as any).strengths,
        issues: ((intelligence as any).issues ?? []).map((i: any) => ({
          severity: i.severity,
          label: i.label,
          description: i.description,
        })),
        opportunities: (intelligence as any).opportunities,
      };
    },
  },
  {
    name: "project_forge",
    category: "READ",
    description:
      "Gera, com o motor Forge do ScaleNexus, um plano estruturado de construção do site do projeto (seções, decisões e direção visual).",
    parameters: {
      type: "object",
      properties: { project_id: { type: "string" } },
      required: ["project_id"],
      additionalProperties: false,
    },
    run: async (args, rt) => {
      const bundle = await loadProjectBundle(String(args.project_id), rt);
      const studioData = bundle.studio
        ? { sections: bundle.studio.sections ?? [], design_system: bundle.studio.design_system ?? null }
        : null;
      const context = buildProjectContext(
        String(args.project_id),
        bundle.briefing,
        (bundle.sitePlan?.data ?? bundle.sitePlan) as any,
        studioData as any,
      );
      const plan = createBuildPlan(context);
      return {
        goal: plan.goal,
        strategy: plan.strategy,
        design_direction: plan.designDirection,
        visual_style: plan.visualStyle,
        primary_cta: plan.primaryCTA,
        sections: plan.sections.map((s) => ({ name: s.name, purpose: s.purpose, priority: s.priority })),
        decisions: plan.decisions.map((d) => ({ title: d.title, decision: d.decision, reason: d.reason })),
      };
    },
  },
  {
    name: "file_search",
    category: "READ",
    description:
      "Pesquisa documentos de projeto aos quais o usuário tem acesso, por nome, categoria ou projeto. Use antes de tentar ler um arquivo.",
    parameters: {
      type: "object",
      properties: {
        query: { type: "string", description: "Trecho do nome do arquivo" },
        project_id: { type: "string" },
      },
      additionalProperties: false,
    },
    run: async (args, rt) => {
      let q = rt.supabase
        .from("project_documents")
        .select(
          "id,name,original_name,category,project_id,size_bytes,mime_type,extension,status,extraction_status,created_at",
        )
        .eq("status", "pronto")
        .order("created_at", { ascending: false })
        .limit(25);
      if (args?.project_id) q = q.eq("project_id", String(args.project_id));
      if (args?.query) q = q.ilike("name", `%${String(args.query)}%`);
      const { data, error } = await q;
      if (error) throw new Error(error.message);
      return { documents: data ?? [] };
    },
  },
  {
    name: "file_read",
    category: "READ",
    description:
      "Lê o conteúdo de um documento de projeto autorizado. Só funciona com arquivos de texto (txt, md, csv, json). Para outros formatos retorna apenas os metadados.",
    parameters: {
      type: "object",
      properties: { document_id: { type: "string" } },
      required: ["document_id"],
      additionalProperties: false,
    },
    run: async (args, rt) => {
      const { data: doc, error } = await rt.supabase
        .from("project_documents")
        .select("id,name,original_name,category,file_path,size_bytes,project_id,extension,mime_type,status")
        .eq("id", String(args.document_id))
        .maybeSingle();
      if (error) throw new Error(error.message);
      if (!doc) throw new Error("Documento não encontrado ou sem permissão de acesso.");
      if ((doc as { status?: string }).status !== "pronto") {
        return {
          document: doc,
          content: null,
          note: "Documento ainda não está pronto (envio ou processamento pendente). Informe isso ao usuário.",
        };
      }

      const textLike = /\.(txt|md|markdown|csv|json|yml|yaml)$/i.test(doc.name);
      if (!textLike) {
        return {
          document: doc,
          content: null,
          note: "Leitura de conteúdo disponível apenas para arquivos de texto. Informe isso ao usuário.",
        };
      }
      const file = await rt.supabase.storage.from("project-documents").download(doc.file_path);
      if (file.error || !file.data) {
        return { document: doc, content: null, note: "Não foi possível abrir o arquivo." };
      }
      const raw = await file.data.text();
      return { document: doc, content: raw.slice(0, 20000), truncated: raw.length > 20000 };
    },
  },
  {
    name: "website_research",
    category: "READ",
    description:
      "Acessa uma URL pública informada pelo usuário e extrai estrutura pública: título, descrição, navegação, títulos das seções e pistas de tecnologia. Use apenas como referência; nunca copie conteúdo protegido.",
    parameters: {
      type: "object",
      properties: { url: { type: "string", description: "URL completa iniciando com https://" } },
      required: ["url"],
      additionalProperties: false,
    },
    run: async (args, rt) => {
      const startedAt = Date.now();
      const requestedUrl = String(args.url ?? "");
      let result: Awaited<ReturnType<typeof inspectWebsite>> | null = null;
      let failure: unknown;
      try {
        result = await inspectWebsite(requestedUrl);
        return result;
      } catch (error) {
        failure = error;
        throw error;
      } finally {
        const { error: logError } = await rt.supabase.from("nexusbuild_web_researches").insert({
          user_id: rt.userId,
          conversation_id: rt.conversationId,
          project_id: null,
          query: requestedUrl.slice(0, 500),
          objective: "Analisar a URL pública fornecida pelo usuário.",
          sources: result?.sources ?? [],
          result_summary: result ? "URL analisada com fonte registrada." : failure instanceof Error ? failure.message : "Falha na análise da URL.",
          status: result ? "OK" : "ERRO",
          duration_ms: Date.now() - startedAt,
        } as never);
        if (logError) console.error("[NEXUSBUILD WEB] Falha ao registrar análise de URL:", logError.message);
      }
    },
  },
  {
    name: "memory_list",
    category: "READ",
    description: "Lista as memórias ativas guardadas sobre este usuário.",
    parameters: { type: "object", properties: {}, additionalProperties: false },
    run: async (_args, rt) => {
      const { data, error } = await rt.supabase
        .from("nexusbuild_memories")
        .select("id,kind,content,relevance,project_id,created_at")
        .eq("active", true)
        .order("relevance", { ascending: false })
        .limit(50);
      if (error) throw new Error(error.message);
      return { memories: data ?? [] };
    },
  },
  {
    name: "memory_save",
    category: "WRITE",
    description:
      "Guarda uma informação realmente relevante e duradoura sobre o usuário, um projeto ou uma decisão. Não guarde conversas inteiras nem detalhes irrelevantes.",
    parameters: {
      type: "object",
      properties: {
        kind: { type: "string", enum: ["PREFERENCIA", "FATO", "DECISAO", "PROJETO", "CONTEXTO"] },
        content: { type: "string", description: "Frase curta e objetiva" },
        project_id: { type: "string" },
        relevance: { type: "number", description: "1 a 5" },
      },
      required: ["kind", "content"],
      additionalProperties: false,
    },
    run: async (args, rt) => {
      const { error } = await rt.supabase.from("nexusbuild_memories").insert({
        user_id: rt.userId,
        kind: String(args.kind),
        content: String(args.content).slice(0, 500),
        project_id: args.project_id ? String(args.project_id) : null,
        relevance: Math.min(5, Math.max(1, Number(args.relevance) || 3)),
        source: "conversa",
      });
      if (error) throw new Error(error.message);
      return { saved: true };
    },
  },
  {
    name: "create_project",
    category: "WRITE",
    description:
      "Cria um projeto real no ScaleNexus, com o usuário atual como dono e criador, e grava o briefing levantado na conversa. Só execute depois de apresentar ao usuário o que será criado e receber confirmação explícita (confirmed=true).",
    parameters: {
      type: "object",
      properties: {
        title: { type: "string", description: "Nome do projeto" },
        description: { type: "string", description: "Resumo do objetivo do projeto" },
        site_type: { type: "string", description: "Tipo: landing, institucional, loja, portfolio, blog, sistema" },
        briefing: {
          type: "object",
          description:
            "Requisitos levantados na conversa. Campos úteis: businessName, niche, description, objectives[], audience, differentiators[], visualStyle[], references.",
        },
        confirmed: { type: "boolean", description: "true somente depois de o usuário confirmar a criação" },
      },
      required: ["title", "confirmed"],
      additionalProperties: false,
    },
    run: async (args, rt) => {
      const title = String(args.title ?? "").trim().slice(0, 140);
      if (!title) throw new Error("Informe o nome do projeto.");
      if (!rt.roles.includes("admin") && !rt.roles.includes("criador")) {
        throw new Error("Seu perfil não tem permissão para criar projetos.");
      }
      if (args.confirmed !== true) {
        return {
          requires_confirmation: true,
          preview: {
            title,
            description: args.description ?? null,
            site_type: args.site_type ?? null,
            briefing_incluido: Boolean(args.briefing),
          },
          message: "Apresente esse resumo ao usuário e chame novamente com confirmed=true após a confirmação.",
        };
      }

      const startedAt = Date.now();
      const { data: project, error } = await rt.supabase
        .from("projects")
        .insert({
          owner_id: rt.userId,
          creator_id: rt.userId,
          title,
          description: args.description ? String(args.description).slice(0, 2000) : null,
          site_type: args.site_type ? String(args.site_type).slice(0, 60) : null,
          status: "em_producao",
        } as never)
        .select("id,title,status,site_type")
        .single();
      if (error) throw new Error(`Não foi possível criar o projeto: ${error.message}`);

      let briefingSaved = false;
      let briefingError: string | null = null;
      if (args.briefing && typeof args.briefing === "object") {
        const { error: bErr } = await rt.supabase
          .from("project_briefings")
          .upsert({ project_id: (project as any).id, data: args.briefing } as never);
        briefingSaved = !bErr;
        briefingError = bErr?.message ?? null;
      }

      await rt.supabase.from("nexusbuild_build_operations").insert({
        user_id: rt.userId,
        conversation_id: rt.conversationId,
        project_id: (project as any).id,
        operation_type: "CREATE_PROJECT",
        params: { title, site_type: args.site_type ?? null, briefing: briefingSaved },
        status: "OK",
        detail: "Projeto criado pela NEXUSBUILD AI.",
        duration_ms: Date.now() - startedAt,
      } as never);

      return {
        project_id: (project as any).id,
        project: project,
        briefing_saved: briefingSaved,
        briefing_error: briefingError,
        next_step:
          "Use project_forge para gerar o plano de construção, apresente o plano ao usuário e só depois chame website_builder.",
      };
    },
  },
  {
    name: "project_briefing_save",
    category: "WRITE",
    description:
      "Grava ou atualiza o briefing de um projeto existente com os requisitos levantados na conversa. Explique ao usuário o que será registrado antes de executar.",
    parameters: {
      type: "object",
      properties: {
        project_id: { type: "string" },
        briefing: { type: "object", description: "Objeto com os requisitos levantados" },
      },
      required: ["project_id", "briefing"],
      additionalProperties: false,
    },
    run: async (args, rt) => {
      if (!args.briefing || typeof args.briefing !== "object") throw new Error("Briefing inválido.");
      await loadProjectBundle(String(args.project_id), rt);
      const { error } = await rt.supabase
        .from("project_briefings")
        .upsert({ project_id: String(args.project_id), data: args.briefing } as never);
      if (error) throw new Error(error.message);
      return { saved: true, project_id: args.project_id };
    },
  },
  {
    name: "website_builder",
    category: "WRITE",
    description:
      "Executa a construção real do site do projeto no Studio do ScaleNexus, aplicando operações estruturadas. Operações suportadas hoje: ADD_SECTION, UPDATE_SECTION, REORDER_SECTIONS, UPDATE_DESIGN_SYSTEM e REMOVE_SECTION (destrutiva). Chame primeiro com confirmed=false para validar e mostrar o plano; execute apenas com confirmed=true após confirmação do usuário. Use list_section_templates para conhecer as seções disponíveis.",
    parameters: {
      type: "object",
      properties: {
        project_id: { type: "string" },
        operations: {
          type: "array",
          description: `Lista de operações estruturadas (máximo ${MAX_OPERATIONS_PER_CALL}).`,
          items: {
            type: "object",
            properties: {
              type: {
                type: "string",
                enum: ["ADD_SECTION", "UPDATE_SECTION", "REORDER_SECTIONS", "UPDATE_DESIGN_SYSTEM", "REMOVE_SECTION"],
              },
              params: {
                type: "object",
                description:
                  "ADD_SECTION: { template, position?, texts?: {title,subtitle,paragraph,button}, styles? } | UPDATE_SECTION: { section_id, texts?, styles? } | REORDER_SECTIONS: { section_ids[] } | UPDATE_DESIGN_SYSTEM: { colors?, typography?, buttons?, cards? } | REMOVE_SECTION: { section_id }",
              },
            },
            required: ["type", "params"],
          },
        },
        confirmed: { type: "boolean" },
      },
      required: ["project_id", "operations"],
      additionalProperties: false,
    },
    run: async (args, rt) => {
      const projectId = String(args.project_id ?? "");
      const bundle = await loadProjectBundle(projectId, rt);
      const state = await loadStudioState(rt.supabase, projectId);
      const validation = validateBuildPlan(args.operations, state.sections.length);

      if (!validation.valid) {
        return {
          executed: false,
          valid: false,
          issues: validation.issues,
          message:
            "O plano de construção não passou na validação do servidor. Nenhuma alteração foi feita. Corrija as operações ou informe ao usuário o que não é suportado.",
        };
      }

      if (args.confirmed !== true) {
        return {
          executed: false,
          valid: true,
          requires_confirmation: true,
          destructive: validation.destructive,
          project: { id: projectId, title: (bundle.project as any).title },
          operations: validation.operations.map(describeOperation),
          message:
            "Plano validado, mas nada foi executado. Apresente estas operações ao usuário e chame novamente com confirmed=true após a confirmação.",
        };
      }

      const startedAt = Date.now();
      let report: Awaited<ReturnType<typeof executeBuildOperations>> | null = null;
      try {
        report = await executeBuildOperations(rt.supabase, projectId, validation.operations);
        return {
          executed: true,
          project_id: projectId,
          ...report,
          next_step:
            report.failed > 0
              ? "Informe ao usuário exatamente quais operações falharam e por quê. Não afirme que tudo foi concluído."
              : "Use project_analysis para revisar o resultado e propor melhorias.",
        };
      } finally {
        const rows = (report?.entries ?? [{ type: "BUILD", status: "FALHOU" as const, detail: "Execução interrompida." }]).map(
          (entry) => ({
            user_id: rt.userId,
            conversation_id: rt.conversationId,
            project_id: projectId,
            operation_type: entry.type,
            params: {},
            status: entry.status === "APLICADA" ? "OK" : "ERRO",
            detail: entry.detail.slice(0, 500),
            duration_ms: Date.now() - startedAt,
          }),
        );
        const { error: logError } = await rt.supabase.from("nexusbuild_build_operations").insert(rows as never);
        if (logError) console.error("[NEXUSBUILD BUILD] Falha ao registrar operações:", logError.message);
      }
    },
  },
  {
    name: "list_section_templates",
    category: "READ",
    description:
      "Lista as seções realmente disponíveis na biblioteca do Studio para uso em ADD_SECTION. Use antes de montar um plano de construção.",
    parameters: { type: "object", properties: {}, additionalProperties: false },
    run: async () => ({ templates: availableSectionTemplates() }),
  },
];

export function toolSchemas(): NexusToolSchema[] {
  return NEXUS_TOOLS.map((t) => ({
    type: "function" as const,
    function: {
      name: t.name,
      description: `[${t.category}] ${t.description}`,
      parameters: t.parameters,
    },
  }));
}

export function findTool(name: string) {
  return NEXUS_TOOLS.find((t) => t.name === name);
}
