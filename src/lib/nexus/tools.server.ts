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

export type NexusToolCategory = "READ" | "WRITE" | "DESTRUCTIVE";

export interface NexusToolRuntime {
  supabase: SupabaseClient<any, any, any>;
  userId: string;
  roles: string[];
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
  { name: "web_research", reason: "não há provedor de busca na web configurado no ScaleNexus" },
  { name: "project_creation", reason: "criação de projetos pela IA ainda não foi liberada" },
  { name: "website_builder", reason: "construção automática de sites ainda não foi liberada" },
  { name: "app_builder", reason: "construção de aplicativos ainda não foi liberada" },
  { name: "document_generator", reason: "geração de arquivos pela IA ainda não foi liberada" },
  { name: "deployment_assistant", reason: "assistente de publicação ainda não foi liberado" },
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
        .select("id,name,category,project_id,size_bytes,created_at")
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
        .select("id,name,category,file_path,size_bytes,project_id")
        .eq("id", String(args.document_id))
        .maybeSingle();
      if (error) throw new Error(error.message);
      if (!doc) throw new Error("Documento não encontrado ou sem permissão de acesso.");

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
    run: async (args) => {
      const url = String(args.url);
      if (!/^https?:\/\//i.test(url)) throw new Error("URL inválida.");
      const res = await fetch(url, {
        headers: { "user-agent": "ScaleNexus-NexusbuildAI/1.0 (+site analysis)" },
      });
      if (!res.ok) throw new Error(`Site respondeu com status ${res.status}.`);
      const html = (await res.text()).slice(0, 400000);
      const pick = (re: RegExp) => html.match(re)?.[1]?.trim() ?? null;
      const all = (re: RegExp, limit = 25) =>
        Array.from(html.matchAll(re))
          .map((m) => m[1]!.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim())
          .filter(Boolean)
          .slice(0, limit);
      const tech: string[] = [];
      if (/__NEXT_DATA__|\/_next\//.test(html)) tech.push("Next.js");
      if (/wp-content|wp-includes/.test(html)) tech.push("WordPress");
      if (/cdn\.shopify\.com/.test(html)) tech.push("Shopify");
      if (/data-reactroot|react/i.test(html)) tech.push("React (provável)");
      if (/tailwind/i.test(html)) tech.push("Tailwind CSS (provável)");
      return {
        url,
        title: pick(/<title[^>]*>([\s\S]*?)<\/title>/i),
        description: pick(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i),
        headings: { h1: all(/<h1[^>]*>([\s\S]*?)<\/h1>/gi, 5), h2: all(/<h2[^>]*>([\s\S]*?)<\/h2>/gi, 20) },
        nav_links: all(/<nav[\s\S]{0,4000}?<\/nav>/gi, 1).slice(0, 1),
        sections_detected: (html.match(/<section/gi) ?? []).length,
        tech_hints: tech,
        source: { url, consulted_at: new Date().toISOString() },
      };
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
