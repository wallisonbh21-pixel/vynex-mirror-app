import { createFileRoute } from "@tanstack/react-router";
import { Banknote, Clock, Wallet } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { RecordDialog, type Field } from "@/components/RecordDialog";
import { StatCard } from "@/components/StatCard";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { requireCriador } from "@/lib/guard";
import { useProfile, useSession } from "@/lib/auth";
import { useRows, useSaveRow } from "@/lib/data";
import { creatorEarnings, useMyCreatorProjects } from "@/lib/creator";
import { currency, shortDate } from "@/lib/format";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/meus-saques")({
  beforeLoad: () => requireCriador(),
  head: () => ({
    meta: [
      { title: "Meus saques — VYNEXA" },
      {
        name: "description",
        content: "Saldo disponível, solicitações de saque PIX e histórico de pagamentos do criador.",
      },
      { property: "og:title", content: "Meus saques — VYNEXA" },
      { property: "og:description", content: "Receba suas comissões via PIX na VYNEXA." },
    ],
  }),
  component: MeusSaquesPage,
});

type Withdrawal = {
  id: string;
  amount: number;
  pix_key: string | null;
  status: string;
  paid_at: string | null;
  created_at: string;
};

function MeusSaquesPage() {
  const { user } = useSession();
  const { data: profile } = useProfile();
  const { data: projects = [] } = useMyCreatorProjects();
  const { data: withdrawals = [] } = useRows<Withdrawal>("withdrawals");
  const save = useSaveRow("withdrawals");

  const earnings = creatorEarnings(projects, withdrawals);

  const fields: Field[] = [
    { name: "amount", label: "Valor do saque (R$)", type: "number", required: true },
    { name: "pix_key", label: "Chave PIX", required: true },
  ];

  return (
    <AppShell
      title="Meus saques"
      description="Solicite o pagamento das comissões liberadas."
      actions={
        <RecordDialog
          title="Solicitar saque PIX"
          fields={fields}
          initial={{ amount: earnings.balance, pix_key: profile?.pix_key ?? "" }}
          onSubmit={(values) => {
            const amount = Number(values["amount"] ?? 0);
            if (amount <= 0) {
              toast.error("Informe um valor maior que zero.");
              return;
            }
            if (amount > earnings.balance) {
              toast.error(`Saldo disponível é de ${currency(earnings.balance)}.`);
              return;
            }
            save.mutate({ ...values, user_id: user?.id, status: "pendente" });
          }}
          trigger={
            <Button>
              <Wallet className="size-4" /> Solicitar saque
            </Button>
          }
        />
      }
    >
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Saldo disponível" value={currency(earnings.balance)} hint="Comissões liberadas" icon={Wallet} />
        <StatCard label="Comissão pendente" value={currency(earnings.pending)} hint="Libera após a entrega" icon={Clock} />
        <StatCard
          label="Saques solicitados"
          value={currency(earnings.requested)}
          hint={`${withdrawals.filter((w) => w.status === "pendente").length} em análise`}
          icon={Clock}
        />
        <StatCard label="Total recebido" value={currency(earnings.withdrawn)} hint="Pagamentos confirmados" icon={Banknote} />
      </div>

      <section className="mt-6 overflow-hidden rounded-2xl border border-border bg-card shadow-panel">
        <h2 className="border-b border-border px-4 py-3 text-sm font-semibold">Histórico de saques</h2>
        <ul className="divide-y divide-border">
          {withdrawals.map((w) => (
            <li key={w.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-sm">
              <span className="min-w-0">
                <span className="block font-medium">{currency(w.amount)}</span>
                <span className="block text-xs text-muted-foreground">
                  Solicitado em {shortDate(w.created_at)} · PIX {w.pix_key ?? "—"}
                </span>
              </span>
              <span className="flex items-center gap-3">
                {w.paid_at ? (
                  <span className="text-xs text-muted-foreground">Pago em {shortDate(w.paid_at)}</span>
                ) : null}
                <StatusBadge status={w.status} />
              </span>
            </li>
          ))}
          {withdrawals.length === 0 ? (
            <li className="px-4 py-12 text-center text-sm text-muted-foreground">
              Nenhum saque solicitado ainda.
            </li>
          ) : null}
        </ul>
      </section>
    </AppShell>
  );
}
