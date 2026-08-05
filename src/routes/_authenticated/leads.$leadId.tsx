import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  CalendarClock,
  ExternalLink,
  FileText,
  MapPin,
  MessageSquare,
  Plus,
  Trash2,
} from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { requireVendedor } from "@/lib/guard";
import { RecordDialog, type Field } from "@/components/RecordDialog";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useSession } from "@/lib/auth";
import {
  useActivities,
  useChangeLeadStatus,
  useConvertLead,
  useLead,
  useLogActivity,
  type Proposal,
} from "@/lib/crm";
import { useDeleteRow, useRows, useSaveRow } from "@/lib/data";
import {
  ACTIVITY_TYPES,
  currency,
  LEAD_STATUS,
  label,
  options,
  PROPOSAL_STATUS,
  shortDate,
  today,
} from "@/lib/format";
import { leadFields } from "./leads.index";

export const Route = createFileRoute("/_authenticated/leads/$leadId")({
  beforeLoad: () => requireVendedor(),
  head: () => ({
    meta: [
      { title: "Oportunidade — VYNEXA" },
      {
        name: "description",
        content: "Linha do tempo, propostas e conversão em contrato de uma oportunidade comercial.",
      },
      { property: "og:title", content: "Oportunidade — VYNEXA" },
      { property: "og:description", content: "Detalhe do lead no CRM VYNEXA." },
    ],
  }),
  component: LeadDetail,
});

const activityFields: Field[] = [
  { name: "type", label: "Tipo", type: "select", options: options(ACTIVITY_TYPES.filter((t) => t !== "status")) },
  { name: "description", label: "Descrição", type: "textarea", required: true },
  { name: "happened_at", label: "Data", type: "date" },
  { name: "next_contact_at", label: "Próximo contato", type: "date" },
];

const proposalFields: Field[] = [
  { name: "title", label: "Título da proposta", required: true },
  { name: "amount", label: "Valor do projeto (R$)", type: "number" },
  { name: "monthly_fee", label: "Mensalidade (R$)", type: "number" },
  { name: "deadline_days", label: "Prazo (dias)", type: "number" },
  { name: "description", label: "Descrição", type: "textarea" },
  { name: "services", label: "Serviços incluídos", type: "textarea" },
  { name: "notes", label: "Observações", type: "textarea" },
  { name: "status", label: "Situação", type: "select", options: options(PROPOSAL_STATUS) },
];

function LeadDetail() {
  const { leadId } = Route.useParams();
  const { user } = useSession();
  const { data: lead, isLoading } = useLead(leadId);
  const { data: activities = [] } = useActivities(leadId);
  const { data: allProposals = [] } = useRows<Proposal>("proposals");
  const saveLead = useSaveRow("leads");
  const saveProposal = useSaveRow("proposals");
  const removeProposal = useDeleteRow("proposals");
  const logActivity = useLogActivity();
  const changeStatus = useChangeLeadStatus();
  const convert = useConvertLead();

  const proposals = allProposals.filter((p) => p.lead_id === leadId);
  const accepted = proposals.find((p) => p.status === "aceita");

  if (!isLoading && !lead) {
    return (
      <AppShell title="Oportunidade" description="Registro não encontrado.">
        <p className="rounded-2xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
          Este lead não existe ou não pertence a você.
        </p>
      </AppShell>
    );
  }

  if (!lead || !user) {
    return (
      <AppShell title="Oportunidade" description="Carregando dados…">
        <div className="h-40 animate-pulse rounded-2xl border border-border bg-card" />
      </AppShell>
    );
  }

  const contact = [lead.whatsapp, lead.phone, lead.email].filter(Boolean).join(" · ") || "sem contato";

  return (
    <AppShell
      title={lead.company || lead.name}
      description={`${lead.niche || "Sem nicho"} · ${lead.city || "—"}${lead.state ? `/${lead.state}` : ""}`}
      actions={
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="ghost" size="sm">
            <Link to="/leads">
              <ArrowLeft className="size-4" /> Voltar
            </Link>
          </Button>
          <Select
            value={lead.status}
            onValueChange={(status) => changeStatus.mutate({ lead, status, userId: user.id })}
          >
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {LEAD_STATUS.map((item) => (
                <SelectItem key={item} value={item}>
                  {label(item)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <RecordDialog
            title="Editar lead"
            fields={leadFields}
            initial={lead}
            onSubmit={(values) => saveLead.mutate({ ...values, id: lead.id })}
            trigger={<Button variant="secondary">Editar</Button>}
          />
        </div>
      }
    >
      <div className="grid gap-4 lg:grid-cols-3">
        <section className="rounded-2xl border border-border bg-card p-5 shadow-panel">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold">Dados do lead</h2>
            <StatusBadge status={lead.status} />
          </div>
          <dl className="mt-4 space-y-2 text-sm">
            <Row term="Empresa" value={lead.company} />
            <Row term="Nicho" value={lead.niche} />
            <Row term="Contato" value={`${lead.name} — ${contact}`} />
            <Row term="Telefone/WhatsApp" value={lead.whatsapp || lead.phone} />
            <Row term="Cidade" value={lead.city} />
            <Row term="Estado" value={lead.state} />
            <Row term="Endereço" value={lead.address} />
            {lead.google_maps_url ? (
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">Google Maps</dt>
                <dd className="text-right">
                  <a href={lead.google_maps_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center justify-end gap-1">
                    Ver no mapa <ExternalLink className="size-3" />
                  </a>
                </dd>
              </div>
            ) : null}
            <Row term="Origem" value={lead.source} />
            <Row term="Cadastrado em" value={shortDate(lead.created_at)} />
            <Row term="Próximo contato" value={shortDate(lead.next_contact_at)} />
            <Row
              term="Valor"
              value={currency(lead.closed_value || lead.estimated_value)}
            />
            <Row term="Observações" value={lead.notes} />
          </dl>

          {lead.status === "fechado" ? (
            <Button
              className="mt-4 w-full"
              disabled={convert.isPending}
              onClick={() =>
                convert.mutate({
                  lead,
                  userId: user.id,
                  amount: accepted?.amount ?? lead.closed_value ?? lead.estimated_value,
                  monthlyFee: accepted?.monthly_fee ?? 0,
                  proposalId: accepted?.id ?? null,
                })
              }
            >
              Converter em contrato
            </Button>
          ) : null}
        </section>

        <section className="rounded-2xl border border-border bg-card p-5 shadow-panel lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold">Linha do tempo</h2>
            <RecordDialog
              title="Adicionar atividade"
              fields={activityFields}
              initial={{ type: "ligacao", happened_at: today() }}
              onSubmit={(values) =>
                logActivity.mutate({
                  lead_id: lead.id,
                  user_id: user.id,
                  type: String(values['type'] ?? "observacao"),
                  description: String(values['description'] ?? ""),
                  happened_at: (values['happened_at'] as string) || today(),
                  next_contact_at: (values['next_contact_at'] as string) ?? null,
                })
              }
              trigger={
                <Button size="sm">
                  <Plus className="size-4" /> Adicionar atividade
                </Button>
              }
            />
          </div>

          <ol className="mt-4 space-y-3">
            {activities.map((activity) => (
              <li key={activity.id} className="flex gap-3 rounded-xl border border-border p-3">
                <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-secondary">
                  {activity.type === "observacao" || activity.type === "status" ? (
                    <MessageSquare className="size-4" />
                  ) : (
                    <CalendarClock className="size-4" />
                  )}
                </span>
                <span className="min-w-0">
                  <span className="block text-sm">{activity.description}</span>
                  <span className="text-xs text-muted-foreground">
                    {label(activity.type)} · {shortDate(activity.happened_at)}
                    {activity.next_contact_at
                      ? ` · próximo contato ${shortDate(activity.next_contact_at)}`
                      : ""}
                  </span>
                </span>
              </li>
            ))}
            {activities.length === 0 ? (
              <li className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
                Nenhuma atividade registrada para esta oportunidade.
              </li>
            ) : null}
          </ol>
        </section>
      </div>

      <section className="mt-4 rounded-2xl border border-border bg-card p-5 shadow-panel">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold">Propostas comerciais</h2>
          <RecordDialog
            title="Nova proposta"
            fields={proposalFields}
            initial={{
              title: `Proposta — ${lead.company || lead.name}`,
              status: "rascunho",
              amount: lead.estimated_value,
              monthly_fee: 0,
              deadline_days: 15,
            }}
            onSubmit={(values) =>
              saveProposal.mutate({
                ...values,
                lead_id: lead.id,
                owner_id: user.id,
                sent_at: values['status'] === "enviada" ? new Date().toISOString() : null,
              })
            }
            trigger={
              <Button size="sm" variant="secondary">
                <FileText className="size-4" /> Nova proposta
              </Button>
            }
          />
        </div>

        <ul className="mt-4 space-y-3">
          {proposals.map((proposal) => (
            <li
              key={proposal.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border p-3 text-sm"
            >
              <span className="min-w-0">
                <span className="block font-medium">{proposal.title}</span>
                <span className="text-xs text-muted-foreground">
                  {currency(proposal.amount)} · mensalidade {currency(proposal.monthly_fee)} · prazo{" "}
                  {proposal.deadline_days} dias
                </span>
              </span>
              <span className="flex items-center gap-2">
                <StatusBadge status={proposal.status} />
                {proposal.status === "aceita" ? (
                  <Button
                    size="sm"
                    disabled={convert.isPending}
                    onClick={() =>
                      convert.mutate({
                        lead,
                        userId: user.id,
                        amount: proposal.amount,
                        monthlyFee: proposal.monthly_fee,
                        proposalId: proposal.id,
                      })
                    }
                  >
                    Gerar contrato
                  </Button>
                ) : null}
                <RecordDialog
                  title="Editar proposta"
                  fields={proposalFields}
                  initial={proposal}
                  onSubmit={(values) => saveProposal.mutate({ ...values, id: proposal.id })}
                  trigger={
                    <Button variant="ghost" size="sm">
                      Editar
                    </Button>
                  }
                />
                <Button variant="ghost" size="sm" onClick={() => removeProposal.mutate(proposal.id)}>
                  <Trash2 className="size-4 text-destructive" />
                </Button>
              </span>
            </li>
          ))}
          {proposals.length === 0 ? (
            <li className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
              Nenhuma proposta criada para esta oportunidade.
            </li>
          ) : null}
        </ul>
      </section>
    </AppShell>
  );
}

function Row({ term, value }: { term: string; value: string | null | undefined }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-muted-foreground">{term}</dt>
      <dd className="max-w-[60%] text-right">{value || "—"}</dd>
    </div>
  );
}
