import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Plus, Search, Trash2 } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { requireVendedor } from "@/lib/guard";
import { RecordDialog, type Field } from "@/components/RecordDialog";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useSession } from "@/lib/auth";
import type { Lead } from "@/lib/crm";
import { useDeleteRow, useRows, useSaveRow } from "@/lib/data";
import { currency, LEAD_STATUS, label, options, shortDate } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/leads/")({
  beforeLoad: () => requireVendedor(),
  head: () => ({
    meta: [
      { title: "Leads — ScaleNexus" },
      {
        name: "description",
        content:
          "Cadastro completo de oportunidades comerciais: empresa, contato, origem, status e próximo follow-up.",
      },
      { property: "og:title", content: "Leads — ScaleNexus" },
      { property: "og:description", content: "CRM comercial da operação ScaleNexus." },
    ],
  }),
  component: LeadsPage,
});

export const leadFields: Field[] = [
  { name: "company", label: "Nome da empresa", required: true },
  { name: "trade_name", label: "Nome fantasia" },
  { name: "niche", label: "Segmento / nicho" },
  { name: "name", label: "Pessoa de contato", required: true },
  { name: "phone", label: "Telefone" },
  { name: "whatsapp", label: "WhatsApp" },
  { name: "email", label: "E-mail", type: "email" },
  { name: "website", label: "Site atual" },
  { name: "instagram", label: "Instagram" },
  { name: "city", label: "Cidade" },
  { name: "state", label: "Estado" },
  { name: "address", label: "Endereço" },
  { name: "google_maps_url", label: "Google Maps URL" },
  { name: "lat", label: "Latitude", type: "number" },
  { name: "lon", label: "Longitude", type: "number" },
  { name: "source", label: "Origem do lead", placeholder: "Indicação, Instagram, prospecção..." },
  { name: "status", label: "Status", type: "select", options: options(LEAD_STATUS) },
  { name: "estimated_value", label: "Valor estimado (R$)", type: "number" },
  { name: "next_contact_at", label: "Próximo contato", type: "date" },
  { name: "notes", label: "Observações", type: "textarea" },
];

const PAGE_SIZE = 10;

function LeadsPage() {
  const { user } = useSession();
  const { data = [], isLoading } = useRows<Lead>("leads");
  const save = useSaveRow("leads");
  const remove = useDeleteRow("leads", ["lead_activities"]);
  const [term, setTerm] = useState("");
  const [status, setStatus] = useState("todos");
  const [page, setPage] = useState(0);

  const filtered = useMemo(() => {
    const q = term.trim().toLowerCase();
    return data.filter((lead) => {
      const matchStatus = status === "todos" || lead.status === status;
      const matchTerm =
        !q ||
        [lead.company, lead.trade_name, lead.name, lead.city, lead.niche, lead.source]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(q));
      return matchStatus && matchTerm;
    });
  }, [data, term, status]);

  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const current = Math.min(page, pages - 1);
  const rows = filtered.slice(current * PAGE_SIZE, current * PAGE_SIZE + PAGE_SIZE);

  return (
    <AppShell
      title="Leads"
      description="Cada oportunidade da prospecção até o contrato assinado."
      actions={
        <RecordDialog
          title="Novo lead"
          fields={leadFields}
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
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-56 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={term}
            onChange={(e) => {
              setTerm(e.target.value);
              setPage(0);
            }}
            placeholder="Buscar por empresa, contato, cidade ou origem"
            className="pl-9"
          />
        </div>
        <Select
          value={status}
          onValueChange={(value) => {
            setStatus(value);
            setPage(0);
          }}
        >
          <SelectTrigger className="w-52">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os status</SelectItem>
            {LEAD_STATUS.map((item) => (
              <SelectItem key={item} value={item}>
                {label(item)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="mt-4 overflow-x-auto rounded-2xl border border-border bg-card shadow-panel">
        <table className="w-full min-w-[720px] text-sm">
          <thead className="bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Empresa</th>
              <th className="px-4 py-3">Contato</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Valor</th>
              <th className="px-4 py-3">Próximo contato</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {rows.map((lead) => (
              <tr key={lead.id} className="border-t border-border">
                <td className="px-4 py-3">
                  <Link
                    to="/leads/$leadId"
                    params={{ leadId: lead.id }}
                    className="font-medium hover:text-primary"
                  >
                    {lead.company || lead.name}
                  </Link>
                  <span className="block text-xs text-muted-foreground">
                    {lead.niche || "Sem nicho"} · {lead.city || "—"}
                    {lead.state ? `/${lead.state}` : ""}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className="block">{lead.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {lead.whatsapp || lead.phone || lead.email || "sem contato"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={lead.status} />
                </td>
                <td className="px-4 py-3 text-right">
                  {currency(lead.closed_value || lead.estimated_value)}
                </td>
                <td className="px-4 py-3 text-muted-foreground">{shortDate(lead.next_contact_at)}</td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-1">
                    <Button asChild variant="ghost" size="sm">
                      <Link to="/leads/$leadId" params={{ leadId: lead.id }}>
                        Abrir
                      </Link>
                    </Button>
                    <RecordDialog
                      title="Editar lead"
                      fields={leadFields}
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
            {!isLoading && rows.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">
                  Nenhuma oportunidade cadastrada ainda.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
        <span>
          {filtered.length} oportunidade{filtered.length === 1 ? "" : "s"} · página {current + 1} de {pages}
        </span>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" disabled={current === 0} onClick={() => setPage(current - 1)}>
            Anterior
          </Button>
          <Button
            variant="ghost"
            size="sm"
            disabled={current >= pages - 1}
            onClick={() => setPage(current + 1)}
          >
            Próxima
          </Button>
        </div>
      </div>
    </AppShell>
  );
}
