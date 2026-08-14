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
      // Formato esperado: Interesse inicial: ... \nServiço: ... \nDados do Briefing: JSON
      const briefingJsonMatch = leadNotes?.match(/Dados do Briefing:\s*(\{.*\})/i);
      let dynamicData: Record<string, any> = {};

      if (briefingJsonMatch && briefingJsonMatch[1]) {
        try {
          dynamicData = JSON.parse(briefingJsonMatch[1]);
        } catch (e) {
          console.error("Erro ao processar JSON do briefing:", e);
        }
      }

      // 3. Extrair necessidades e objetivo das notas legíveis (fallback ou para manter compatibilidade)
      const needsMatch = leadNotes?.match(/Interesse inicial:\s*([\s\S]*?)(?:\nServiço:|$)/i);
      const needs = needsMatch && needsMatch[1] ? needsMatch[1].trim() : (leadNotes?.split('\n')[0] || "—");

      return {
        serviceName,
        needs,
        dynamicData,
      };
    },
    enabled: !!leadId,
  });
}
