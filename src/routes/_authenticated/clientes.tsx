import { createFileRoute, Link } from "@tanstack/react-router";
import { Plus, Trash2 } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { requireVendedor } from "@/lib/guard";
import { RecordDialog, type Field } from "@/components/RecordDialog";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { useDeleteRow, useRows, useSaveRow } from "@/lib/data";
import { useSession } from "@/lib/auth";
import type { Contract } from "@/lib/crm";
import { CLIENT_STATUS, currency, options, shortDate } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/clientes")({
  beforeLoad: () => requireVendedor(),
  head: () => ({
    meta: [
      { title: "Clientees — ScaleNexus" },
      {
        name: "description",
        content: "Carteira do vendedor: empresa, responsável, contrato, mensalidade, projetos e data de entrada.",
      },
      { property: "og:title", content: "Clientees — ScaleNexus" },
      { property: "og:description", content: "Carteira de clientes da ScaleNexus." },
    ],
  }),
  component: ClienteesPage,
});

type Cliente = {
  id: string;
  company: string;
  niche: string | null;
  city: string | null;
  contact_name: string | null;
  contact_phone: string | null;
  contact_email: string | null;
  monthly_fee: number;
  status: string;
  lead_id: string | null;
  contract_id: string | null;
  notes: string | null;
  created_at: string;
};

type Projeto = { id: string; title: string; status: string; client_id: string | null };

const fields: Field[] = [
  { name: "company", label: "Empresa", required: true },
  { name: "niche", label: "Nicho" },
  { name: "city", label: "Cidade" },
  { name: "contact_name", label: "Responsável" },
  { name: "contact_phone", label: "Telefone" },
  { name: "contact_email", label: "E-mail do cliente", placeholder: "cliente@empresa.com.br" },
  { name: "monthly_fee", label: "Mensalidade (R$)", type: "number" },
  { name: "status", label: "Status", type: "select", options: options(CLIENT_STATUS) },
  { name: "notes", label: "Observações", type: "textarea" },
];

function ClienteesPage() {
  const { user } = useSession();
  const { data = [], isLoading } = useRows<Cliente>("clients");
  const { data: contracts = [] } = useRows<Contract>("contracts", { column: "signed_at" });
  const { data: projects = [] } = useRows<Projeto>("projects");
  const save = useSaveRow("clients");
  const remove = useDeleteRow("clients");

  const recurring = data
    .filter((client) => client.status === "ativo")
    .reduce((sum, client) => sum + Number(client.monthly_fee), 0);

  return (
    <AppShell
      title="Clientees"
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
        {data.map((client) => {
          const contract = contracts.find((item) => item.id === client.contract_id);
          const clientProjetos = projects.filter((project) => project.client_id === client.id);
          return (
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
              <p className="text-xs text-muted-foreground">
                Mensalidade · cliente desde {shortDate(client.created_at)}
              </p>

              <dl className="mt-4 space-y-1.5 text-sm">
                <div className="flex justify-between gap-3">
                  <dt className="text-muted-foreground">Responsável</dt>
                  <dd className="text-right">{client.contact_name || "—"}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-muted-foreground">Contrato</dt>
                  <dd className="text-right">
                    {contract ? `${currency(contract.amount)} · ${shortDate(contract.signed_at)}` : "—"}
                  </dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-muted-foreground">Projetos</dt>
                  <dd className="text-right">
                    {clientProjetos.length ? clientProjetos.map((p) => p.title).join(", ") : "—"}
                  </dd>
                </div>
                {client.notes ? (
                  <div className="flex justify-between gap-3">
                    <dt className="text-muted-foreground">Observações</dt>
                    <dd className="max-w-[60%] text-right">{client.notes}</dd>
                  </div>
                ) : null}
              </dl>

              <div className="mt-4 flex justify-end gap-1">
                {client.lead_id ? (
                  <Button asChild variant="ghost" size="sm">
                    <Link to="/leads/$leadId" params={{ leadId: client.lead_id }}>
                      Histórico
                    </Link>
                  </Button>
                ) : null}
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
          );
        })}
        {!isLoading && data.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground md:col-span-2 xl:col-span-3">
            Nenhum cliente cadastrado ainda.
          </p>
        ) : null}
      </div>
    </AppShell>
  );
}
