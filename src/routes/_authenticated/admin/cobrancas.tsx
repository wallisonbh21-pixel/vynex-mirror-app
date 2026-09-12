import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { requireAdmin } from "@/lib/guard";
import { currency, shortDate } from "@/lib/format";
import { CHARGE_STATUS_LABEL, CHARGE_TYPE_LABEL, useAdminCharges } from "@/lib/charges";

export const Route = createFileRoute("/_authenticated/admin/cobrancas")({
  beforeLoad: () => requireAdmin(),
  component: AdminChargesPage,
});

function AdminChargesPage() {
  const { data: charges = [], isLoading } = useAdminCharges();

  return (
    <AppShell
      title="Cobranças de Clientes"
      description="Visualização das cobranças emitidas para clientes."
    >
      <section className="surface card-hover overflow-x-auto rounded-2xl border border-border">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead>
            <tr className="border-b border-border/60 text-[10px] uppercase tracking-widest text-muted-foreground">
              <th className="px-4 py-3 font-bold">Cliente</th>
              <th className="px-4 py-3 font-bold">Projeto</th>
              <th className="px-4 py-3 font-bold">Descrição</th>
              <th className="px-4 py-3 font-bold">Tipo</th>
              <th className="px-4 py-3 font-bold">Valor</th>
              <th className="px-4 py-3 font-bold">Status</th>
              <th className="px-4 py-3 font-bold">Vencimento</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/40">
            {charges.map((c) => (
              <tr key={c.id}>
                <td className="px-4 py-3 font-medium">
                  {c.clients?.company || c.clients?.contact_name || "—"}
                </td>
                <td className="px-4 py-3 text-muted-foreground">{c.projects?.title || "—"}</td>
                <td className="px-4 py-3">{c.description}</td>
                <td className="px-4 py-3 text-muted-foreground">
                  {CHARGE_TYPE_LABEL[c.charge_type] ?? c.charge_type}
                </td>
                <td className="px-4 py-3 font-bold">{currency(Number(c.amount))}</td>
                <td className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  {CHARGE_STATUS_LABEL[c.status] ?? c.status}
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {c.due_date ? shortDate(c.due_date) : "—"}
                </td>
              </tr>
            ))}
            {!isLoading && charges.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center italic text-muted-foreground">
                  Nenhuma cobrança registada.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>
    </AppShell>
  );
}
