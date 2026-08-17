import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useLeadBriefing(leadId: string, leadNotes: string | null) {
  return useQuery({
    queryKey: ["lead-briefing", leadId, leadNotes],
    queryFn: async () => {
      // 1. Extrair ID do serviço das notas se possível
      const serviceMatch = leadNotes?.match(/Serviço:\s*([0-9a-f-]{36})/i);
      const serviceId = serviceMatch ? serviceMatch[1] : null;

      let serviceName = "—";
      if (serviceId) {
        const { data: service } = await supabase
          .from("services_catalog")
          .select("name")
          .eq("id", serviceId)
          .maybeSingle();
        if (service) serviceName = service.name;
      }

      // 2. Extrair dados estruturados das notas
      const briefingJsonMatch = leadNotes?.match(/Dados do Briefing:\s*(\{.*\})/i);
      let dynamicData: Record<string, any> = {};

      if (briefingJsonMatch && briefingJsonMatch[1]) {
        try {
          dynamicData = JSON.parse(briefingJsonMatch[1]);
        } catch (e) {
          console.error("Erro ao processar JSON do briefing:", e);
        }
      }

      // 3. Mapeamento de labels amigáveis para campos conhecidos
      const labelMap: Record<string, string> = {
        objective: "Objetivo do projeto",
        needs: "Necessidade do cliente",
        observations: "Observações adicionais",
        references: "Referência / Site de referência",
        socialMedia: "Redes sociais",
        currentSite: "Site atual",
        name: "Nome do cliente",
        company: "Empresa",
        email: "E-mail",
        whatsapp: "WhatsApp",
        city: "Cidade",
        state: "Estado",
        segment: "Nicho/Segmento",
        serviceId: "Serviço de interesse"
      };

      // 4. Extrair necessidades das notas legíveis (retrocompatibilidade)
      const needsMatch = leadNotes?.match(/Interesse inicial:\s*([\s\S]*?)(?:\nServiço:|$)/i);
      let needs = dynamicData["needs"] || (needsMatch && needsMatch[1] ? needsMatch[1].trim() : (leadNotes?.split('\n')[0] || "—"));

      // 5. Normalizar dynamicData para garantir que todos os campos tenham labels e valores limpos
      const normalizedData: Record<string, { label: string, value: any }> = {};
      
      // Primeiro, processar o dynamicData (JSON)
      Object.entries(dynamicData).forEach(([key, value]) => {
        if (value === undefined || value === null || (typeof value === 'string' && value.trim() === '')) return;
        normalizedData[key] = {
          label: labelMap[key] || key,
          value
        };
      });

      // Garantir que 'needs' esteja presente se extraído das notas legíveis
      if (!normalizedData["needs"] && needs && needs !== "—") {
        normalizedData["needs"] = {
          label: labelMap["needs"] || "Necessidade do cliente",
          value: needs
        };
      }

      return {
        serviceName,
        needs,
        dynamicData: normalizedData,
      };
    },
    enabled: !!leadId,
  });
}