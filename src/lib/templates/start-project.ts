/**
 * Fluxo manual (sem IA): cria ou reabre o projeto editável do Criador a partir
 * de um modelo oficial. Roda com a sessão do usuário; o banco (RLS) garante que
 * ele só enxerga e altera os próprios projetos.
 */
import { supabase } from "@/integrations/supabase/client";
import { getLibraryItem } from "@/lib/templates/library";

export async function openTemplateProject(templateId: string, options?: { forceNew?: boolean }) {
  const tpl = getLibraryItem(templateId);
  if (!tpl) throw new Error("Modelo não encontrado na biblioteca oficial.");
  const { data: auth } = await supabase.auth.getUser();
  const userId = auth.user?.id;
  if (!userId) throw new Error("Entre na sua conta para editar o modelo.");

  // Reabre o rascunho mais recente deste modelo, evitando projetos duplicados.
  if (!options?.forceNew) {
    const { data: existing } = await supabase
      .from("projects")
      .select("id")
      .eq("creator_id", userId)
      .eq("template_id" as never, templateId as never)
      .order("created_at", { ascending: false })
      .limit(1);
    const found = (existing ?? [])[0] as { id: string } | undefined;
    if (found) return { projectId: found.id, created: false };
  }

  const { data: project, error } = await supabase
    .from("projects")
    .insert({
      owner_id: userId,
      creator_id: userId,
      title: `${tpl.name} — meu site`,
      description: "Projeto criado a partir de um modelo oficial (edição manual).",
      status: "em_producao",
      template_id: tpl.id,
    } as never)
    .select("id")
    .single();
  if (error || !project) throw new Error(`Não foi possível criar o projeto: ${error?.message ?? "erro desconhecido"}`);

  const structure = JSON.parse(JSON.stringify(tpl.structure)) as { sections: unknown[]; design_system: unknown };
  const { error: dataError } = await supabase.from("project_studio_data").insert({
    project_id: (project as { id: string }).id,
    sections: structure.sections,
    design_system: structure.design_system,
  } as never);
  if (dataError) throw new Error(`Projeto criado, mas o modelo não foi carregado: ${dataError.message}`);

  return { projectId: (project as { id: string }).id, created: true };
}
