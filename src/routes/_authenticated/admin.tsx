import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryCliente } from "@tanstack/react-query";
import { ShieldCheck, Usuários, Wallet } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { StatCard } from "@/components/StatCard";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { ROLE_LABEL, ROLE_OPTIONS, useRoles } from "@/lib/auth";
import { requireAdmin } from "@/lib/guard";
import { useRows } from "@/lib/data";
import { currency, shortDate } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/admin")({
  beforeLoad: () => requireAdmin(),
  head: () => ({
    meta: [
      { title: "Administração — ScaleNexus" },
      { name: "description", content: "Gerencie papéis de acesso, comissões e aprove saques do time." },
      { property: "og:title", content: "Administração — ScaleNexus" },
      { property: "og:description", content: "Controle de usuários e saques da ScaleNexus." },
    ],
  }),
  component: AdminPage,
});

type Profile = { id: string; full_name: string | null; phone: string | null; commission_rate: number };
type RoleRow = { user_id: string; role: string };
type Withdrawal = { id: string; user_id: string; amount: number; pix_key: string | null; status: string; created_at: string };

const ROLES = ROLE_OPTIONS;

function AdminPage() {
  const { isAdmin, loading } = useRoles();
  const queryCliente = useQueryCliente();

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
      queryCliente.invalidateQueries({ queryKey: ["user_roles"] });
      toast.success("Papel atualizado.");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  // Somente admin/diretor define a comissão padrão de cada usuário.
  const setCommission = useMutation({
    mutationFn: async ({ userId, rate }: { userId: string; rate: number }) => {
      const value = Math.min(Math.max(rate, 0), 100);
      const { error } = await supabase
        .from("profiles")
        .update({ commission_rate: value } as never)
        .eq("id", userId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryCliente.invalidateQueries({ queryKey: ["profiles"] });
      toast.success("Comissão atualizada.");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const setWithdrawalStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from("withdrawals").update({ status } as never).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryCliente.invalidateQueries({ queryKey: ["withdrawals"] });
      toast.success("Saque atualizado.");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  if (!loading && !isAdmin) {
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
        <StatCard label="Usuários" value={String(rows.length)} hint="Cadastrados na plataforma" icon={Usuários} />
        <StatCard label="Saques pendentes" value={String(pending.length)} hint={currency(pending.reduce((s, w) => s + Number(w.amount), 0))} icon={Wallet} />
        <StatCard
          label="Administradores"
          value={String((roles.data ?? []).filter((r) => r.role === "admin" || r.role === "diretor").length)}
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
                    {profile.phone || "sem telefone"} · {ROLE_LABEL[role] ?? role}
                  </span>
                </span>
                <div className="flex flex-wrap items-center gap-2">
                  <label className="flex items-center gap-2 text-xs text-muted-foreground">
                    Comissão %
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      className="h-9 w-20 transition-colors"
                      defaultValue={Number(profile.commission_rate)}
                      onBlur={(e) => {
                        const value = Number(e.target.value);
                        if (Number.isNaN(value) || value === Number(profile.commission_rate)) return;
                        setCommission.mutate({ userId: profile.id, rate: value });
                      }}
                    />
                  </label>
                  <Select
                    value={role}
                    onValueChange={(value) => setRole.mutate({ userId: profile.id, role: value })}
                  >
                    <SelectTrigger className="w-52 transition-colors hover:border-primary/60">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ROLES.map((item) => (
                        <SelectItem key={item.value} value={item.value}>
                          {item.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
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
