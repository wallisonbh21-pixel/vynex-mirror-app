import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useLeadBriefing(leadId: string, leadNotes: string | null) {
  return useQuery({
    queryKey: ["lead-briefing", leadId],
    queryFn: async () => {
      // 1. Extrair ID do serviço das notas se possível
      // Formato esperado: ... \nServiço: UUID
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

      // 2. Extrair necessidades
      // Formato esperado: Interesse inicial: Conteúdo \nServiço: ...
      const needsMatch = leadNotes?.match(/Interesse inicial:\s*([\s\S]*?)(?:\nServiço:|$)/i);
      const needs = needsMatch ? needsMatch[1].trim() : leadNotes || "—";

      return {
        serviceName,
        needs,
        objective: null, // Pode ser expandido se guardarmos mais campos
      };
    },
    enabled: !!leadId,
  });
}
