import { useMutation, useQuery, useQueryCliente } from "@tanstack/react-query";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export const PROSPECTING_SOURCE = "Prospecção ScaleNexus";

/** Nichos sugeridos para a busca de oportunidades. */
export const NICHOS = [
  "Restaurante",
  "Hamburgueria",
  "Pizzaria",
  "Loja de roupas",
  "Dentista",
  "Clínica",
  "Pet Shop",
  "Academia",
  "Salão de beleza",
  "Barbearia",
  "Oficina",
  "Imobiliária",
  "Hotel",
  "Pousada",
  "Contabilidade",
  "Advocacia",
  "Fotografia",
  "Eventos",
  "Outros",
] as const;

export const ESTADOS = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS", "MG",
  "PA", "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO",
] as const;

export const OPPORTUNITY_STATUS = [
  "nova",
  "adicionada_leads",
  "contato_realizado",
  "em_negociacao",
  "convertida_cliente",
  "descartada",
] as const;
export type OpportunityStatus = (typeof OPPORTUNITY_STATUS)[number];

export const OPPORTUNITY_STATUS_LABEL: Record<string, string> = {
  nova: "Nova oportunidade",
  adicionada_leads: "Adicionada aos leads",
  contato_realizado: "Contato realizado",
  em_negociacao: "Em negociação",
  convertida_cliente: "Convertida em cliente",
  descartada: "Descartada",
};

export const LEVEL_LABEL: Record<string, string> = {
  alta: "🔥 Alta oportunidade",
  media: "🟡 Média oportunidade",
  baixa: "🟢 Baixa oportunidade",
};

export type Opportunity = {
  id: string;
  business_name: string;
  category: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  website: string | null;
  instagram: string | null;
  facebook: string | null;
  google_maps_url: string | null;
  lat: number | null;
  lon: number | null;
  place_id: string | null;
  rating: number | null;
  review_count: number;
  has_website: boolean;
  has_social_media: boolean;
  opportunity_level: string;
  source: string;
  status: string;
  notes: string | null;
  lead_id: string | null;
  assigned_to: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  removed_at: string | null;
};

export function useOpportunities(showRemoved = false) {
  return useQuery({
    queryKey: ["prospecting_opportunities", showRemoved],
    queryFn: async () => {
      let query = supabase
        .from("prospecting_opportunities")
        .select("*");
      
      if (showRemoved) {
        query = query.not("removed_at", "is", null);
      } else {
        query = query.is("removed_at", null);
      }

      const { data, error } = await query.order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as Opportunity[];
    },
  });
}

/** Cadastro manual de oportunidade (a busca externa chega na FASE 5.2). */
export function useSaveOpportunity() {
  const queryCliente = useQueryCliente();
  return useMutation({
    mutationFn: async (values: Record<string, unknown> & { id?: string }) => {
      const { id, ...rest } = values;
      const query = id
        ? supabase.from("prospecting_opportunities").update(rest as never).eq("id", id)
        : supabase.from("prospecting_opportunities").insert(rest as never);
      const { error } = await query;
      if (error) {
        if (error.code === "23505") {
          throw new Error("Esta empresa já está cadastrada nas suas oportunidades.");
        }
        throw error;
      }
    },
    onSuccess: () => {
      queryCliente.invalidateQueries({ queryKey: ["prospecting_opportunities"] });
      toast.success("Oportunidade salva.");
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

/** Busca externa de oportunidades via API (Geoapify). */
export function useSearchOpportunities() {
  return useMutation({
    mutationFn: async ({ 
      niche, 
      state, 
      city, 
      precision = "alta", 
      rawMode = false 
    }: { 
      niche: string; 
      state: string; 
      city?: string | null; 
      precision?: "alta" | "ampla";
      rawMode?: boolean;
    }) => {
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;
      
      const payload = { niche, state, city, precision, rawMode };
      console.log(`[Prospecting Search] ${rawMode ? 'RAW ' : ''}Iniciando request para /api/prospecting/search`, payload);

      const response = await fetch("/api/prospecting/search", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Accept": "application/json",
          ...(token ? { "Authorization": `Bearer ${token}` } : {})
        },
        body: JSON.stringify(payload),
      });

      let responseData;
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        responseData = await response.json();
      } else {
        const text = await response.text();
        console.error("[Prospecting Search] Resposta não-JSON do servidor:", text);
        throw new Error(`Erro no servidor: ${response.status} (Formato inválido)`);
      }

      if (!response.ok || responseData.error) {
        const msg = responseData.message || responseData.error || "Erro ao buscar oportunidades.";
        const stage = responseData.stage ? ` [Etapa: ${responseData.stage}]` : '';
        const reqId = responseData.requestId ? ` (ID: ${responseData.requestId})` : '';
        throw new Error(`${msg}${stage}${reqId}`);
      }

      return responseData;
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

async function logStatus(
  opportunityId: string,
  actorId: string,
  previous: string,
  next: string,
  message?: string,
) {
  await supabase.from("prospecting_status_events").insert({
    opportunity_id: opportunityId,
    actor_id: actorId,
    previous_status: previous,
    new_status: next,
    message: message ?? null,
  } as never);
}

export function useChangeOpportunityStatus() {
  const queryCliente = useQueryCliente();
  return useMutation({
    mutationFn: async ({
      opportunity,
      status,
      userId,
    }: {
      opportunity: Opportunity;
      status: string;
      userId: string;
    }) => {
      if (opportunity.status === status) return;
      const { error } = await supabase
        .from("prospecting_opportunities")
        .update({ status } as never)
        .eq("id", opportunity.id);
      if (error) throw error;
      await logStatus(opportunity.id, userId, opportunity.status, status);
    },
    onSuccess: () => {
      queryCliente.invalidateQueries({ queryKey: ["prospecting_opportunities"] });
      queryCliente.invalidateQueries({ queryKey: ["prospecting_status_events"] });
      toast.success("Status atualizado.");
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

/** Converte a oportunidade em lead do CRM, sem duplicar empresas já cadastradas. */
export function useAddOpportunityToLeads() {
  const queryCliente = useQueryCliente();
  return useMutation({
    mutationFn: async ({
      opportunity,
      userId,
    }: {
      opportunity: Opportunity;
      userId: string;
    }) => {
      if (opportunity.lead_id) {
        throw new Error("Esta empresa já está cadastrada nos seus leads.");
      }

      const { data: existing, error: findError } = await supabase
        .from("leads")
        .select("id, company, phone, whatsapp, city, state")
        .eq("owner_id", userId);
      if (findError) throw findError;

      const digits = (value: string | null | undefined) => (value ?? "").replace(/\D/g, "");
      const normalize = (value: string | null | undefined) =>
        (value ?? "").trim().toLocaleLowerCase("pt-BR");

      const duplicate = (existing ?? []).find((lead) => {
        const sameName =
          normalize(lead.company) === normalize(opportunity.business_name) &&
          normalize(lead.city) === normalize(opportunity.city) &&
          normalize(lead.state) === normalize(opportunity.state);
        const oppPhone = digits(opportunity.phone);
        const samePhone =
          oppPhone.length >= 8 &&
          (digits(lead.phone) === oppPhone || digits(lead.whatsapp) === oppPhone);
        return sameName || samePhone;
      });

      if (duplicate) {
        await supabase
          .from("prospecting_opportunities")
          .update({ lead_id: duplicate.id, status: "adicionada_leads" } as never)
          .eq("id", opportunity.id);
        throw new Error("Esta empresa já está cadastrada nos seus leads.");
      }

      const { data: lead, error: insertError } = await supabase
        .from("leads")
        .insert({
          owner_id: userId,
          name: opportunity.business_name,
          company: opportunity.business_name,
          trade_name: opportunity.business_name,
          niche: opportunity.category,
          phone: opportunity.phone,
          whatsapp: opportunity.phone,
          email: opportunity.email,
          website: opportunity.website,
          instagram: opportunity.instagram,
          city: opportunity.city,
          state: opportunity.state,
          address: opportunity.address,
          google_maps_url: opportunity.google_maps_url,
          lat: opportunity.lat,
          lon: opportunity.lon,
          source: PROSPECTING_SOURCE,
          status: "novo",
          estimated_value: 0,
          notes: opportunity.facebook ? `Facebook: ${opportunity.facebook}` : null,
        } as never)
        .select("id")
        .single();
      if (insertError) throw insertError;

      const { error: updateError } = await supabase
        .from("prospecting_opportunities")
        .update({ lead_id: lead.id, status: "adicionada_leads" } as never)
        .eq("id", opportunity.id);
      if (updateError) throw updateError;

      await logStatus(
        opportunity.id,
        userId,
        opportunity.status,
        "adicionada_leads",
        "Empresa adicionada aos leads pela Central de Prospecção.",
      );

      return lead.id as string;
    },
    onSuccess: () => {
      queryCliente.invalidateQueries({ queryKey: ["prospecting_opportunities"] });
      queryCliente.invalidateQueries({ queryKey: ["leads"] });
      toast.success("Empresa adicionada aos seus leads com sucesso.");
    },
    onError: (error: Error) => toast.error(error.message),
  });
}
