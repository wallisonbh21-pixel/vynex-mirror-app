import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type PersonProfile = {
  id: string;
  full_name: string | null;
  nickname: string | null;
};

/** Lista de perfis da equipe (visível para administradores). */
export function useProfiles() {
  return useQuery({
    queryKey: ["profiles", "equipe"],
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("id, full_name, nickname");
      if (error) throw error;
      return (data ?? []) as unknown as PersonProfile[];
    },
  });
}
