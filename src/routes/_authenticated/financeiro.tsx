import { createFileRoute } from "@tanstack/react-router";
import { ArrowDownRight, ArrowUpRight, Plus, Wallet } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { RecordDialog, type Field } from "@/components/RecordDialog";
import { StatCard } from "@/components/StatCard";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { useRows, useSaveRow } from "@/lib/data";
import { useSession } from "@/lib/auth";
import { currency, shortDate, STATUS_LABEL } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/financeiro")({
  head: () => ({
    meta: [
      { title: "Financeiro — VYNEXA" },
      { name: "description", content: "Comissões, mensalidades, bônus e solicitações de saque em um só lugar." },
      { property: "og:title", content: "Financeiro — VYNEXA" },
      { property: "og:description", content: "Extrato e saques da sua operação VYNEXA." },
    ],
  }),
  component: FinanceiroPage,
});

type Transaction = {
  id: string;
  description: string | null;
  type: string;
  amount: number;
  occurred_at: string;
};

type Withdrawal = {
  id: string;
  amount: number;
  pix_key: string | null;
  status: string;
  created_at: string;
};

const transactionFields: Field[] = [
  { name: "description", label: "Descrição", required: true },
  {
    name: "type",
    label: "Tipo",
    type: "select",
    options: ["comissao", "mensalidade", "bonus", "saque"].map((t) => ({
      value: t,
      label: STATUS_LABEL[t]!,
    })),
  },
  { name: "amount", label: "Valor (R$)", type: "number" },
  { name: "occurred_at", label: "Data", type: "date" },
];

const withdrawalFields: Field[] = [
  { name: "amount", label: "Valor do saque (R$)", type: "number", required: true },
  { name: "pix_key", label: "Chave PIX", required: true },
];

function FinanceiroPage() {
  const { user } = useSession();
  const { data: transactions = [] } = useRows<Transaction>("transactions", { column: "occurred_at" });
  const { data: withdrawals = [] } = useRows<Withdrawal>("withdrawals");
  const saveTransaction = useSaveRow("transactions");
  const saveWithdrawal = useSaveRow("withdrawals");

  const entries = transactions.filter((t) => Number(t.amount) > 0);
  const exits = transactions.filter((t) => Number(t.amount) < 0);
  const balance = transactions.reduce((sum, t) => sum + Number(t.amount), 0);
  const pending = withdrawals
    .filter((w) => w.status === "pendente")
    .reduce((sum, w) => sum + Number(w.amount), 0);

  return (
    <AppShell
      title="Financeiro"
      description="Extrato completo das suas comissões e saques."
      actions={
        <div className="flex gap-2">
          <RecordDialog
            title="Nova transação"
            fields={transactionFields}
            initial={{ type: "comissao", amount: 0, occurred_at: new Date().toISOString().slice(0, 10) }}
            onSubmit={(values) => saveTransaction.mutate({ ...values, user_id: user?.id })}
            trigger={
              <Button variant="secondary">
                <Plus className="size-4" /> Transação
              </Button>
            }
          />
          <RecordDialog
            title="Solicitar saque"
            fields={withdrawalFields}
            initial={{ amount: 0 }}
            onSubmit={(values) =>
              saveWithdrawal.mutate({ ...values, user_id: user?.id, status: "pendente" })
            }
            trigger={
              <Button>
                <Wallet className="size-4" /> Solicitar saque
              </Button>
            }
          />
        </div>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Saldo disponível" value={currency(balance)} hint="Entradas menos saídas" icon={Wallet} />
        <StatCard
          label="Entradas"
          value={currency(entries.reduce((s, t) => s + Number(t.amount), 0))}
          hint={`${entries.length} lançamentos`}
          icon={ArrowUpRight}
        />
        <StatCard
          label="Saídas"
          value={currency(exits.reduce((s, t) => s + Number(t.amount), 0))}
          hint={`${exits.length} lançamentos`}
          icon={ArrowDownRight}
        />
        <StatCard label="Saques pendentes" value={currency(pending)} hint={`${withdrawals.length} solicitações`} icon={Wallet} />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-panel">
          <h2 className="border-b border-border px-4 py-3 text-sm font-semibold">Extrato</h2>
          <ul className="divide-y divide-border">
            {transactions.map((t) => (
              <li key={t.id} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
                <span className="min-w-0">
                  <span className="block truncate">{t.description || "Sem descrição"}</span>
                  <span className="text-xs text-muted-foreground">
                    {STATUS_LABEL[t.type] || t.type} · {shortDate(t.occurred_at)}
                  </span>
                </span>
                <span className={Number(t.amount) < 0 ? "text-destructive" : "text-success"}>
                  {currency(t.amount)}
                </span>
              </li>
            ))}
            {transactions.length === 0 ? (
              <li className="px-4 py-10 text-center text-sm text-muted-foreground">
                Nenhuma transação registrada.
              </li>
            ) : null}
          </ul>
        </section>

        <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-panel">
          <h2 className="border-b border-border px-4 py-3 text-sm font-semibold">Saques</h2>
          <ul className="divide-y divide-border">
            {withdrawals.map((w) => (
              <li key={w.id} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
                <span className="min-w-0">
                  <span className="block font-medium">{currency(w.amount)}</span>
                  <span className="text-xs text-muted-foreground">
                    {w.pix_key || "sem chave"} · {shortDate(w.created_at)}
                  </span>
                </span>
                <StatusBadge status={w.status} />
              </li>
            ))}
            {withdrawals.length === 0 ? (
              <li className="px-4 py-10 text-center text-sm text-muted-foreground">
                Nenhum saque solicitado.
              </li>
            ) : null}
          </ul>
        </section>
      </div>
    </AppShell>
  );
}
