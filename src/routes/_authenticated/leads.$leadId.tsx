import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  ArrowLeft,
  CalendarClock,
  ExternalLink,
  FileText,
  MapPin,
  MessageSquare,
  Plus,
  Trash2,
  Phone,
  AlertTriangle,
} from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { requireVendedor } from "@/lib/guard";
import { RecordDialog, type Field } from "@/components/RecordDialog";
import { StatusBadge } from "@/components/StatusBadge";
import { SalesProgression } from "@/components/SalesProgression";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
import { sanitizeExternalUrl } from "@/lib/security";
import { cn } from "@/lib/utils";
import { useLeadBriefing } from "@/lib/lead-briefing";
import { leadFields } from "./leads.index";

export const Route = createFileRoute("/_authenticated/leads/$leadId")({
  beforeLoad: () => requireVendedor(),
  head: () => ({
    meta: [
      { title: "Oportunidade — ScaleNexus" },
      {
        name: "description",
        content: "Linha do tempo, propostas e conversão em contrato de uma oportunidade comercial.",
      },
      { property: "og:title", content: "Oportunidade — ScaleNexus" },
      { property: "og:description", content: "Detalhe do lead no CRM ScaleNexus." },
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
  const [duplicateCliente, setDuplicateCliente] = useState<any>(null);
  const [conversionData, setConversionData] = useState<any>(null);
  const { data: lead, isLoading } = useLead(leadId);
  const { data: activities = [] } = useActivities(leadId);
  const { data: allProposals = [] } = useRows<Proposal>("proposals");
  const saveLead = useSaveRow("leads");
  const saveProposal = useSaveRow("proposals");
  const removeProposal = useDeleteRow("proposals");
  const logActivity = useLogActivity();
  const changeStatus = useChangeLeadStatus();
  const convert = useConvertLead();
  const { data: briefing } = useLeadBriefing(leadId, lead?.notes || null);
  const { data: attribution } = useQuery({
    queryKey: ["lead-attribution", leadId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lead_attribution" as any)
        .select(`
          *,
          originator:profiles!lead_attribution_originator_id_fkey(full_name, nickname),
          responsible:profiles!lead_attribution_current_responsible_id_fkey(full_name, nickname)
        `)
        .eq("lead_id", leadId)
        .maybeSingle();
      if (error) throw error;
      return data as any;
    },
    enabled: !!leadId,
  });

  const handleConvert = (data: any) => {
    setConversionData(data);
    convert.mutate(data, {
      onError: (error: any) => {
        if (error.message === "DUPLICATE_CLIENT") {
          setDuplicateCliente(error.clients[0]);
        }
      }
    });
  };

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
      <div className="mb-8 rounded-2xl border border-border bg-card p-6 shadow-panel">
        <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-6 flex items-center gap-2">
          <CalendarClock className="size-4 text-brand-500" /> Progresso da Oportunidade
        </h2>
        <SalesProgression status={lead.status} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <section className="rounded-2xl border border-border bg-card p-5 shadow-panel">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold">Dados do lead</h2>
            <StatusBadge status={lead.status} />
          </div>
          <dl className="mt-4 space-y-3 text-sm">
            <Row term="Empresa" value={lead.company} icon={FileText} />
            <Row term="Nicho" value={lead.niche} />
            <Row term="Contato" value={lead.name} />
            <div className="flex justify-between gap-3 pt-1">
              <dt className="text-muted-foreground flex items-center gap-1.5"><Phone className="size-3.5" /> Contato</dt>
              <dd className="text-right">
                <div className="flex flex-col items-end">
                  {lead.whatsapp && (
                    <a href={sanitizeExternalUrl(`https://wa.me/${lead.whatsapp.replace(/\D/g, '')}`)} target="_blank" rel="noopener noreferrer" className="text-brand-500 font-medium hover:underline">
                      {lead.whatsapp}
                    </a>
                  )}
                  {lead.email && <span className="text-xs">{lead.email}</span>}
                </div>
              </dd>
            </div>
            <Row term="Cidade" value={lead.city} icon={MapPin} />
            {lead.google_maps_url ? (
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground flex items-center gap-1.5"><MapPin className="size-3.5" /> Localização</dt>
                <dd className="text-right">
                  <a href={sanitizeExternalUrl(lead.google_maps_url)} target="_blank" rel="noopener noreferrer" className="text-brand-500 hover:underline flex items-center justify-end gap-1 font-medium">
                    Ver no Google Maps <ExternalLink className="size-3" />
                  </a>
                </dd>
              </div>
            ) : null}
            <Row term="Cadastrado em" value={shortDate(lead.created_at)} />
            <Row
              term="Valor Estimado"
              value={currency(lead.closed_value || lead.estimated_value)}
            />
          </dl>

          <div className="mt-6 pt-6 border-t border-border space-y-4">
            <div className="grid grid-cols-1 gap-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Origem do Lead</span>
                  <div className="text-sm font-medium">
                    {lead.source === "indicacao" ? "Indicação" : lead.source === "site_publico" ? "ScaleNexus / Institucional" : lead.source || "Direto / Site"}
                  </div>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Acesso ao Portal</span>
                  <div className="flex items-center gap-2">
                    <div className={cn("size-2 rounded-full", lead.status === 'fechado' ? "bg-amber-500" : "bg-muted")} />
                    <span className="text-sm font-medium">
                      {lead.status === 'fechado' ? "PENDENTE" : "Indisponível"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-border/50">
                <h3 className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider mb-3">Atribuição Comercial</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <span className="text-[10px] text-muted-foreground uppercase font-medium">Indicado por</span>
                    <div className="text-sm font-semibold text-brand-500">
                      {attribution?.originator ? (attribution.originator.full_name || attribution.originator.nickname) : attribution?.originator_id ? "User Externo" : "ScaleNexus"}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] text-muted-foreground uppercase font-medium">Responsável Atual</span>
                    <div className="text-sm font-semibold">
                      {attribution?.responsible ? (attribution.responsible.full_name || attribution.responsible.nickname) : "Aguardando atribuição"}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {lead.status !== "fechado" ? (
              <Button
                className="w-full bg-brand-500 hover:bg-brand-600 text-white font-bold"
                disabled={convert.isPending}
                onClick={() =>
                  handleConvert({
                    lead,
                    userId: user.id,
                    amount: accepted?.amount ?? lead.closed_value ?? lead.estimated_value,
                    monthlyFee: accepted?.monthly_fee ?? 0,
                    proposalId: accepted?.id ?? null,
                  })
                }
              >
                Converter em Clientee & Projeto
              </Button>
            ) : (
              <Button
                variant="outline"
                className="w-full border-brand-500/50 text-brand-500 hover:bg-brand-500/5"
                asChild
              >
                <Link to="/admin/clientes">
                  Ver Clientee no Painel
                </Link>
              </Button>
            )}
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-card p-5 shadow-panel">
          <h2 className="text-sm font-semibold flex items-center gap-2 mb-4">
            <span role="img" aria-label="briefing">📋</span> Briefing Completo
          </h2>
          
          <div className="space-y-6">
            {briefing?.briefingItems && briefing.briefingItems.length > 0 ? (
              briefing.briefingItems.map((item: any) => {
                const { label, value, buttonLabel } = item;
                const isUrl = typeof value === 'string' && (
                  value.startsWith('http://') || 
                  value.startsWith('https://') || 
                  (value.includes('.') && !value.includes(' ') && value.length > 4)
                );

                return (
                  <div key={item.key} className="space-y-1 group">
                    <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">{label}</span>
                    <div className={cn(
                      "text-sm p-3 rounded-lg border leading-relaxed transition-colors",
                      item.key === 'serviceId' 
                        ? "font-bold bg-brand-500/10 text-brand-500 border-brand-500/20" 
                        : "text-foreground bg-secondary/20 border-border/50 whitespace-pre-wrap group-hover:bg-secondary/40"
                    )}>
                      {isUrl ? (
                        <div className="flex flex-col gap-2">
                          <span className="break-all font-mono text-xs opacity-70 mb-1">{String(value)}</span>
                          <Button 
                            asChild 
                            variant="secondary" 
                            size="sm" 
                            className="w-fit h-7 text-[10px] gap-1.5 border border-brand-500/20 text-brand-600 hover:text-white hover:bg-brand-500 transition-all shadow-sm"
                          >
                            <a href={sanitizeExternalUrl(String(value).startsWith('http') ? String(value) : `https://${value}`)} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="size-3" /> {buttonLabel || "Abrir referência"}
                            </a>
                          </Button>
                        </div>
                      ) : (
                        String(value)
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-sm text-muted-foreground p-3 rounded-lg border border-dashed border-border bg-secondary/10">
                Nenhuma informação detalhada disponível.
              </div>
            )}
          </div>
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
                      handleConvert({
                        lead,
                        userId: user.id,
                        amount: proposal.amount,
                        monthlyFee: proposal.monthly_fee,
                        proposalId: proposal.id,
                      })
                    }
                  >
                    Converter em Clientee
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

      <AlertDialog open={!!duplicateCliente} onOpenChange={(open) => !open && setDuplicateCliente(null)}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-warning">
              <AlertTriangle className="size-5" /> Possível cliente já cadastrado
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <p>Encontramos um cliente com o mesmo e-mail ou WhatsApp.</p>
              <div className="rounded-xl border border-border bg-muted/30 p-3 text-sm">
                <div className="font-bold text-foreground">{duplicateCliente?.company}</div>
                <div className="text-muted-foreground">{duplicateCliente?.contact_name}</div>
              </div>
              <p className="text-xs text-muted-foreground">O que deseja fazer? Você pode utilizar este cliente existente para vincular o novo projeto.</p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <AlertDialogCancel asChild>
              <Button variant="ghost" className="sm:flex-1">Cancelar</Button>
            </AlertDialogCancel>
            <Button 
              variant="outline" 
              className="sm:flex-1"
              asChild
            >
              <Link to="/admin/clientes">
                Ver Clientee Existente
              </Link>
            </Button>
            <AlertDialogAction asChild>
              <Button 
                className="sm:flex-1 bg-brand-500 hover:bg-brand-600"
                onClick={() => {
                  convert.mutate({
                    ...conversionData,
                    clientId: duplicateCliente.id
                  });
                  setDuplicateCliente(null);
                }}
              >
                Usar Clientee Existente
              </Button>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppShell>
  );
}

function Row({ term, value, icon: Icon }: { term: string; value: string | null | undefined, icon?: any }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-muted-foreground flex items-center gap-1.5">
        {Icon && <Icon className="size-3.5" />}
        {term}
      </dt>
      <dd className="max-w-[60%] text-right font-medium">{value || "—"}</dd>
    </div>
  );
}
