import { createFileRoute } from "@tanstack/react-router";
import { Plus, Trash2 } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { RecordDialog, type Field } from "@/components/RecordDialog";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { useDeleteRow, useRows, useSaveRow } from "@/lib/data";
import { useSession } from "@/lib/auth";
import { currency, LEAD_STATUS, shortDate, STATUS_LABEL } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/leads")({
  head: () => ({
    meta: [
      { title: "Leads — VYNEXA" },
      { name: "description", content: "Gerencie o funil de leads, origem, situação e valor estimado." },
      { property: "og:title", content: "Leads — VYNEXA" },
      { property: "og:description", content: "Funil de leads da operação VYNEXA." },
    ],
  }),
  component: LeadsPage,
});

type Lead = {
  id: string;
  name: string;
  company: string | null;
  phone: string | null;
  email: string | null;
  source: string | null;
  status: string;
  estimated_value: number;
  notes: string | null;
  created_at: string;
};

const fields: Field[] = [
  { name: "name", label: "Nome do contato", required: true },
  { name: "company", label: "Empresa" },
  { name: "phone", label: "Telefone" },
  { name: "email", label: "E-mail", type: "email" },
  { name: "source", label: "Origem", placeholder: "Indicação, Instagram, prospecção..." },
  {
    name: "status",
    label: "Situação",
    type: "select",
    options: LEAD_STATUS.map((s) => ({ value: s, label: STATUS_LABEL[s]! })),
  },
  { name: "estimated_value", label: "Valor estimado (R$)", type: "number" },
  { name: "notes", label: "Observações", type: "textarea" },
];

function LeadsPage() {
  const { user } = useSession();
  const { data = [], isLoading } = useRows<Lead>("leads");
  const save = useSaveRow("leads");
  const remove = useDeleteRow("leads");

  return (
    <AppShell
      title="Leads"
      description="Acompanhe cada oportunidade até virar contrato."
      actions={
        <RecordDialog
          title="Novo lead"
          fields={fields}
          initial={{ status: "novo", estimated_value: 0 }}
          onSubmit={(values) => save.mutate({ ...values, owner_id: user?.id })}
          trigger={
            <Button>
              <Plus className="size-4" /> Novo lead
            </Button>
          }
        />
      }
    >
      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-panel">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Contato</th>
              <th className="hidden px-4 py-3 md:table-cell">Origem</th>
              <th className="px-4 py-3">Situação</th>
              <th className="px-4 py-3 text-right">Valor</th>
              <th className="hidden px-4 py-3 lg:table-cell">Criado</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {data.map((lead) => (
              <tr key={lead.id} className="border-t border-border">
                <td className="px-4 py-3">
                  <span className="block font-medium">{lead.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {lead.company || "—"} · {lead.phone || lead.email || "sem contato"}
                  </span>
                </td>
                <td className="hidden px-4 py-3 text-muted-foreground md:table-cell">
                  {lead.source || "—"}
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={lead.status} />
                </td>
                <td className="px-4 py-3 text-right">{currency(lead.estimated_value)}</td>
                <td className="hidden px-4 py-3 text-muted-foreground lg:table-cell">
                  {shortDate(lead.created_at)}
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-1">
                    <RecordDialog
                      title="Editar lead"
                      fields={fields}
                      initial={lead}
                      onSubmit={(values) => save.mutate({ ...values, id: lead.id })}
                      trigger={
                        <Button variant="ghost" size="sm">
                          Editar
                        </Button>
                      }
                    />
                    <Button variant="ghost" size="sm" onClick={() => remove.mutate(lead.id)}>
                      <Trash2 className="size-4 text-destructive" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
            {!isLoading && data.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">
                  Nenhum lead cadastrado ainda.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </AppShell>
  );
}
