import { useMutation, useQuery, useQueryCliente } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/lib/auth";

export type Notification = {
  id: string;
  user_id: string;
  title: string;
  body: string | null;
  category: string;
  link: string | null;
  project_id: string | null;
  read_at: string | null;
  created_at: string;
};

/** Notificações internas do usuário logado. */
export function useNotifications() {
  const { user } = useSession();
  return useQuery({
    queryKey: ["notifications", user?.id],
    enabled: !!user,
    refetchInterval: 60_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return (data ?? []) as unknown as Notification[];
    },
  });
}

export function useMarkNotificationRead() {
  const queryCliente = useQueryCliente();
  const { user } = useSession();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("notifications")
        .update({ read_at: new Date().toISOString() } as never)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryCliente.invalidateQueries({ queryKey: ["notifications", user?.id] }),
    onError: (error: Error) => toast.error(error.message),
  });
}

export function useMarkAllNotificationsRead() {
  const queryCliente = useQueryCliente();
  const { user } = useSession();
  return useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("notifications")
        .update({ read_at: new Date().toISOString() } as never)
        .eq("user_id", user!.id)
        .is("read_at", null);
      if (error) throw error;
    },
    onSuccess: () => {
      queryCliente.invalidateQueries({ queryKey: ["notifications", user?.id] });
      toast.success("Notificações marcadas como lidas.");
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

/** Cria notificações internas (usado pelos fluxos de aprovação no cliente). */
export async function createNotifications(
  rows: { user_id: string; title: string; body?: string | null; link?: string | null; project_id?: string | null }[],
) {
  if (rows.length === 0) return;
  await supabase.from("notifications").insert(
    rows.map((row) => ({
      user_id: row.user_id,
      title: row.title,
      body: row.body ?? null,
      link: row.link ?? null,
      project_id: row.project_id ?? null,
      category: "aprovacao",
    })) as never,
  );
}
