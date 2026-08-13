import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { today } from "@/lib/format";

export type Lead = {
  id: string;
  owner_id: string;
  name: string;
  company: string | null;
  trade_name: string | null;
  niche: string | null;
  phone: string | null;
  whatsapp: string | null;
  email: string | null;
  website: string | null;
  instagram: string | null;
  city: string | null;
  state: string | null;
  address: string | null;
  google_maps_url: string | null;
  lat: number | null;
  lon: number | null;
  source: string | null;
  status: string;
  estimated_value: number;
  closed_value: number;
  closed_at: string | null;
  next_contact_at: string | null;
  notes: string | null;
  created_at: string;
};

export type Activity = {
  id: string;
  lead_id: string;
  user_id: string;
  type: string;
  description: string;
  happened_at: string;
  next_contact_at: string | null;
  created_at: string;
};

export type Proposal = {
  id: string;
  lead_id: string | null;
  owner_id: string;
  title: string;
  amount: number;
  monthly_fee: number;
  description: string | null;
  services: string | null;
  deadline_days: number;
  notes: string | null;
  status: string;
  sent_at: string | null;
  created_at: string;
};

export type Contract = {
  id: string;
  owner_id: string;
  lead_id: string | null;
  client_id: string | null;
  proposal_id: string | null;
  title: string;
  amount: number;
  monthly_fee: number;
  status: string;
  signed_at: string;
  notes: string | null;
  created_at: string;
};

export function useLead(id: string) {
  return useQuery({
    queryKey: ["leads", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("leads").select("*").eq("id", id).maybeSingle();
      if (error) throw error;
      return data as Lead | null;
    },
  });
}

export function useActivities(leadId?: string) {
  return useQuery({
    queryKey: ["lead_activities", leadId ?? "all"],
    queryFn: async () => {
      let query = supabase
        .from("lead_activities")
        .select("*")
        .order("happened_at", { ascending: false })
        .order("created_at", { ascending: false });
      if (leadId) query = query.eq("lead_id", leadId);
      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as Activity[];
    },
  });
}

export function useLogActivity() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (values: {
      lead_id: string;
      user_id: string;
      type: string;
      description: string;
      happened_at?: string;
      next_contact_at?: string | null;
    }) => {
      const { error } = await supabase.from("lead_activities").insert({
        ...values,
        happened_at: values.happened_at || today(),
      } as never);
      if (error) throw error;
      if (values.next_contact_at) {
        await supabase
          .from("leads")
          .update({ next_contact_at: values.next_contact_at } as never)
          .eq("id", values.lead_id);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lead_activities"] });
      queryClient.invalidateQueries({ queryKey: ["leads"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

/** Muda o status do lead e registra a mudança na linha do tempo. */
export function useChangeLeadStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      lead,
      status,
      userId,
    }: {
      lead: Lead;
      status: string;
      userId: string;
    }) => {
      if (lead.status === status) return;
      const patch: Record<string, unknown> = { status };
      if (status === "fechado") patch['closed_at'] = new Date().toISOString();
      const { error } = await supabase.from("leads").update(patch as never).eq("id", lead.id);
      if (error) throw error;
      await supabase.from("lead_activities").insert({
        lead_id: lead.id,
        user_id: userId,
        type: "status",
        description: `Status alterado de ${lead.status} para ${status}.`,
        happened_at: today(),
      } as never);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      queryClient.invalidateQueries({ queryKey: ["lead_activities"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

/** Converte um lead fechado em cliente + contrato + projeto inicial. */
export function useConvertLead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      lead,
      userId,
      amount,
      monthlyFee,
      proposalId,
    }: {
      lead: Lead;
      userId: string;
      amount: number;
      monthlyFee: number;
      proposalId?: string | null;
    }) => {
      // 1. Normalização para verificação de duplicidade
      const email = lead.email?.toLowerCase().trim();
      const whatsapp = lead.whatsapp?.replace(/\D/g, "");

      // 2. Verificar duplicidade de cliente
      if (email || whatsapp) {
        let query = supabase.from("clients").select("id, contact_name");
        if (email && whatsapp) {
          query = query.or(`contact_email.eq.${email},contact_phone.eq.${whatsapp}`);
        } else if (email) {
          query = query.eq("contact_email", email);
        } else if (whatsapp) {
          query = query.eq("contact_phone", whatsapp);
        }

        const { data: existingClients } = await query;
        if (existingClients && existingClients.length > 0) {
          toast.warning(`Atenção: Já existe um cliente com este e-mail/WhatsApp (${existingClients[0]?.contact_name}). Verifique antes de prosseguir.`);
          // Não paramos a execução, mas alertamos o usuário conforme regra 3 (não fundir automático, sinalizar).
        }
      }

      const companyName = lead.company || lead.trade_name || lead.name;

      // 3. Buscar atribuição do lead para transferir ao cliente
      const { data: attributionData } = await supabase
        .from("lead_attribution" as any)
        .select("*")
        .eq("lead_id", lead.id)
        .maybeSingle();

      const attribution = attributionData as any;

      // 4. Criar o Cliente (Comercial)
      const { data: client, error: clientError } = await supabase
        .from("clients")
        .insert({
          owner_id: attribution?.current_responsible_id || userId,
          company: companyName,
          niche: lead.niche,
          city: lead.city,
          contact_name: lead.name,
          contact_email: lead.email,
          contact_phone: lead.whatsapp || lead.phone,
          monthly_fee: monthlyFee,
          status: "ativo",
          lead_id: lead.id,
        } as never)
        .select("id")
        .single();
      if (clientError) throw clientError;

      const clientId = (client as { id: string }).id;

      // 5. Criar Contrato
      const { data: contract, error: contractError } = await supabase
        .from("contracts")
        .insert({
          owner_id: attribution?.current_responsible_id || userId,
          lead_id: lead.id,
          client_id: clientId,
          proposal_id: proposalId ?? null,
          title: `Contrato — ${companyName}`,
          amount,
          monthly_fee: monthlyFee,
          status: "ativo",
          signed_at: today(),
        } as never)
        .select("id")
        .single();
      if (contractError) throw contractError;

      const contractId = (contract as { id: string }).id;

      await supabase
        .from("clients")
        .update({ contract_id: contractId } as never)
        .eq("id", clientId);

      // 6. Criar Projeto
      const { error: projectError } = await supabase.from("projects").insert({
        owner_id: attribution?.current_responsible_id || userId,
        client_id: clientId,
        contract_id: contractId,
        title: `Site — ${companyName}`,
        status: "disponivel",
        value: amount,
        lead_id: lead.id,
      } as never);
      if (projectError) throw projectError;

      // 7. Atualizar Status do Lead
      const { error: leadError } = await supabase
        .from("leads")
        .update({
          status: "fechado",
          closed_at: new Date().toISOString(),
          closed_value: amount,
        } as never)
        .eq("id", lead.id);
      if (leadError) throw leadError;

      // 8. Registrar Atividade
      await supabase.from("lead_activities").insert({
        lead_id: lead.id,
        user_id: userId,
        type: "status",
        description: `Lead convertido em cliente. Originador: ${attribution?.originator_id || 'N/A'}. Acesso ao Portal: PENDENTE.`,
        happened_at: today(),
      } as never);
    },
    onSuccess: () => {
      ["leads", "clients", "contracts", "projects", "lead_activities"].forEach((key) =>
        queryClient.invalidateQueries({ queryKey: [key] }),
      );
      toast.success("Conversão comercial concluída com sucesso. Acesso ao Portal pendente.");
    },
    onError: (error: Error) => toast.error(error.message),
  });
}
