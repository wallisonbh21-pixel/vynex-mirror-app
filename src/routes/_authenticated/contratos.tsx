import { createFileRoute } from "@tanstack/react-router";
import { FileSignature, Repeat, Wallet } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { RecordDialog, type Field } from "@/components/RecordDialog";
import { StatCard } from "@/components/StatCard";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import type { Contract } from "@/lib/crm";
import { useRows, useSaveRow } from "@/lib/data";
import { CONTRACT_STATUS, currency, options, shortDate } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/contratos")({
  head: () => ({
    meta: [
      { title: "Contratos — VYNEXA" },
      {
        name: "description",
        content: "Contratos fechados, valores, mensalidades e situação de cada cliente conquistado.",
      },
      { property: "og:title", content: "Contratos — VYNEXA" },
      { property: "og:description", content: "Contratos fechados na VYNEXA." },
    ],
  }),
  component: ContratosPage,
});

type Client = { id: string; company: string };

const fields: Field[] = [
  { name: "title", label: "Título do contrato", required: true },
  { name: "amount", label: "Valor fechado (R$)", type: "number" },
  { name: "monthly_fee", label: "Mensalidade (R$)", type: "number" },
  { name: "signed_at", label: "Data de assinatura", type: "date" },
  { name: "status", label: "Situação", type: "select", options: options(CONTRACT_STATUS) },
  { name: "notes", label: "Observações", type: "textarea" },
];

function ContratosPage() {
  const { data = [] } = useRows<Contract>("contracts", { column: "signed_at" });
  const { data: clients = [] } = useRows<Client>("clients");
  const save = useSaveRow("contracts");

  const active = data.filter((contract) => contract.status === "ativo");
  const totalSold = data.reduce((sum, contract) => sum + Number(contract.amount), 0);
  const recurring = active.reduce((sum, contract) => sum + Number(contract.monthly_fee), 0);

  return (
    <AppShell title="Contratos" description="Cada oportunidade fechada vira um contrato rastreável.">
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Contratos ativos" value={String(active.length)} hint={`${data.length} no total`} icon={FileSignature} />
        <StatCard label="Valor contratado" value={currency(totalSold)} hint="Soma de todos os contratos" icon={Wallet} />
        <StatCard label="Recorrência" value={currency(recurring)} hint="Mensalidades ativas" icon={Repeat} />
      </div>

      <div className="mt-6 overflow-x-auto rounded-2xl border border-border bg-card shadow-panel">
        <table className="w-full min-w-[640px] text-sm">
          <thead className="bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Contrato</th>
              <th className="px-4 py-3">Cliente</th>
              <th className="px-4 py-3 text-right">Valor</th>
              <th className="px-4 py-3 text-right">Mensalidade</th>
              <th className="px-4 py-3">Assinatura</th>
              <th className="px-4 py-3">Situação</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {data.map((contract) => (
              <tr key={contract.id} className="border-t border-border">
                <td className="px-4 py-3 font-medium">{contract.title}</td>
                <td className="px-4 py-3 text-muted-foreground">
                  {clients.find((client) => client.id === contract.client_id)?.company || "—"}
                </td>
                <td className="px-4 py-3 text-right">{currency(contract.amount)}</td>
                <td className="px-4 py-3 text-right">{currency(contract.monthly_fee)}</td>
                <td className="px-4 py-3 text-muted-foreground">{shortDate(contract.signed_at)}</td>
                <td className="px-4 py-3">
                  <StatusBadge status={contract.status} />
                </td>
                <td className="px-4 py-3 text-right">
                  <RecordDialog
                    title="Editar contrato"
                    fields={fields}
                    initial={contract}
                    onSubmit={(values) => save.mutate({ ...values, id: contract.id })}
                    trigger={
                      <Button variant="ghost" size="sm">
                        Editar
                      </Button>
                    }
                  />
                </td>
              </tr>
            ))}
            {data.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-muted-foreground">
                  Nenhum contrato fechado ainda. Converta um lead para gerar o primeiro.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </AppShell>
  );
}
