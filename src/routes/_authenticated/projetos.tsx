import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { Plus, Trash2 } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { RecordDialog, type Field } from "@/components/RecordDialog";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { useDeleteRow, useRows, useSaveRow } from "@/lib/data";
import { useRoles, useSession } from "@/lib/auth";
import { currency, PROJECT_STATUS, shortDate, STATUS_LABEL } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/projetos")({
  head: () => ({
    meta: [
      { title: "Projetos — ScaleNexus" },
      { name: "description", content: "Fila de produção dos sites e landing pages, prazos e comissões." },
      { property: "og:title", content: "Projetos — ScaleNexus" },
      { property: "og:description", content: "Produção e entregas do time criativo ScaleNexus." },
    ],
  }),
  component: ProjetosPage,
});

type Projeto = {
  id: string;
  title: string;
  client_id: string | null;
  status: string;
  due_date: string | null;
  value: number;
  commission: number;
  description: string | null;
};

type Cliente = { id: string; company: string };

function ProjetosPage() {
  const { user } = useSession();
  const { isAdmin } = useRoles();

  const { data = [] } = useRows<Projeto>("projects");
  const { data: clients = [] } = useRows<Cliente>("clients");
  const save = useSaveRow("projects");
  const remove = useDeleteRow("projects");

  const clientName = useMemo(() => {
    const map = new Map(clients.map((client) => [client.id, client.company]));
    return (id: string | null) => (id ? map.get(id) ?? "Clientee removido" : "Sem cliente");
  }, [clients]);

  // Somente administradores/diretores definem comissão.
  const commissionFields: Field[] = isAdmin
    ? [
        { name: "commission_rate", label: "Comissão do criador (%)", type: "number" },
        { name: "commission", label: "Comissão fixa (R$)", type: "number" },
      ]
    : [];

  const baseFields: Field[] = [
    { name: "title", label: "Título do projeto", required: true },
    { name: "site_type", label: "Tipo de site", placeholder: "Landing page, institucional, e-commerce..." },
    {
      name: "client_id",
      label: "Clientee",
      type: "select",
      options: clients.map((client) => ({ value: client.id, label: client.company })),
    },
    {
      name: "status",
      label: "Etapa",
      type: "select",
      required: true,
      options: PROJECT_STATUS.map((s) => ({ value: s, label: STATUS_LABEL[s]! })),
    },
    { name: "due_date", label: "Prazo", type: "date" },
  ];

  const descriptionField: Field = { name: "description", label: "Briefing", type: "textarea" };
  const valueField: Field = {
    name: "value",
    label: "Valor do projeto (R$)",
    type: "number",
    required: true,
  };

  // Criação: o vendedor informa o valor da venda; comissão nunca é editável por ele.
  const fields: Field[] = [...baseFields, valueField, ...commissionFields, descriptionField];

  // Edição: valores financeiros ficam bloqueados para quem não é admin/diretor
  // (o banco também reverte qualquer alteração enviada por requisição direta).
  const editFields: Field[] = isAdmin
    ? fields
    : [...baseFields, descriptionField];


  return (
    <AppShell
      title="Projetos"
      description="Do briefing à entrega, com prazo e comissão visíveis."
      actions={
        <RecordDialog
          title="Novo projeto"
          fields={fields}
          initial={{ status: "disponivel", value: 0, commission: 0, commission_rate: 30 }}
          onSubmit={(values) => save.mutate({ ...values, owner_id: user?.id })}
          trigger={
            <Button>
              <Plus className="size-4" /> Novo projeto
            </Button>
          }
        />
      }
    >
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {PROJECT_STATUS.map((status) => {
          const rows = data.filter((p) => p.status === status);
          return (
            <section key={status} className="rounded-2xl border border-border bg-card/60 p-4">
              <div className="flex items-center justify-between">
                <StatusBadge status={status} />
                <span className="text-xs text-muted-foreground">{rows.length}</span>
              </div>
              <div className="mt-3 space-y-3">
                {rows.map((project) => (
                  <article key={project.id} className="rounded-xl border border-border bg-card p-3 shadow-panel">
                    <h2 className="text-sm font-medium">{project.title}</h2>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {clientName(project.client_id)} · prazo {shortDate(project.due_date)}
                    </p>
                    <p className="mt-2 text-sm font-semibold">{currency(project.value)}</p>
                    <p className="text-xs text-muted-foreground">
                      Comissão do criador: {currency(project.commission)}
                      {isAdmin ? null : " (definida pelo administrador)"}
                    </p>
                    <div className="mt-2 flex justify-end gap-1">
                      <RecordDialog
                        title="Editar projeto"
                        fields={editFields}
                        initial={project}
                        onSubmit={(values) => save.mutate({ ...values, id: project.id })}
                        trigger={
                          <Button variant="ghost" size="sm">
                            Editar
                          </Button>
                        }
                      />
                      <Button variant="ghost" size="sm" onClick={() => remove.mutate(project.id)}>
                        <Trash2 className="size-4 text-destructive" />
                      </Button>
                    </div>
                  </article>
                ))}
                {rows.length === 0 ? (
                  <p className="py-6 text-center text-xs text-muted-foreground">Vazio</p>
                ) : null}
              </div>
            </section>
          );
        })}
      </div>
    </AppShell>
  );
}
