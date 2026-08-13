import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const leadFormSchema = z.object({
  name: z.string().min(2),
  company: z.string().optional(),
  email: z.string().email(),
  whatsapp: z.string().min(10),
  city: z.string(),
  state: z.string(),
  segment: z.string(),
  serviceId: z.string().uuid(),
  referralToken: z.string().optional(),
  details: z.object({
    objective: z.string().optional(),
    needs: z.string().optional(),
    observations: z.string().optional(),
    references: z.string().optional(),
    socialMedia: z.string().optional(),
    currentWebsite: z.string().optional(),
  }).optional(),
});

export const submitLeadForm = createServerFn({ method: "POST" })
  .validator((data: unknown) => leadFormSchema.parse(data))
  .handler(async ({ data }) => {
    // Importação dinâmica para evitar vazamento de tipos de servidor para o cliente
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const email = data.email.toLowerCase().trim();
    const whatsapp = data.whatsapp.replace(/\D/g, "");

    // 1. Verificar Duplicidade
    const { data: existingLead } = await supabaseAdmin
      .from("leads")
      .select("id, name")
      .or(`email.eq.${email},whatsapp.eq.${whatsapp}`)
      .maybeSingle();

    if (existingLead) {
      // Registrar atividade no lead existente
      await supabaseAdmin.from("lead_activities").insert({
        lead_id: existingLead.id,
        user_id: "00000000-0000-0000-0000-000000000000", // System/Public User placeholder if needed, or identify as system
        type: "status",
        description: `Novo interesse recebido pelo formulário público para o serviço: ${data.serviceId}. Detalhes: ${data.details?.objective || 'N/A'}`,
        happened_at: new Date().toISOString(),
      } as any);

      return { success: true, message: "Interesse registrado com sucesso.", isNew: false };
    }

    // 2. Validar Referral Token (Somente token de texto seguro)
    let originatorId = null;
    let referralTokenId = null;

    if (data.referralToken) {
      const { data: tokenData } = await supabaseAdmin
        .from("referral_tokens")
        .select("id, seller_id")
        .eq("token", data.referralToken)
        .eq("is_active", true)
        .maybeSingle();

      if (tokenData) {
        originatorId = tokenData.seller_id;
        referralTokenId = tokenData.id;
      }
    }

    // Se não houver indicação, atribuir ao admin (placeholder ou nulo conforme regra)
    // Buscando um admin para ser o responsável padrão
    if (!originatorId) {
       const { data: adminUser } = await supabaseAdmin
        .from("user_roles")
        .select("user_id")
        .eq("role", "admin")
        .limit(1)
        .maybeSingle();
       
       originatorId = adminUser?.user_id;
    }

    // 3. Criar Lead
    const { data: newLead, error: leadError } = await supabaseAdmin
      .from("leads")
      .insert({
        name: data.name,
        company: data.company || null,
        email: email,
        whatsapp: whatsapp,
        city: data.city,
        state: data.state,
        niche: data.segment,
        status: "novo", // Correspondente a "NOVO — AGUARDANDO CONTATO" na UI
        source: data.referralToken ? "indicacao" : "site_publico",
        owner_id: originatorId || "00000000-0000-0000-0000-000000000000", // Fallback system ID
        notes: `Interesse inicial: ${data.details?.objective || ''}\nServiço: ${data.serviceId}`,
      } as any)
      .select("id")
      .single();

    if (leadError) throw leadError;

    // 4. Criar Atribuição
    if (newLead) {
      await supabaseAdmin.from("lead_attribution").insert({
        lead_id: newLead.id,
        originator_id: originatorId || "00000000-0000-0000-0000-000000000000",
        current_responsible_id: originatorId || "00000000-0000-0000-0000-000000000000",
        referral_token_id: referralTokenId,
      } as any);

      // 5. Atividade Inicial
      await supabaseAdmin.from("lead_activities").insert({
        lead_id: newLead.id,
        user_id: originatorId || "00000000-0000-0000-0000-000000000000",
        type: "status",
        description: `Lead criado via formulário público. Origem: ${data.referralToken ? 'Indicação' : 'Direto'}.`,
        happened_at: new Date().toISOString(),
      } as any);
    }

    return { success: true, message: "Lead criado com sucesso.", isNew: true };
  });
