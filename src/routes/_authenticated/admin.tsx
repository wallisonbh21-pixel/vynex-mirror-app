import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ShieldCheck, Users, Wallet } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { StatCard } from "@/components/StatCard";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useRoles } from "@/lib/auth";
import { useRows } from "@/lib/data";
import { currency, shortDate } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Administração — VYNEXA" },
      { name: "description", content: "Gerencie papéis de acesso, comissões e aprove saques do time." },
      { property: "og:title", content: "Administração — VYNEXA" },
      { property: "og:description", content: "Controle de usuários e saques da VYNEXA." },
    ],
  }),
  component: AdminPage,
});

type Profile = { id: string; full_name: string | null; phone: string | null; commission_rate: number };
type RoleRow = { user_id: string; role: string };
type Withdrawal = { id: string; owner_id: string; amount: number; pix_key: string | null; status: string; created_at: string };

const ROLES = ["admin", "vendedor", "criador"] as const;

function AdminPage() {
  const { isAdmin, loading } = useRoles();
  const queryClient = useQueryClient();

  const profiles = useQuery({
    queryKey: ["profiles"],
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("*");
      if (error) throw error;
      return (data ?? []) as Profile[];
    },
    enabled: isAdmin,
  });

  const roles = useQuery({
    queryKey: ["user_roles"],
    queryFn: async () => {
      const { data, error } = await supabase.from("user_roles").select("user_id, role");
      if (error) throw error;
      return (data ?? []) as RoleRow[];
    },
    enabled: isAdmin,
  });

  const { data: withdrawals = [] } = useRows<Withdrawal>("withdrawals");

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
    onError: (error: Error) => toast.error(error.message),
  });

  const setWithdrawalStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from("withdrawals").update({ status } as never).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["withdrawals"] });
      toast.success("Saque atualizado.");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  if (!isLoading && !isAdmin) {
    return (
      <AppShell title="Administração" description="Área restrita.">
        <p className="rounded-2xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
          Você não tem permissão de administrador.
        </p>
      </AppShell>
    );
  }

  const rows = profiles.data ?? [];
  const pending = withdrawals.filter((w) => w.status === "pendente");

  return (
    <AppShell title="Administração" description="Controle de acessos e aprovações da operação.">
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Usuários" value={String(rows.length)} hint="Cadastrados na plataforma" icon={Users} />
        <StatCard label="Saques pendentes" value={String(pending.length)} hint={currency(pending.reduce((s, w) => s + Number(w.amount), 0))} icon={Wallet} />
        <StatCard
          label="Administradores"
          value={String((roles.data ?? []).filter((r) => r.role === "admin").length)}
          hint="Com acesso total"
          icon={ShieldCheck}
        />
      </div>

      <section className="mt-6 overflow-hidden rounded-2xl border border-border bg-card shadow-panel">
        <h2 className="border-b border-border px-4 py-3 text-sm font-semibold">Usuários e papéis</h2>
        <ul className="divide-y divide-border">
          {rows.map((profile) => {
            const role = (roles.data ?? []).find((r) => r.user_id === profile.id)?.role ?? "vendedor";
            return (
              <li key={profile.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-sm">
                <span className="min-w-0">
                  <span className="block font-medium">{profile.full_name || "Sem nome"}</span>
                  <span className="text-xs text-muted-foreground">
                    {profile.email} · comissão {Number(profile.commission_rate)}%
                  </span>
                </span>
                <Select
                  value={role}
                  onValueChange={(value) => setRole.mutate({ userId: profile.id, role: value })}
                >
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ROLES.map((item) => (
                      <SelectItem key={item} value={item}>
                        {item}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </li>
            );
          })}
          {rows.length === 0 ? (
            <li className="px-4 py-10 text-center text-sm text-muted-foreground">Nenhum usuário.</li>
          ) : null}
        </ul>
      </section>

      <section className="mt-6 overflow-hidden rounded-2xl border border-border bg-card shadow-panel">
        <h2 className="border-b border-border px-4 py-3 text-sm font-semibold">Solicitações de saque</h2>
        <ul className="divide-y divide-border">
          {withdrawals.map((w) => (
            <li key={w.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-sm">
              <span className="min-w-0">
                <span className="block font-medium">{currency(w.amount)}</span>
                <span className="text-xs text-muted-foreground">
                  {w.pix_key || "sem chave"} · {shortDate(w.created_at)}
                </span>
              </span>
              <div className="flex items-center gap-2">
                <StatusBadge status={w.status} />
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setWithdrawalStatus.mutate({ id: w.id, status: "pago" })}
                >
                  Pagar
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setWithdrawalStatus.mutate({ id: w.id, status: "recusado" })}
                >
                  Recusar
                </Button>
              </div>
            </li>
          ))}
          {withdrawals.length === 0 ? (
            <li className="px-4 py-10 text-center text-sm text-muted-foreground">Nenhum saque solicitado.</li>
          ) : null}
        </ul>
      </section>
    </AppShell>
  );
}
