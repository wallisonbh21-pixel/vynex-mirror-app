import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Users } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { supabase } from "@/integrations/supabase/client";
import { ROLE_OPTIONS, useRoles, ROLE_LABEL } from "@/lib/auth";
import { requireAdmin } from "@/lib/guard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/_authenticated/admin/usuarios")({
  beforeLoad: () => requireAdmin(),
  component: AdminUsersPage,
});

function AdminUsersPage() {
  const { isAdmin } = useRoles();
  const queryClient = useQueryClient();

  const profiles = useQuery({
    queryKey: ["profiles"],
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("*");
      if (error) throw error;
      return data ?? [];
    },
    enabled: isAdmin,
  });

  const roles = useQuery({
    queryKey: ["user_roles"],
    queryFn: async () => {
      const { data, error } = await supabase.from("user_roles").select("user_id, role");
      if (error) throw error;
      return data ?? [];
    },
    enabled: isAdmin,
  });

  const setRole = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: string }) => {
      const { error: deleteError } = await supabase.from("user_roles").delete().eq("user_id", userId);
      if (deleteError) throw deleteError;
      const { error } = await supabase
        .from("user_roles")
        .insert({ user_id: userId, role } as never);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user_roles"] });
      toast.success("Papel atualizado.");
    },
  });

  const setCommission = useMutation({
    mutationFn: async ({ userId, rate }: { userId: string; rate: number }) => {
      const { error } = await supabase
        .from("profiles")
        .update({ commission_rate: rate } as never)
        .eq("id", userId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profiles"] });
      toast.success("Comissão atualizada.");
    },
  });

  return (
    <AppShell title="Usuários e Papéis" description="Gerenciamento de acessos da plataforma.">
      <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-panel">
        <ul className="divide-y divide-border">
          {profiles.data?.map((profile) => {
            const role = roles.data?.find((r) => r.user_id === profile.id)?.role ?? "vendedor";
            return (
              <li key={profile.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-sm">
                <span className="min-w-0">
                  <span className="block font-medium">{profile.full_name || "Sem nome"}</span>
                  <span className="text-xs text-muted-foreground">
                    {profile.phone || "sem telefone"} · {ROLE_LABEL[role] ?? role}
                  </span>
                </span>
                <div className="flex flex-wrap items-center gap-2">
                  <label className="flex items-center gap-2 text-xs text-muted-foreground">
                    Comissão %
                    <Input
                      type="number"
                      className="h-9 w-20"
                      defaultValue={profile.commission_rate}
                      onBlur={(e) => setCommission.mutate({ userId: profile.id, rate: Number(e.target.value) })}
                    />
                  </label>
                  <Select
                    value={role}
                    onValueChange={(value) => setRole.mutate({ userId: profile.id, role: value })}
                  >
                    <SelectTrigger className="w-52">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ROLE_OPTIONS.map((item) => (
                        <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </li>
            );
          })}
        </ul>
      </section>
    </AppShell>
  );
}
