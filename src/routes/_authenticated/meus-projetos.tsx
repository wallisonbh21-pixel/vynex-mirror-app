import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Send } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { RecordDialog, type Field } from "@/components/RecordDialog";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { requireCriador } from "@/lib/guard";
import { useRows } from "@/lib/data";
import { creatorEarnings, useMyCreatorProjects, useUpdateCreatorProject } from "@/lib/creator";
import { currency, label, shortDate } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/meus-projetos")({
  beforeLoad: () => requireCriador(),
  head: () => ({
    meta: [
      { title: "Meus projetos — VYNEXA" },
      {
        name: "description",
        content: "Acompanhe produção, aprovações, ajustes e entregas dos seus projetos na VYNEXA.",
      },
      { property: "og:title", content: "Meus projetos — VYNEXA" },
      { property: "og:description", content: "Gestão da produção do criador VYNEXA." },
    ],
  }),
  component: MeusProjetosPage,
});

type Client = { id: string; company: string };

const FILTERS = [
  { value: "todos", label: "Todos" },
  { value: "em_producao", label: "Em produção" },
  { value: "aguardando_aprovacao", label: "Aguardando aprovação" },
  { value: "ajustes", label: "Ajustes" },
  { value: "aprovado", label: "Aprovado" },
  { value: "entregue", label: "Entregues" },
] as const;

const deliveryFields: Field[] = [
  { name: "delivery_link", label: "Link do site", required: true, placeholder: "https://" },
  { name: "delivery_notes", label: "Observações da entrega", type: "textarea" },
];

function MeusProjetosPage() {
  const { data: projects = [] } = useMyCreatorProjects();
  const { data: clients = [] } = useRows<Client>("clients");
  const update = useUpdateCreatorProject();
  const [filter, setFilter] = useState<string>("todos");

  const clientName = useMemo(() => {
    const map = new Map(clients.map((c) => [c.id, c.company]));
    return (id: string | null) => (id ? (map.get(id) ?? "Cliente removido") : "Cliente interno");
  }, [clients]);

  const earnings = creatorEarnings(projects, []);
  const rows = projects.filter((p) => (filter === "todos" ? true : p.status === filter));

  return (
    <AppShell
      title="Meus projetos"
      description="Da produção à entrega, com prazo e comissão."
      actions={
        <Button asChild variant="secondary">
          <Link to="/disponiveis">Pegar novo projeto</Link>
        </Button>
      }
    >
      <div className="flex flex-wrap gap-2">
        {FILTERS.map((item) => (
          <button
            key={item.value}
            type="button"
            onClick={() => setFilter(item.value)}
            className={
              filter === item.value
                ? "rounded-full bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground"
                : "rounded-full border border-border px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground"
            }
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="mt-5 overflow-x-auto rounded-2xl border border-border bg-card shadow-panel">
        <table className="w-full min-w-[900px] text-sm">
          <thead className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Projeto</th>
              <th className="px-4 py-3">Cliente</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Valor</th>
              <th className="px-4 py-3">Comissão</th>
              <th className="px-4 py-3">Prazo</th>
              <th className="px-4 py-3">Início</th>
              <th className="px-4 py-3 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.map((project) => (
              <tr key={project.id}>
                <td className="px-4 py-3">
                  <span className="block font-medium">{project.title}</span>
                  <span className="block text-xs text-muted-foreground">{project.site_type ?? "Site"}</span>
                </td>
                <td className="px-4 py-3">{clientName(project.client_id)}</td>
                <td className="px-4 py-3">
                  <StatusBadge status={project.status} />
                  <span className="mt-1 block text-[11px] text-muted-foreground">
                    Comissão {label(project.commission_status)}
                  </span>
                </td>
                <td className="px-4 py-3">{currency(project.value)}</td>
                <td className="px-4 py-3 font-medium text-primary">
                  {currency(earnings.commissionOf(project))}
                </td>
                <td className="px-4 py-3">{shortDate(project.due_date)}</td>
                <td className="px-4 py-3">{shortDate(project.assigned_at ?? project.created_at)}</td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-2">
                    {["em_producao", "ajustes"].includes(project.status) ? (
                      <RecordDialog
                        title="Enviar para aprovação"
                        fields={deliveryFields}
                        initial={project}
                        onSubmit={(values) =>
                          update.mutate({
                            id: project.id,
                            ...values,
                            status: "aguardando_aprovacao",
                          })
                        }
                        trigger={
                          <Button size="sm">
                            <Send className="size-4" /> Enviar para aprovação
                          </Button>
                        }
                      />
                    ) : null}
                    {project.status === "aprovado" ? (
                      <Button
                        size="sm"
                        onClick={() => update.mutate({ id: project.id, status: "entregue" })}
                      >
                        Marcar como entregue
                      </Button>
                    ) : null}
                    {project.delivery_link ? (
                      <a
                        href={project.delivery_link}
                        target="_blank"
                        rel="noreferrer noopener"
                        className="self-center text-xs text-primary underline"
                      >
                        Ver site
                      </a>
                    ) : null}
                  </div>
                </td>
              </tr>
            ))}
            {rows.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-12 text-center text-sm text-muted-foreground">
                  Nenhum projeto neste filtro.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      <p className="mt-4 text-xs text-muted-foreground">
        Arquivos de entrega: por enquanto envie o link do site. A estrutura para upload de arquivos já
        está preparada no campo de observações da entrega.
      </p>
    </AppShell>
  );
}
