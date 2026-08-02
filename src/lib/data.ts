import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type Table = "leads" | "clients" | "projects" | "transactions" | "withdrawals" | "goals";

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

export function useSaveRow(table: Table) {
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
      queryClient.invalidateQueries({ queryKey: [table] });
      toast.success("Registro salvo.");
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

export function useDeleteRow(table: Table) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from(table).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [table] });
      toast.success("Registro removido.");
    },
    onError: (error: Error) => toast.error(error.message),
  });
}
