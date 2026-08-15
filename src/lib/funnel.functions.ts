import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export const leadFormSchema = z.object({
  name: z.string().min(2),
  company: z.string().optional(),
  email: z.string().email(),
  whatsapp: z.string().min(10),
  city: z.string(),
  state: z.string(),
  segment: z.string(),
  serviceId: z.string().uuid(),
  referralToken: z.string().optional(),
  details: z.record(z.string(), z.any()).optional(),
});

const DEFAULT_ADMIN_ID = "ce4c32ee-583a-456c-8f0b-a516188d196b";

export const submitLeadForm = createServerFn({ method: "POST" })
  .validator((data: unknown) => leadFormSchema.parse(data))
  .handler(async ({ data }) => {
    try {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

      const email = data.email.toLowerCase().trim();
      const whatsapp = data.whatsapp.replace(/\D/g, "");

      // 1. Validar Serviço (serviceId)
      const { data: service, error: serviceFetchError } = await supabaseAdmin
        .from("services_catalog")
        .select("id, name, is_active")
        .eq("id", data.serviceId)
        .maybeSingle();
      
      

      if (serviceFetchError) {
        console.error("Erro ao buscar serviço:", serviceFetchError);
        throw new Error("Erro de comunicação ao validar o serviço escolhido.");
      }

      if (!service) {
        throw new Error("O serviço selecionado não foi encontrado no nosso catálogo.");
      }

      if (!service.is_active) {
        throw new Error(`O serviço "${service.name}" não está disponível no momento.`);
      }

      // 2. Verificar Duplicidade
      const { data: existingLead } = await supabaseAdmin
        .from("leads")
        .select("id, name")
        .or(`email.eq.${email},whatsapp.eq.${whatsapp}`)
        .maybeSingle();

      if (existingLead) {
        await supabaseAdmin.from("lead_activities").insert({
          lead_id: existingLead.id,
          user_id: "00000000-0000-0000-0000-000000000000",
          type: "status",
          description: `Novo interesse recebido via Funil. Serviço: ${service.name}. Objetivo: ${data.details?.['objective'] || 'N/A'}`,
          happened_at: new Date().toISOString(),
        } as any);

        const dupResponse = { success: true, message: "Interesse registrado com sucesso.", isNew: false };
        
        return dupResponse;
      }

      // 3. Processar Referral Token
      let originatorId = null;
      let referralTokenId = null;
      let source = "direto";
      let displaySource = "ScaleNexus / Direto";

      if (data.referralToken) {
        const { data: tokenData, error: tokenError } = await supabaseAdmin
          .from("referral_tokens")
          .select("id, seller_id, is_active, is_institutional")
          .eq("token", data.referralToken)
          .maybeSingle();

        if (tokenError) {
          console.error("Erro ao validar token:", tokenError);
          throw new Error("Erro técnico ao processar sua indicação.");
        }

        if (tokenData) {
          if (!tokenData.is_active) {
            throw new Error("Este link de indicação não está mais ativo. Por favor, utilize o link oficial da ScaleNexus.");
          }

          referralTokenId = tokenData.id;
          
          if (tokenData.is_institutional) {
            source = "indicacao_institucional";
            displaySource = "ScaleNexus / Institucional";
            originatorId = tokenData.seller_id; 
          } else {
            source = "indicacao";
            displaySource = "Indicação de Vendedor";
            originatorId = tokenData.seller_id;
          }
        } else {
          throw new Error("O link de indicação utilizado é inválido.");
        }
      }
      
      

      // 4. Criar Lead
      const { data: newLead, error: leadError } = await supabaseAdmin
        .from("leads")
        .insert({
          name: data.name,
          company: data.company || null,
          estimated_value: 0,
          closed_value: 0,

          email: email,
          whatsapp: whatsapp,
          city: data.city,
          state: data.state,
          niche: data.segment,
          status: "novo",
          source: source,
          owner_id: originatorId || DEFAULT_ADMIN_ID, 
          notes: `Origem: ${displaySource}\nInteresse inicial: ${data.details?.['objective'] || data.details?.['needs'] || ''}\nServiço Escolhido: ${service.name} (ID: ${service.id})\nDados do Briefing: ${JSON.stringify(data.details || {})}`,
        } as any)
        .select("id")
        .single();
      
      

      if (leadError) {
        console.error("Erro ao criar lead:", leadError);
        throw new Error("Falha ao salvar os dados do lead no banco.");
      }

      // 5. Criar Atribuição Comercial
      if (newLead) {
        const { error: attrError } = await supabaseAdmin.from("lead_attribution").insert({
          lead_id: newLead.id,
          originator_id: originatorId, 
          current_responsible_id: (source === "indicacao" && originatorId) ? originatorId : DEFAULT_ADMIN_ID,
          referral_token_id: referralTokenId,
        } as any);

        if (attrError) {
          console.error("Erro ao criar atribuição:", attrError);
        }
        
        

        // 6. Atividade Inicial
        await supabaseAdmin.from("lead_activities").insert({
          lead_id: newLead.id,
          user_id: originatorId || DEFAULT_ADMIN_ID,
          type: "status",
          description: `Lead criado via formulário público. Origem: ${displaySource}.`,
          happened_at: new Date().toISOString(),
        } as any);
        
        
      }
      
      const response = { success: true, message: "Lead criado com sucesso.", isNew: true };
      
      return response;

    } catch (error: any) {
      console.error("Erro no processamento do Funil:", error);
      return { 
        success: false, 
        message: error.message || "Ocorreu um erro inesperado ao processar sua solicitação. Por favor, tente novamente mais tarde." 
      };
    }
  });