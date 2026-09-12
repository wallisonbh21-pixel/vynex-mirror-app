import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  CreditCard,
  DollarSign,
  CheckCircle2,
  Clock,
  AlertTriangle,
  FileText,
  Calendar,
} from "lucide-react";
import { useClientePortalData } from "@/lib/client";
import {
  CHARGE_STATUS_LABEL,
  summarizeCharges,
  useClientCharges,
  type ClientCharge,
} from "@/lib/charges";
import { currency, shortDate } from "@/lib/format";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/cliente/pagamentos")({
  component: MyPayments,
});

function statusTone(status: string) {
  switch (status) {
    case "PAGO":
      return "bg-green-500/10 text-green-500 border-green-500/20";
    case "VENCIDO":
      return "bg-red-500/10 text-red-500 border-red-500/20";
    case "CANCELADO":
    case "ESTORNADO":
      return "bg-muted text-muted-foreground border-border/40";
    default:
      return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20";
  }
}

function PayAction({ charge }: { charge: ClientCharge }) {
  if (charge.status !== "DISPONIVEL_PARA_PAGAMENTO") return null;
  // Sem gateway configurado: nunca simular checkout.
  if (!charge.checkout_url || !charge.payment_provider) {
    return (
      <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
        Pagamento indisponível
      </span>
    );
  }
  return (
    <Button asChild size="sm" className="h-8">
      <a href={charge.checkout_url} target="_blank" rel="noreferrer">
        Pagar agora
      </a>
    </Button>
  );
}

function MyPayments() {
  const { data: client, isLoading: isLoadingCliente } = useClientePortalData();
  const { data: charges = [], isLoading: isLoadingCharges } = useClientCharges(client?.id);

  if (isLoadingCliente || (!!client && isLoadingCharges)) {
    return (
      <AppShell title="Pagamentos">
        <div className="space-y-6">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-96 w-full" />
        </div>
      </AppShell>
    );
  }

  const {
    totalPaid,
    totalPending,
    totalContracted,
    nextDue,
    hasCharges,
    isUpToDate,
  } = summarizeCharges(charges);

  return (
    <AppShell title="Meus Pagamentos">
      <div className="space-y-8 pb-10">
        {/* RESUMO */}
        <div className="grid gap-6 md:grid-cols-3">
          <Card className="border-sidebar-border/50 bg-sidebar/30 backdrop-blur-sm overflow-hidden relative">
            <div className="absolute top-0 right-0 p-3 opacity-10">
              <FileText size={48} />
            </div>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                <DollarSign className="size-4" />
                Valor Contratado
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-black">{currency(totalContracted)}</div>
              <p className="text-[10px] text-muted-foreground mt-1 uppercase font-bold tracking-tight">
                {hasCharges ? `${charges.length} cobrança(s)` : "Nenhuma cobrança emitida"}
              </p>
            </CardContent>
          </Card>

          <Card className="border-sidebar-border/50 bg-sidebar/30 backdrop-blur-sm overflow-hidden relative">
            <div className="absolute top-0 right-0 p-3 opacity-10">
              <CheckCircle2 size={48} className="text-green-500" />
            </div>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                <CheckCircle2 className="size-4 text-green-500" />
                Total Pago
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-black text-green-500">{currency(totalPaid)}</div>
              <p className="text-[10px] text-muted-foreground mt-1 uppercase font-bold tracking-tight">
                {totalContracted > 0
                  ? `${Math.round((totalPaid / totalContracted) * 100)}% do total`
                  : "0% do total"}
              </p>
            </CardContent>
          </Card>

          <Card className="border-sidebar-border/50 bg-sidebar/30 backdrop-blur-sm overflow-hidden relative">
            <div className="absolute top-0 right-0 p-3 opacity-10">
              <Clock size={48} className="text-yellow-500" />
            </div>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                <Clock className="size-4 text-yellow-500" />
                Saldo Pendente
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-black text-yellow-500">{currency(totalPending)}</div>
              <p className="text-[10px] text-muted-foreground mt-1 uppercase font-bold tracking-tight">
                {totalPending > 0 ? "Aguardando liquidação" : "Sem valores em aberto"}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* STATUS E PRÓXIMO VENCIMENTO */}
        <div className="grid min-w-0 gap-6 md:grid-cols-2">
          <Card className="border-sidebar-border/50 bg-sidebar/30">
            <CardHeader className="pb-2 border-b border-border/10">
              <CardTitle className="text-sm font-bold uppercase tracking-widest text-muted-foreground">
                Status Financeiro
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div
                className={cn(
                  "flex items-center gap-4 p-4 rounded-xl border",
                  !hasCharges
                    ? "bg-background/40 border-border/50"
                    : isUpToDate
                      ? "bg-green-500/5 border-green-500/20"
                      : "bg-yellow-500/5 border-yellow-500/20",
                )}
              >
                <div
                  className={cn(
                    "size-12 rounded-full flex items-center justify-center",
                    "shrink-0",
                    !hasCharges
                      ? "bg-muted text-muted-foreground"
                      : isUpToDate
                        ? "bg-green-500/10 text-green-500"
                        : "bg-yellow-500/10 text-yellow-500",
                  )}
                >
                  {!hasCharges ? (
                    <FileText size={24} />
                  ) : isUpToDate ? (
                    <CheckCircle2 size={24} />
                  ) : (
                    <AlertTriangle size={24} />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-lg font-bold">
                    {!hasCharges
                      ? "Sem cobranças"
                      : isUpToDate
                        ? "Pagamentos em dia"
                        : "Pagamento pendente"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {!hasCharges
                      ? "Você ainda não possui cobranças disponíveis."
                      : isUpToDate
                        ? "Obrigado! Sua conta está regularizada."
                        : "Existem cobranças aguardando seu pagamento."}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-sidebar-border/50 bg-sidebar/30">
            <CardHeader className="pb-2 border-b border-border/10">
              <CardTitle className="text-sm font-bold uppercase tracking-widest text-muted-foreground">
                Próximo Vencimento
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4 p-4 rounded-xl border border-border/50 bg-background/40">
                <div className="size-12 shrink-0 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                  <Calendar size={24} />
                </div>
                <div className="min-w-0">
                  <p className="text-lg font-bold">
                    {nextDue?.due_date ? shortDate(nextDue.due_date) : "Sem vencimento"}
                  </p>
                  <p className="text-sm text-muted-foreground truncate">
                    {nextDue
                      ? `${nextDue.description} · ${currency(Number(nextDue.amount))}`
                      : "Nenhuma cobrança com data de vencimento."}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* HISTÓRICO */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <CreditCard className="size-5 text-primary" />
            Histórico de Cobranças
          </h2>

          {/* MOBILE VIEW: Cards */}
          <div className="grid gap-4 md:hidden">
            {charges.length > 0 ? (
              charges.map((charge) => (
                <Card
                  key={charge.id}
                  className="border-sidebar-border/50 bg-sidebar/30 p-4 space-y-3"
                >
                  <div className="flex justify-between items-start gap-3">
                    <div className="min-w-0">
                      <p className="font-bold text-sm truncate">{charge.description}</p>
                      <p className="text-xs text-muted-foreground">
                        {charge.due_date
                          ? `Vence em ${shortDate(charge.due_date)}`
                          : shortDate(charge.created_at)}
                      </p>
                    </div>
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-[10px] font-bold uppercase tracking-wider shrink-0",
                        statusTone(charge.status),
                      )}
                    >
                      {CHARGE_STATUS_LABEL[charge.status] ?? charge.status}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center gap-3 pt-2 border-t border-border/10">
                    <span className="text-lg font-black">{currency(Number(charge.amount))}</span>
                    <PayAction charge={charge} />
                  </div>
                </Card>
              ))
            ) : (
              <Card className="p-8 text-center border-dashed">
                <p className="text-muted-foreground italic text-sm">
                  Você ainda não possui cobranças disponíveis.
                </p>
              </Card>
            )}
          </div>

          {/* DESKTOP VIEW: Table */}
          <Card className="hidden md:block border-sidebar-border/50 bg-sidebar/30 backdrop-blur-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-sidebar-border/50 bg-sidebar/50">
                    <th className="px-6 py-4 font-bold uppercase tracking-widest text-[10px] text-muted-foreground">Descrição</th>
                    <th className="px-6 py-4 font-bold uppercase tracking-widest text-[10px] text-muted-foreground">Vencimento</th>
                    <th className="px-6 py-4 font-bold uppercase tracking-widest text-[10px] text-muted-foreground">Valor</th>
                    <th className="px-6 py-4 font-bold uppercase tracking-widest text-[10px] text-muted-foreground">Status</th>
                    <th className="px-6 py-4 font-bold uppercase tracking-widest text-[10px] text-muted-foreground text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-sidebar-border/30">
                  {charges.map((charge) => (
                    <tr key={charge.id} className="hover:bg-sidebar/50 transition-colors group">
                      <td className="px-6 py-4">
                        <p className="font-bold">{charge.description}</p>
                        <p className="text-[10px] text-muted-foreground uppercase">
                          {charge.paid_at ? `Pago em ${shortDate(charge.paid_at)}` : shortDate(charge.created_at)}
                        </p>
                      </td>
                      <td className="px-6 py-4 text-muted-foreground">
                        {charge.due_date ? shortDate(charge.due_date) : "—"}
                      </td>
                      <td className="px-6 py-4 font-black text-lg">
                        {currency(Number(charge.amount))}
                      </td>
                      <td className="px-6 py-4">
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-[10px] font-bold uppercase tracking-wider",
                            statusTone(charge.status),
                          )}
                        >
                          {CHARGE_STATUS_LABEL[charge.status] ?? charge.status}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <PayAction charge={charge} />
                      </td>
                    </tr>
                  ))}
                  {charges.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground italic bg-background/20">
                        Você ainda não possui cobranças disponíveis.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
