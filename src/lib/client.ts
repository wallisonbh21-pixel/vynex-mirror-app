import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/lib/auth";

/**
 * Hook legado mantido para compatibilidade com o Portal do Cliente existente.
 */
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

/**
 * Hook legado mantido para compatibilidade com o Portal do Cliente existente.
 */
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

/**
 * Busca dados detalhados do cliente para o portal.
 */
export function useClientPortalData() {
  const { user } = useSession();
  return useQuery({
    queryKey: ["client-portal-data", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clients")
        .select(`
          *,
          projects(
            *,
            contracts(title, amount, status),
            briefings(status, updated_at),
            site_plans(status)
          )
        `)
        .eq("user_id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

/**
 * Busca a listagem de clientes para Admin/Vendedor.
 * @param ownerId Se fornecido, filtra pelos clientes do vendedor.
 */
export function useClientsList(ownerId?: string) {
  return useQuery({
    queryKey: ["clients-list", ownerId],
    queryFn: async () => {
      let query = supabase
        .from("clients")
        .select(`
          *,
          projects(id, title, status),
          profiles:user_id(full_name, avatar_url)
        `);
      
      if (ownerId) {
        query = query.eq("owner_id", ownerId);
      }

      const { data, error } = await query.order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}
