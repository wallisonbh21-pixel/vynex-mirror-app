import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Wallet } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { requireAdmin } from "@/lib/guard";
import { currency, shortDate } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/admin/saques")({
  beforeLoad: () => requireAdmin(),
  component: AdminWithdrawalsPage,
});

function AdminWithdrawalsPage() {
  const queryClient = useQueryClient();
  const { data: withdrawals = [] } = useQuery({
    queryKey: ["withdrawals"],
    queryFn: async () => {
      const { data, error } = await supabase.from("withdrawals").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const setStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from("withdrawals").update({ status } as never).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["withdrawals"] });
      toast.success("Saque atualizado.");
    },
  });

  return (
    <AppShell title="Solicitações de Saque" description="Aprovação de pagamentos de comissões.">
      <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-panel">
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
                {w.status === "pendente" && (
                  <>
                    <Button variant="secondary" size="sm" onClick={() => setStatus.mutate({ id: w.id, status: "pago" })}>Pagar</Button>
                    <Button variant="ghost" size="sm" onClick={() => setStatus.mutate({ id: w.id, status: "recusado" })}>Recusar</Button>
                  </>
                )}
              </div>
            </li>
          ))}
        </ul>
      </section>
    </AppShell>
  );
}
