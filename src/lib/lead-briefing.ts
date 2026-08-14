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

      // 3. Extrair necessidades das notas legíveis
      const needsMatch = leadNotes?.match(/Interesse inicial:\s*([\s\S]*?)(?:\nServiço:|$)/i);
      let needs = dynamicData["needs"] || (needsMatch && needsMatch[1] ? needsMatch[1].trim() : (leadNotes?.split('\n')[0] || "—"));

      // 4. Se o JSON existe mas não tem 'needs', e o needsMatch pegou algo, garantir que está no dynamicData para renderização unificada
      if (!dynamicData["needs"] && needsMatch && needsMatch[1]) {
        dynamicData["needs"] = needsMatch[1].trim();
      }
      
      // Se ainda assim não temos needs no dynamicData mas temos na variável needs, injetar
      if (!dynamicData["needs"] && needs && needs !== "—") {
        dynamicData["needs"] = needs;
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
