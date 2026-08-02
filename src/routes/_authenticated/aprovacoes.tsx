import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Copy, ExternalLink, History, ShieldCheck, Wrench } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { StatCard } from "@/components/StatCard";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { RecordDialog, type Field } from "@/components/RecordDialog";
import { requireAdmin } from "@/lib/guard";
import { useRows } from "@/lib/data";
import { useProfiles } from "@/lib/people";
import {
  APPROVAL_EVENT_LABEL,
  APPROVAL_STATUS,
  useApprovalEvents,
  useApprovalQueue,
  useReleaseToClient,
  useRequestInternalAdjust,
  type ApprovalProjectRow,
} from "@/lib/approval";
import { label, shortDate } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/aprovacoes")({
  beforeLoad: () => requireAdmin(),
  head: () => ({
    meta: [
      { title: "Sites aguardando aprovação — VYNEXA" },
      {
        name: "description",
        content:
          "Revise os sites entregues pelos criadores, libere o envio ao cliente e acompanhe as aprovações.",
      },
      { property: "og:title", content: "Sites aguardando aprovação — VYNEXA" },
      { property: "og:description", content: "Controle de liberação e aprovação de sites da VYNEXA." },
    ],
  }),
  component: AprovacoesPage,
});

type Client = { id: string; company: string; contact_name: string | null; contact_email: string | null };

const adjustFields: Field[] = [
  {
    name: "message",
    label: "O que precisa ser ajustado?",
    type: "textarea",
    required: true,
    placeholder: "Descreva os ajustes para o criador.",
  },
];

function AprovacoesPage() {
  const { data: projects = [] } = useApprovalQueue();
  const { data: clients = [] } = useRows<Client>("clients");
  const { data: profiles = [] } = useProfiles();
  const { data: events = [] } = useApprovalEvents();
  const release = useReleaseToClient();
  const adjust = useRequestInternalAdjust();
  const [links, setLinks] = useState<Record<string, string>>({});

  const clientById = useMemo(() => new Map(clients.map((c) => [c.id, c])), [clients]);
  const creatorName = useMemo(() => {
    const map = new Map(profiles.map((p) => [p.id, p.nickname || p.full_name || "Sem nome"]));
    return (id: string | null) => (id ? (map.get(id) ?? "Criador removido") : "Sem criador");
  }, [profiles]);

  const pendentes = projects.filter((p) => p.status === APPROVAL_STATUS.interna);
  const comCliente = projects.filter((p) => p.status === APPROVAL_STATUS.liberado);
  const ajustes = projects.filter((p) => p.status === APPROVAL_STATUS.ajustesCliente);
  const aprovados = projects.filter((p) => p.status === APPROVAL_STATUS.aprovado);

  async function copyLink(link: string) {
    await navigator.clipboard.writeText(link);
    toast.success("Link copiado.");
  }

  function renderCard(project: ApprovalProjectRow) {
    const client = project.client_id ? clientById.get(project.client_id) : undefined;
    const link = links[project.id];
    return (
      <article
        key={project.id}
        className="rounded-2xl border border-border bg-card p-5 shadow-panel transition-transform hover:-translate-y-0.5"
      >
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="font-semibold">{project.title}</h3>
            <p className="text-xs text-muted-foreground">
              {client?.company ?? "Cliente interno"} · {client?.contact_name ?? "Sem contato"}
            </p>
          </div>
          <StatusBadge status={project.status} />
        </div>

        <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
          <Info label="Criador responsável" value={creatorName(project.creator_id)} />
          <Info label="Enviado em" value={shortDate(project.submitted_at)} />
          <Info label="Liberado ao cliente" value={shortDate(project.approved_to_client_at)} />
          <Info label="Aprovado pelo cliente" value={shortDate(project.client_approved_at)} />
        </dl>

        {project.delivery_notes ? (
          <p className="mt-3 rounded-xl border border-border bg-secondary/40 p-3 text-sm">
            {project.delivery_notes}
          </p>
        ) : null}

        <div className="mt-4 flex flex-wrap gap-2">
          {project.delivery_link ? (
            <Button asChild size="sm" variant="secondary">
              <a href={project.delivery_link} target="_blank" rel="noreferrer noopener">
                <ExternalLink className="size-4" /> Visualizar site
              </a>
            </Button>
          ) : null}

          {project.status === APPROVAL_STATUS.interna ? (
            <>
              <Button
                size="sm"
                disabled={release.isPending}
                onClick={() =>
                  release.mutate(project.id, {
                    onSuccess: (result) => {
                      setLinks((prev) => ({ ...prev, [project.id]: result.link }));
                      if (!result.clientEmail) {
                        toast.info("Cliente sem e-mail cadastrado — envie o link manualmente.");
                      }
                    },
                  })
                }
              >
                Aprovar envio ao cliente
              </Button>
              <RecordDialog
                title="Solicitar ajustes ao criador"
                fields={adjustFields}
                onSubmit={(values) =>
                  adjust.mutate({ project, message: String(values['message'] ?? "") })
                }
                trigger={
                  <Button size="sm" variant="outline">
                    <Wrench className="size-4" /> Solicitar ajustes
                  </Button>
                }
              />
            </>
          ) : null}

          {link ? (
            <Button size="sm" variant="ghost" onClick={() => copyLink(link)}>
              <Copy className="size-4" /> Copiar link do cliente
            </Button>
          ) : null}
        </div>
      </article>
    );
  }

  return (
    <AppShell
      title="Sites aguardando aprovação"
      description="Revise as entregas dos criadores antes de liberar o acesso do cliente."
    >
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Aguardando revisão" value={String(pendentes.length)} icon={ShieldCheck} />
        <StatCard title="Com o cliente" value={String(comCliente.length)} icon={ExternalLink} />
        <StatCard title="Alterações pedidas" value={String(ajustes.length)} icon={Wrench} />
        <StatCard title="Aprovados" value={String(aprovados.length)} icon={History} />
      </div>

      <Section title="Aguardando sua revisão" items={pendentes} render={renderCard} />
      <Section title="Aguardando aprovação do cliente" items={comCliente} render={renderCard} />
      <Section title="Alterações solicitadas pelo cliente" items={ajustes} render={renderCard} />
      <Section title="Aprovados pelo cliente" items={aprovados} render={renderCard} />

      <h2 className="mt-10 text-lg font-semibold">Histórico de aprovação</h2>
      <div className="mt-3 overflow-x-auto rounded-2xl border border-border bg-card shadow-panel">
        <table className="w-full min-w-[820px] text-sm">
          <thead className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Data</th>
              <th className="px-4 py-3">Etapa</th>
              <th className="px-4 py-3">Responsável</th>
              <th className="px-4 py-3">Projeto</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Mensagem</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {events.map((event) => {
              const project = projects.find((p) => p.id === event.project_id);
              return (
                <tr key={event.id}>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {new Intl.DateTimeFormat("pt-BR", {
                      dateStyle: "short",
                      timeStyle: "short",
                    }).format(new Date(event.created_at))}
                  </td>
                  <td className="px-4 py-3">
                    {APPROVAL_EVENT_LABEL[event.event_type] ?? event.event_type}
                  </td>
                  <td className="px-4 py-3">{event.actor_label}</td>
                  <td className="px-4 py-3">{project?.title ?? "—"}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {label(event.previous_status)} → {label(event.new_status)}
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{event.message ?? "—"}</td>
                </tr>
              );
            })}
            {events.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-sm text-muted-foreground">
                  Nenhum registro de aprovação ainda.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </AppShell>
  );
}

function Section({
  title,
  items,
  render,
}: {
  title: string;
  items: ApprovalProjectRow[];
  render: (project: ApprovalProjectRow) => React.ReactNode;
}) {
  return (
    <section className="mt-8">
      <h2 className="text-lg font-semibold">{title}</h2>
      {items.length === 0 ? (
        <p className="mt-2 text-sm text-muted-foreground">Nada por aqui no momento.</p>
      ) : (
        <div className="mt-3 grid gap-4 xl:grid-cols-2">{items.map(render)}</div>
      )}
    </section>
  );
}

function Info({ label: title, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-muted-foreground">{title}</dt>
      <dd className="mt-0.5">{value}</dd>
    </div>
  );
}
