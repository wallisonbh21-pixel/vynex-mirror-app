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
  availableSiteTemplates,
  describeOperation,
  validateBuildPlan,
  MAX_OPERATIONS_PER_CALL,
} from "./build-plan";
import { executeBuildOperations, loadStudioState } from "./builder.server";
import { VISUAL_LIMITS } from "@/lib/visual/constants";
import { generateProjectVisual } from "@/lib/visual/generate.server";
import { setActiveProject } from "./core/context.server";

export type NexusToolCategory = "READ" | "WRITE" | "DESTRUCTIVE";

export interface NexusToolRuntime {
  supabase: SupabaseClient<any, any, any>;
  userId: string;
  roles: string[];
  conversationId: string;
  /** Origem pública da requisição (ex.: https://scalenexus.com.br), usada para montar links reais. */
  origin?: string;
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
  {
    name: "website_builder (páginas múltiplas, navegação, formulários, gráficos, animações e integrações)",
    reason:
      "o construtor atual monta apenas a página única do Studio, por seções da biblioteca; páginas extras, navegação, formulários, gráficos, animações e integrações ainda não são executáveis",
  },
  {
    name: "image_editing (edição pixel a pixel, recorte, upscale e remoção de fundo)",
    reason:
      "a IA gera imagens novas e variações a partir de referência, mas ainda não edita uma imagem existente ponto a ponto",
  },
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
  // Contexto ativo (ATA #021): a conversa passa a apontar para o projeto realmente usado.
  await setActiveProject(rt.supabase, rt.conversationId, projectId).catch(() => undefined);
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

      // Retentativa segura: se esta conversa já criou um projeto com o mesmo nome, reutiliza.
      const { data: existing } = await rt.supabase
        .from("nexusbuild_build_operations")
        .select("project_id, projects!inner(id,title,status,site_type)")
        .eq("conversation_id", rt.conversationId)
        .eq("operation_type", "CREATE_PROJECT")
        .eq("status", "OK")
        .order("created_at", { ascending: false })
        .limit(5);
      const reuse = (existing ?? []).find(
        (row: any) => row.projects && String(row.projects.title).trim().toLowerCase() === title.toLowerCase(),
      ) as any;
      if (reuse) {
        await setActiveProject(rt.supabase, rt.conversationId, reuse.project_id).catch(() => undefined);
        return {
          project_id: reuse.project_id,
          project: reuse.projects,
          reused: true,
          message: "Este projeto já havia sido criado nesta conversa; nenhum duplicado foi gerado. Continue a partir dele.",
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

      // Projeto recém-criado vira o projeto ativo da conversa (ATA #021).
      await setActiveProject(rt.supabase, rt.conversationId, (project as any).id).catch(() => undefined);

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
      "Executa a construção real do site do projeto no Studio do ScaleNexus, aplicando operações estruturadas. Operações suportadas hoje: APPLY_TEMPLATE, ADD_SECTION, UPDATE_SECTION, SET_ITEMS (listas, FAQ, galeria, produtos), SET_VEHICLES (estoque do ScaleNexus Motors), REORDER_SECTIONS, UPDATE_DESIGN_SYSTEM e REMOVE_SECTION (destrutiva). Chame primeiro com confirmed=false para validar e mostrar o plano; execute apenas com confirmed=true após confirmação do usuário. Use list_section_templates para conhecer as seções disponíveis.",
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
                enum: ["APPLY_TEMPLATE", "ADD_SECTION", "UPDATE_SECTION", "SET_ITEMS", "SET_VEHICLES", "REORDER_SECTIONS", "UPDATE_DESIGN_SYSTEM", "REMOVE_SECTION"],
              },
              params: {
                type: "object",
                description:
                  "APPLY_TEMPLATE: { template_id } (modelo oficial completo, ex.: tpl-scalenexus-motors para concessionárias/revendas/motos; substitui as seções) | ADD_SECTION: { template, position?, texts?: {title,subtitle,paragraph,button}, styles? } | UPDATE_SECTION: { section_id, texts?, styles? } | SET_ITEMS: { section_id, kind: list|faq|gallery|products|testimonials, demo: boolean, items: [{ title, text?, image_url? (https), image_alt?, price? (número ou null), button_text?, button_href? , author? }] } (substitui contêineres vazios e itens anteriores; testimonials só com depoimentos reais e demo=false) | SET_VEHICLES: { whatsapp?, vehicles: [{ id, brand, model, version?, year, price (número ou null=Consulte), mileage_km?, fuel: flex|gasolina|diesel|eletrico|hibrido, transmission: manual|automatico|cvt, type?: carro|moto|utilitario, color?, photos?: [https], description?, equipment?: [], availability?, featured?, offer?, demo: boolean }] } (só projetos com o modelo ScaleNexus Motors; substitui todo o estoque) | REORDER_SECTIONS: { section_ids[] } | UPDATE_DESIGN_SYSTEM: { colors?, typography?, buttons?, cards? } | REMOVE_SECTION: { section_id }",
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
              : "Para preencher conteúdo, use UPDATE_SECTION com os section_id reais retornados em entries[].section_ids / sections[].id (nunca invente ids). Depois use project_analysis para revisar.",
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
    name: "publish_site",
    category: "WRITE",
    description:
      "Publica o site do projeto como versão imutável (snapshot do Studio) e devolve o endereço público real. Pode ser chamado de novo para publicar nova versão (mantém o mesmo endereço). Chame primeiro sem confirmed para mostrar o resumo; publique só com confirmed=true após confirmação explícita. Nunca invente a URL: use site_url retornado.",
    parameters: {
      type: "object",
      properties: {
        project_id: { type: "string" },
        slug: { type: "string", description: "Endereço desejado (letras minúsculas, números e hífens). Opcional." },
        confirmed: { type: "boolean" },
      },
      required: ["project_id"],
      additionalProperties: false,
    },
    run: async (args, rt) => {
      const projectId = String(args.project_id ?? "");
      const bundle = await loadProjectBundle(projectId, rt);
      const title = String((bundle.project as any).title ?? "site");
      const state = await loadStudioState(rt.supabase, projectId);
      const origin = (rt.origin ?? "").replace(/\/$/, "");
      const studioUrl = `${origin}/studio/${projectId}`;
      if (state.sections.length === 0) {
        return {
          published: false,
          saved: false,
          error: "O projeto ainda não tem seções salvas. Monte o site com website_builder antes de publicar.",
        };
      }
      const { data: existingSite } = await rt.supabase
        .from("project_sites")
        .select("slug,status")
        .eq("project_id", projectId)
        .maybeSingle();
      const base = slugifySite(String(args.slug ?? "") || (existingSite as any)?.slug || title) || "site";

      if (args.confirmed !== true) {
        return {
          published: false,
          requires_confirmation: true,
          preview: {
            site_name: title,
            sections: state.sections.length,
            address: `${origin}/s/${(existingSite as any)?.slug ?? base}`,
            new_version_of_existing_site: Boolean(existingSite),
          },
          message: "Nada foi publicado. Apresente este resumo e chame novamente com confirmed=true após a confirmação.",
        };
      }

      const candidates = (existingSite as any)?.slug
        ? [(existingSite as any).slug]
        : [base, `${base}-${projectId.slice(0, 4)}`, `${base}-${projectId.slice(0, 8)}`];
      let lastError = "";
      for (const slug of candidates) {
        const { data, error } = await rt.supabase.rpc("publish_project_site" as never, { p_project_id: projectId, p_slug: slug } as never);
        if (error) {
          lastError = error.message;
          if (error.message.includes("já está em uso")) continue;
          break;
        }
        const row = (Array.isArray(data) ? data[0] : data) as { slug: string; version_number: number } | null;
        if (!row?.slug) {
          lastError = "A publicação não retornou o endereço.";
          break;
        }
        // Confirma que a versão pública é realmente recuperável.
        const { data: check } = await rt.supabase.rpc("get_published_site" as never, { p_slug: row.slug } as never);
        const ok = Array.isArray(check) ? check.length > 0 : Boolean(check);
        const site = {
          site_name: title,
          project_id: projectId,
          site_url: `${origin}/s/${row.slug}`,
          site_path: `/s/${row.slug}`,
          studio_url: studioUrl,
          studio_path: `/studio/${projectId}`,
          version_number: row.version_number,
          status: ok ? "PUBLICADO" : "PUBLICADO_SEM_CONFIRMACAO",
        };
        return {
          published: true,
          verified: ok,
          site,
          message: ok
            ? "Site publicado e verificado. Entregue ao usuário exatamente site_url e studio_url."
            : "A publicação foi gravada, mas a leitura pública não confirmou. Informe isso ao usuário.",
        };
      }
      return {
        published: false,
        saved: true,
        studio_url: studioUrl,
        error: lastError || "Falha desconhecida na publicação.",
        message: "O site continua salvo no Studio. Informe o motivo e ofereça tentar publicar novamente.",
      };
    },
  },
  {
    name: "list_section_templates",
    category: "READ",
    description:
      "Lista as seções disponíveis para ADD_SECTION e os modelos oficiais completos (site_templates) para APPLY_TEMPLATE. Use antes de montar um plano de construção.",
    parameters: { type: "object", properties: {}, additionalProperties: false },
    run: async () => ({ templates: availableSectionTemplates(), site_templates: availableSiteTemplates() }),
  },
  {
    name: "visual_assets_list",
    category: "READ",
    description:
      "Lista as imagens da Central Visual de um projeto (geradas, referências, versões e status de aprovação). Use antes de criar variações para saber o que já existe.",
    parameters: {
      type: "object",
      properties: {
        project_id: { type: "string" },
        kind: { type: "string", enum: ["gerada", "referencia"] },
      },
      required: ["project_id"],
      additionalProperties: false,
    },
    run: async (args, rt) => {
      let q = rt.supabase
        .from("project_visual_assets")
        .select("id,title,purpose,kind,version,status,parent_asset_id,use_in_builder,created_at")
        .eq("project_id", String(args.project_id))
        .order("created_at", { ascending: false })
        .limit(40);
      if (args.kind) q = q.eq("kind", String(args.kind));
      const { data, error } = await q;
      if (error) throw new Error(error.message);
      return { assets: data ?? [] };
    },
  },
  {
    name: "image_generation",
    category: "WRITE",
    description:
      "Gera imagens originais reais para um projeto (logo, identidade visual, banner, imagem de produto, imagem para site, ilustração, social media, conceito visual ou variação). O servidor valida permissão, limites e armazena a imagem privada no projeto, com versão e status. Explique ao usuário o que será gerado e chame com confirmed=true. Para uma nova versão de uma imagem existente, informe parent_asset_id; para usar uma imagem enviada como inspiração, informe reference_asset_id. Nunca copie marcas ou identidade de terceiros.",
    parameters: {
      type: "object",
      properties: {
        project_id: { type: "string" },
        prompt: { type: "string", description: "Descrição visual detalhada e original da imagem desejada" },
        purpose: {
          type: "string",
          enum: [
            "logo",
            "identidade_visual",
            "banner",
            "imagem_produto",
            "imagem_site",
            "ilustracao",
            "social_media",
            "conceito_visual",
            "variacao",
          ],
        },
        aspect: { type: "string", enum: ["1:1", "16:9", "4:3", "3:4", "9:16"] },
        count: { type: "number", description: `Quantidade de imagens (máximo ${VISUAL_LIMITS.perRequest})` },
        reference_asset_id: { type: "string", description: "Imagem de referência já registrada no projeto" },
        parent_asset_id: { type: "string", description: "Imagem que será versionada (gera a próxima versão)" },
        context: { type: "string", description: "Contexto curto da marca/projeto que ajude a direção visual" },
        confirmed: { type: "boolean", description: "true somente depois de o usuário confirmar a geração" },
      },
      required: ["project_id", "prompt", "purpose"],
      additionalProperties: false,
    },
    run: async (args, rt) => {
      const projectId = String(args.project_id ?? "");
      const bundle = await loadProjectBundle(projectId, rt);
      const count = Math.min(Math.max(Number(args.count) || 1, 1), VISUAL_LIMITS.perRequest);

      if (args.confirmed !== true) {
        return {
          generated: false,
          requires_confirmation: true,
          preview: {
            project: (bundle.project as any).title,
            purpose: args.purpose,
            aspect: args.aspect ?? "1:1",
            count,
            prompt: String(args.prompt ?? "").slice(0, 600),
            reference: Boolean(args.reference_asset_id),
            nova_versao_de: args.parent_asset_id ?? null,
          },
          message:
            "Nada foi gerado ainda. Apresente esse resumo ao usuário e chame novamente com confirmed=true após a confirmação.",
        };
      }

      const result = await generateProjectVisual(rt.supabase, rt.userId, {
        projectId,
        prompt: String(args.prompt ?? ""),
        purpose: String(args.purpose ?? "imagem_site"),
        aspect: String(args.aspect ?? "1:1"),
        count,
        conversationId: rt.conversationId,
        referenceAssetId: args.reference_asset_id ? String(args.reference_asset_id) : null,
        parentAssetId: args.parent_asset_id ? String(args.parent_asset_id) : null,
        context: args.context ? String(args.context).slice(0, 600) : null,
      });

      if (!result.ok) {
        return {
          generated: false,
          error: result.error,
          message:
            "A geração falhou e nada foi salvo. Informe ao usuário exatamente o que falhou e ofereça tentar novamente.",
        };
      }

      return {
        generated: true,
        project_id: projectId,
        generation_id: result.generationId,
        assets: result.assets,
        visual_assets: result.assets,
        message:
          "As imagens já aparecem na conversa e na Central Visual do projeto. Peça ao usuário para aprovar, pedir variação ou solicitar outra versão.",
      };
    },
  },
];

function slugifySite(input: string) {
  return input
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 50);
}

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
