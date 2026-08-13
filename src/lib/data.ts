import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type Table =
  | "leads"
  | "clients"
  | "projects"
  | "transactions"
  | "withdrawals"
  | "goals"
  | "lead_activities"
  | "proposals"
  | "contracts"
  | "lead_attribution";

export function useRows<T = Record<string, unknown>>(
  table: Table,
  order: { column: string; ascending?: boolean } = { column: "created_at", ascending: false },
) {
  return useQuery({
    queryKey: [table],
    queryFn: async () => {
      const { data, error } = await supabase
        .from(table)
        .select("*")
        .order(order.column, { ascending: order.ascending ?? false });
      if (error) throw error;
      return (data ?? []) as T[];
    },
  });
}

export function useSaveRow(table: Table, invalidate: Table[] = []) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (values: Record<string, unknown> & { id?: string }) => {
      const { id, ...rest } = values;
      const query = id
        ? supabase.from(table).update(rest as never).eq("id", id)
        : supabase.from(table).insert(rest as never);
      const { error } = await query;
      if (error) throw error;
    },
    onSuccess: () => {
      [table, ...invalidate].forEach((key) => queryClient.invalidateQueries({ queryKey: [key] }));
      // Se salvamos um cliente, também invalidamos a lista de clientes para login
      if (table === "clients") {
        queryClient.invalidateQueries({ queryKey: ["clients-list"] });
      }
      toast.success("Registro salvo.");
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

export function useDeleteRow(table: Table, invalidate: Table[] = []) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from(table).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      [table, ...invalidate].forEach((key) => queryClient.invalidateQueries({ queryKey: [key] }));
      toast.success("Registro removido.");
    },
    onError: (error: Error) => toast.error(error.message),
  });
}
