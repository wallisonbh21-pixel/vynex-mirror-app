import { createFileRoute } from "@tanstack/react-router";
import { Plus, Trash2 } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { RecordDialog, type Field } from "@/components/RecordDialog";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { useDeleteRow, useRows, useSaveRow } from "@/lib/data";
import { useSession } from "@/lib/auth";
import { CLIENT_STATUS, currency, STATUS_LABEL } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/clientes")({
  head: () => ({
    meta: [
      { title: "Clientes — VYNEXA" },
      { name: "description", content: "Empresas atendidas, nicho, cidade e mensalidades recorrentes." },
      { property: "og:title", content: "Clientes — VYNEXA" },
      { property: "og:description", content: "Carteira de clientes e recorrência da VYNEXA." },
    ],
  }),
  component: ClientesPage,
});

type Client = {
  id: string;
  company: string;
  niche: string | null;
  city: string | null;
  contact_name: string | null;
  contact_phone: string | null;
  monthly_fee: number;
  status: string;
};

const fields: Field[] = [
  { name: "company", label: "Empresa", required: true },
  { name: "niche", label: "Nicho" },
  { name: "city", label: "Cidade" },
  { name: "contact_name", label: "Pessoa de contato" },
  { name: "contact_phone", label: "Telefone" },
  { name: "monthly_fee", label: "Mensalidade (R$)", type: "number" },
  {
    name: "status",
    label: "Situação",
    type: "select",
    options: CLIENT_STATUS.map((s) => ({ value: s, label: STATUS_LABEL[s]! })),
  },
];

function ClientesPage() {
  const { user } = useSession();
  const { data = [], isLoading } = useRows<Client>("clients");
  const save = useSaveRow("clients");
  const remove = useDeleteRow("clients");

  const recurring = data
    .filter((c) => c.status === "ativo")
    .reduce((sum, c) => sum + Number(c.monthly_fee), 0);

  return (
    <AppShell
      title="Clientes"
      description={`Recorrência ativa de ${currency(recurring)} por mês.`}
      actions={
        <RecordDialog
          title="Novo cliente"
          fields={fields}
          initial={{ status: "ativo", monthly_fee: 0 }}
          onSubmit={(values) => save.mutate({ ...values, owner_id: user?.id })}
          trigger={
            <Button>
              <Plus className="size-4" /> Novo cliente
            </Button>
          }
        />
      }
    >
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {data.map((client) => (
          <article key={client.id} className="rounded-2xl border border-border bg-card p-5 shadow-panel">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h2 className="truncate font-semibold">{client.company}</h2>
                <p className="text-xs text-muted-foreground">
                  {client.niche || "Sem nicho"} · {client.city || "Sem cidade"}
                </p>
              </div>
              <StatusBadge status={client.status} />
            </div>
            <p className="mt-4 text-2xl font-semibold">{currency(client.monthly_fee)}</p>
            <p className="text-xs text-muted-foreground">Mensalidade recorrente</p>
            <p className="mt-3 text-sm text-muted-foreground">
              {client.contact_name || "Sem contato"} · {client.contact_phone || "—"}
            </p>
            <div className="mt-4 flex justify-end gap-1">
              <RecordDialog
                title="Editar cliente"
                fields={fields}
                initial={client}
                onSubmit={(values) => save.mutate({ ...values, id: client.id })}
                trigger={
                  <Button variant="ghost" size="sm">
                    Editar
                  </Button>
                }
              />
              <Button variant="ghost" size="sm" onClick={() => remove.mutate(client.id)}>
                <Trash2 className="size-4 text-destructive" />
              </Button>
            </div>
          </article>
        ))}
        {!isLoading && data.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground md:col-span-2 xl:col-span-3">
            Nenhum cliente cadastrado ainda.
          </p>
        ) : null}
      </div>
    </AppShell>
  );
}
