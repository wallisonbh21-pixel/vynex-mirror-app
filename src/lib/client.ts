import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/lib/auth";

export function useClientData() {
  const { user } = useSession();
  return useQuery({
    queryKey: ["client-profile", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clients")
        .select("*")
        .eq("user_id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

export function useClientProjects() {
  const { user } = useSession();
  return useQuery({
    queryKey: ["client-projects", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select(`
          *,
          contracts(title, amount),
          clients(company, contact_name)
        `)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}
