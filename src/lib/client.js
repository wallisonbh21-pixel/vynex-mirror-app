import { useMutation, useQuery, useQueryCliente } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/lib/auth";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import { createClientePortalAccount } from "./onboarding.functions";
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
                .eq("user_id", user.id)
                .maybeSingle();
            if (error)
                throw error;
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
            if (error)
                throw error;
            return data;
        },
    });
}
/**
 * Busca dados detalhados do cliente para o portal.
 */
export function useClientePortalData() {
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
                .eq("user_id", user.id)
                .maybeSingle();
            if (error)
                throw error;
            return data;
        },
    });
}
/**
 * Busca a listagem de clientes para Admin/Vendedor.
 * @param ownerId Se fornecido, filtra pelos clientes do vendedor.
 */
export function useClientesList(ownerId, statusFilter) {
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
    const queryCliente = useQueryCliente();
    const onboardFn = useServerFn(createClientePortalAccount);
    return useMutation({
        mutationFn: async (params) => {
            return onboardFn({ data: params });
        },
        onSuccess: (data) => {
            queryCliente.invalidateQueries({ queryKey: ["clients-list"] });
            if (data.success) {
                toast.success(data.message || "Acesso ao portal ativado!", { duration: 6000 });
            }
            else {
                toast.warning(data.message, { duration: 8000 });
            }
        },
        onError: (error) => {
            toast.error(error.message || "Erro ao ativar acesso ao portal.");
        },
    });
}
/**
 * Hook para cadastrar um novo cliente.
 */
export function useRegisterCliente() {
    const queryCliente = useQueryCliente();
    const registerFn = useServerFn(registerNewCliente);
    return useMutation({
        mutationFn: async (values) => {
            return registerFn({ data: values });
        },
        onSuccess: (data) => {
            queryCliente.invalidateQueries({ queryKey: ["clients-list"] });
            if (data.success) {
                toast.success(data.message || "Clientee cadastrado com sucesso!");
            }
            else {
                toast.error(data.message || "Erro no cadastro.");
            }
        },
        onError: (error) => {
            toast.error(error.message || "Erro ao cadastrar cliente.");
        },
    });
}
/**
 * Hook para excluir um cliente.
 */
export function useDeleteCliente() {
    const queryCliente = useQueryCliente();
    const deleteFn = useServerFn(deleteCliente);
    return useMutation({
        mutationFn: async (clientId) => {
            return deleteFn({ data: { clientId } });
        },
        onSuccess: (data) => {
            queryCliente.invalidateQueries({ queryKey: ["clients"] });
            queryCliente.invalidateQueries({ queryKey: ["clients-list"] });
            if (data.success) {
                toast.success(data.message || "Clientee excluído.");
            }
        },
        onError: (error) => {
            toast.error(error.message || "Erro ao excluir cliente.");
        },
    });
}
