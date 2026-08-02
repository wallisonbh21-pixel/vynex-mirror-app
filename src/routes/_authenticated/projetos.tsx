import { createFileRoute } from "@tanstack/react-router";
import { Plus, Trash2 } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { RecordDialog, type Field } from "@/components/RecordDialog";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { useDeleteRow, useRows, useSaveRow } from "@/lib/data";
import { useSession } from "@/lib/auth";
import { currency, PROJECT_STATUS, shortDate, STATUS_LABEL } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/projetos")({
  head: () => ({
    meta: [
      { title: "Projetos — VYNEXA" },
      { name: "description", content: "Fila de produção dos sites e landing pages, prazos e comissões." },
      { property: "og:title", content: "Projetos — VYNEXA" },
      { property: "og:description", content: "Produção e entregas do time criativo VYNEXA." },
    ],
  }),
  component: ProjetosPage,
});

type Project = {
  id: string;
  title: string;
  client_name: string | null;
  status: string;
  due_date: string | null;
  commission: number;
  brief: string | null;
};

const fields: Field[] = [
  { name: "title", label: "Título do projeto", required: true },
  { name: "client_name", label: "Cliente" },
  {
    name: "status",
    label: "Etapa",
    type: "select",
    options: PROJECT_STATUS.map((s) => ({ value: s, label: STATUS_LABEL[s]! })),
  },
  { name: "due_date", label: "Prazo", type: "date" },
  { name: "commission", label: "Comissão (R$)", type: "number" },
  { name: "brief", label: "Briefing", type: "textarea" },
];

function ProjetosPage() {
  const { user } = useSession();
  const { data = [] } = useRows<Project>("projects");
  const save = useSaveRow("projects");
  const remove = useDeleteRow("projects");

  return (
    <AppShell
      title="Projetos"
      description="Do briefing à entrega, com prazo e comissão visíveis."
      actions={
        <RecordDialog
          title="Novo projeto"
          fields={fields}
          initial={{ status: "fila", commission: 0 }}
          onSubmit={(values) => save.mutate({ ...values, owner_id: user?.id })}
          trigger={
            <Button>
              <Plus className="size-4" /> Novo projeto
            </Button>
          }
        />
      }
    >
      <div className="grid gap-4 lg:grid-cols-4">
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
                      {project.client_name || "Sem cliente"} · prazo {shortDate(project.due_date)}
                    </p>
                    <p className="mt-2 text-sm font-semibold">{currency(project.commission)}</p>
                    <div className="mt-2 flex justify-end gap-1">
                      <RecordDialog
                        title="Editar projeto"
                        fields={fields}
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
