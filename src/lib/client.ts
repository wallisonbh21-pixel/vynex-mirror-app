import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/lib/auth";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import { createClientPortalAccount } from "./onboarding.functions";
import { registerNewCliente } from "./client-registration.functions";
import { deleteCliente } from "./client-deletion.functions";



/**
 * Hook legado mantido para compatibilidade com o Portal do Clientee existente.
 */
export function useClienteData() {
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
 * Hook legado mantido para compatibilidade com o Portal do Clientee existente.
 */
export function useClienteProjetos() {
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
export function useClientePortalData() {
  const { user, loading: sessionLoading } = useSession();
  const query = useQuery({
    queryKey: ["client-portal-data", user?.id],
    enabled: !!user,
    retry: 1,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clients")
        .select(`
          *,
          projects(
            *,
            contracts(title, amount, status)
          )
        `)
        .eq("user_id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  return {
    ...query,
    // Sem sessão resolvida ainda: continua carregando.
    // Sessão resolvida e sem utilizador: não fica preso em loading.
    isLoading: sessionLoading || (!!user && query.isLoading),
    isError: query.isError || (!sessionLoading && !user),
  };
}

/**
 * Busca a listagem de clientes para Admin/Vendedor.
 * @param ownerId Se fornecido, filtra pelos clientes do vendedor.
 */
export function useClientesList(ownerId?: string, statusFilter?: string) {
  return useQuery({
    queryKey: ["clients-list", ownerId, statusFilter],
    queryFn: async () => {
      // Reutilizando a mesma fonte de dados e lógica da página CLIENTES
      // Buscamos diretamente de "clients" garantindo que campos necessários para o seletor estejam presentes

      // CONSULTA SIMPLIFICADA PARA TESTE DE DIAGNÓSTICO (REQUISITO 3)
      let query = supabase
        .from("clients")
        .select("id, company, contact_name, contact_email, status, owner_id, user_id, created_at");
      
      if (ownerId) {
        query = query.eq("owner_id", ownerId);
      }

      if (statusFilter) {
        query = query.eq("status", statusFilter);
      }

      const { data, error } = await query.order("created_at", { ascending: false });
      
      if (error) {
        throw error;
      }
      
      return data;
    },
    // Garantir que a query seja renovada ao abrir o modal
    staleTime: 0,
    gcTime: 0,
  });
}

/**
 * Hook para gerenciar o onboarding de clientes (criação de conta e vínculo).
 */
export function useClienteOnboarding() {
  const queryCliente = useQueryClient();
  const onboardFn = useServerFn(createClientPortalAccount);

  return useMutation({
    mutationFn: async (params: { email: string; fullName: string; clientId: string; username: string }) => {
      return onboardFn({ data: params });
    },
    onSuccess: (data: any) => {
      queryCliente.invalidateQueries({ queryKey: ["clients-list"] });
      if (data.success) {
        toast.success(data.message || "Acesso ao portal ativado!", { duration: 6000 });
      } else {
        toast.warning(data.message, { duration: 8000 });
      }
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao ativar acesso ao portal.");
    },
  });
}

/**
 * Hook para cadastrar um novo cliente.
 */
export function useRegisterCliente() {
  const queryCliente = useQueryClient();
  const registerFn = useServerFn(registerNewCliente);

  return useMutation({
    mutationFn: async (values: any) => {
      return registerFn({ data: values });
    },
    onSuccess: (data: any) => {
      queryCliente.invalidateQueries({ queryKey: ["clients-list"] });
      if (data.success) {
        toast.success(data.message || "Clientee cadastrado com sucesso!");
      } else {
        toast.error(data.message || "Erro no cadastro.");
      }
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao cadastrar cliente.");
    },
  });
}

/**
 * Hook para excluir um cliente.
 */
export function useDeleteCliente() {
  const queryCliente = useQueryClient();
  const deleteFn = useServerFn(deleteCliente);

  return useMutation({
    mutationFn: async (clientId: string) => {
      return deleteFn({ data: { clientId } });
    },
    onSuccess: (data: any) => {
      queryCliente.invalidateQueries({ queryKey: ["clients"] });
      queryCliente.invalidateQueries({ queryKey: ["clients-list"] });
      if (data.success) {
        toast.success(data.message || "Clientee excluído.");
      }
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao excluir cliente.");
    },
  });
}

