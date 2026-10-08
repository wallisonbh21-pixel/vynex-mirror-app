/**
 * Biblioteca Central de Modelos do ScaleNexus.
 * Fonte única: NICHE_TEMPLATES (código) + site_template_settings (controles do Admin).
 * Modelos oficiais = itens de NICHE_TEMPLATES com metadata.preview_route.
 */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { NICHE_TEMPLATES } from "@/lib/studio/templates";
import type { LibraryItem } from "@/types/studio-v2";

export const LIBRARY_CATEGORY: Record<string, string> = {
  "tpl-imobiliaria-premium": "Imobiliária",
  "tpl-ia-automacao": "Tecnologia / IA",
  "tpl-tecnologia-saas": "Tecnologia / SaaS",
};

/** Status em que o modelo ainda pode ser escolhido/alterado. Espelha o trigger do banco. */
export const TEMPLATE_EDITABLE_STATUSES = ["disponivel", "briefing"];
export const isTemplateLocked = (status: string | null | undefined) =>
  !!status && !TEMPLATE_EDITABLE_STATUSES.includes(status);

export type TemplateSettings = {
  template_id: string;
  status: "ativo" | "inativo";
  featured: boolean;
  display_order: number;
  available_for_creators: boolean;
  available_for_clients: boolean;
};

export type LibraryModel = {
  item: LibraryItem;
  id: string;
  name: string;
  category: string;
  description: string;
  preview: string;
  previewRoute: string;
  settings: TemplateSettings;
};

export const OFFICIAL_TEMPLATES = NICHE_TEMPLATES.filter((t) => t.metadata?.['preview_route']);

export function getLibraryItem(templateId: string | null | undefined) {
  return OFFICIAL_TEMPLATES.find((t) => t.id === templateId);
}

const DEFAULT_SETTINGS = (id: string, i: number): TemplateSettings => ({
  template_id: id,
  status: "ativo",
  featured: false,
  display_order: 100 + i,
  available_for_creators: true,
  available_for_clients: false,
});

export function useTemplateLibrary() {
  return useQuery({
    queryKey: ["site-template-library"],
    queryFn: async (): Promise<LibraryModel[]> => {
      const { data, error } = await supabase.from("site_template_settings").select("*");
      if (error) throw error;
      const map = new Map((data ?? []).map((r) => [r.template_id, r as TemplateSettings]));
      return OFFICIAL_TEMPLATES.map((item, i) => ({
        item,
        id: item.id,
        name: item.name,
        category: LIBRARY_CATEGORY[item.id] ?? item.category,
        description: item.description ?? "",
        preview: item.preview,
        previewRoute: String(item.metadata?.['preview_route']),
        settings: map.get(item.id) ?? DEFAULT_SETTINGS(item.id, i),
      })).sort((a, b) => a.settings.display_order - b.settings.display_order);
    },
  });
}

export function useUpdateTemplateSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (s: TemplateSettings) => {
      const { data: u } = await supabase.auth.getUser();
      const { error } = await supabase
        .from("site_template_settings")
        .upsert({ ...s, updated_at: new Date().toISOString(), updated_by: u.user?.id ?? null });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["site-template-library"] }),
  });
}

export function useProjectTemplate(projectId: string) {
  return useQuery({
    queryKey: ["project-template", projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("id, status, template_id, template_selected_at")
        .eq("id", projectId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

export function useSelectProjectTemplate(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (templateId: string) => {
      const { error } = await supabase.from("projects").update({ template_id: templateId }).eq("id", projectId);
      if (error) {
        if (error.message.includes("TEMPLATE_LOCKED"))
          throw new Error("Este projeto já iniciou a produção. O modelo não pode mais ser alterado.");
        if (error.message.includes("TEMPLATE_UNAVAILABLE")) throw new Error("Modelo indisponível.");
        throw error;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["project-template", projectId] }),
  });
}
