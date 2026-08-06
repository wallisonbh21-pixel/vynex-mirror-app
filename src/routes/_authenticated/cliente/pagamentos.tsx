import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { CreditCard, DollarSign, Download, CheckCircle2, Clock } from "lucide-react";

export const Route = createFileRoute("/_authenticated/cliente/pagamentos")({
  component: MyPayments,
});

function MyPayments() {
  const { data: transactions, isLoading } = useQuery({
    queryKey: ["client-transactions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("transactions")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  if (isLoading) {
    return (
      <AppShell title="Pagamentos">
        <Skeleton className="h-96 w-full" />
      </AppShell>
    );
  }

  return (
    <AppShell title="Pagamentos">
      <div className="space-y-8">
        <div className="grid gap-6 md:grid-cols-3">
          <Card className="border-sidebar-border/50 bg-sidebar/30 backdrop-blur-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <DollarSign className="size-4" />
                Valor Total Contratado
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">R$ 4.500,00</div>
              <p className="text-xs text-muted-foreground mt-1">Status: Regular</p>
            </CardContent>
          </Card>
          
          <Card className="border-sidebar-border/50 bg-sidebar/30 backdrop-blur-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <CheckCircle2 className="size-4 text-green-500" />
                Total Pago
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">R$ 2.250,00</div>
              <p className="text-xs text-muted-foreground mt-1">50% do total</p>
            </CardContent>
          </Card>

          <Card className="border-sidebar-border/50 bg-sidebar/30 backdrop-blur-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Clock className="size-4 text-yellow-500" />
                Próximo Vencimento
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">15/09/2026</div>
              <p className="text-xs text-muted-foreground mt-1 text-yellow-500">R$ 2.250,00 pendente</p>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <CreditCard className="size-5 text-primary" />
            Histórico de Transações
          </h2>
          <Card className="border-sidebar-border/50 bg-sidebar/30 backdrop-blur-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-sidebar-border/50 bg-sidebar/50">
                    <th className="px-4 py-3 font-medium">Descrição</th>
                    <th className="px-4 py-3 font-medium">Data</th>
                    <th className="px-4 py-3 font-medium">Valor</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-sidebar-border/30">
                  {transactions?.map((tx) => (
                    <tr key={tx.id} className="hover:bg-sidebar/50 transition-colors">
                      <td className="px-4 py-3 font-medium">Pagamento de Parcela</td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {new Date(tx.created_at).toLocaleDateString("pt-BR")}
                      </td>
                      <td className="px-4 py-3 font-mono">
                        R$ {tx.amount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="secondary" className="bg-green-500/10 text-green-500 border-green-500/20 text-[10px]">
                          COMPLETADO
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button variant="ghost" size="icon" className="size-8 hover:bg-primary/10">
                          <Download className="size-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                  {(!transactions || transactions.length === 0) && (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground italic">
                        Nenhum pagamento registrado.
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
