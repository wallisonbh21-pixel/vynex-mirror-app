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
        serviceId: "SERVIÇO DE INTERESSE",
        objective: "OBJETIVO DO PROJETO",
        needs: "NECESSIDADE DO CLIENTE",
        references: "REFERÊNCIA",
        currentWebsite: "SITE ATUAL",
        socialMedia: "REDES SOCIAIS",
        observations: "OBSERVAÇÕES ADICIONAIS",
      };

      // 4. Mapeamento de botões para campos de link
      const linkButtonMap: Record<string, string> = {
        references: "Abrir referência",
        currentWebsite: "Abrir site",
        socialMedia: "Abrir rede social",
      };

      // 5. Ordem de exibição desejada
      const displayOrder = [
        "serviceId",
        "objective",
        "needs",
        "references",
        "currentWebsite",
        "socialMedia",
        "observations",
      ];

      // 6. Extrair necessidades das notas legíveis (retrocompatibilidade)
      const needsMatch = leadNotes?.match(/Interesse inicial:\s*([\s\S]*?)(?:\nServiço:|$)/i);
      let legacyNeeds = needsMatch && needsMatch[1] ? needsMatch[1].trim() : null;
      
      // Se não achou nada estruturado, pode ser o formato ultra-legado onde a primeira linha é a necessidade
      if (!legacyNeeds && leadNotes && !leadNotes.includes("Dados do Briefing:")) {
        legacyNeeds = leadNotes.split('\n')[0]?.trim() || null;
      }

      // 7. Normalizar dynamicData
      const normalizedData: any[] = [];
      
      displayOrder.forEach((key) => {
        let value = dynamicData[key];

        // Regra de não duplicação: se objective e needs forem iguais, limpa needs
        if (key === "needs" && value && value === dynamicData["objective"]) {
          value = null;
        }

        // Retrocompatibilidade para needs
        if (key === "needs" && !value && legacyNeeds && legacyNeeds !== "—") {
          value = legacyNeeds;
        }

        // Resolver serviceName para serviceId
        if (key === "serviceId") {
          value = serviceName !== "—" ? serviceName : null;
        }

        if (value && typeof value === 'string' && value.trim() !== '' && value !== "—") {
          normalizedData.push({
            key,
            label: labelMap[key] || key,
            value: value.trim(),
            buttonLabel: linkButtonMap[key],
          });
        }
      });

      return {
        briefingItems: normalizedData,
      };
    },
    enabled: !!leadId,
  });
}