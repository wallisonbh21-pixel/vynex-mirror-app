import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  CreditCard, 
  DollarSign, 
  Download, 
  CheckCircle2, 
  Clock, 
  AlertTriangle,
  FileText,
  Calendar,
  ChevronRight
} from "lucide-react";
import { useClientePortalData } from "@/lib/client";
import { currency, shortDate } from "@/lib/format";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/cliente/pagamentos")({
  component: MyPayments,
});

function MyPayments() {
  const { data: client, isLoading: isLoadingCliente } = useClientePortalData();

  const { data: transactions, isLoading: isLoadingTransactions } = useQuery({
    queryKey: ["client-transactions", client?.id],
    enabled: !!client,
    queryFn: async () => {
      // Buscamos transações vinculadas ao cliente via projeto
      // Como transactions pode estar ligada a projetos, buscamos através deles
      const projectIds = client?.projects?.map(p => p.id) || [];
      
      if (projectIds.length === 0) return [];

      const { data, error } = await supabase
        .from("transactions")
        .select("*")
        .in("project_id", projectIds)
        .order("created_at", { ascending: false });
        
      if (error) throw error;
      return data;
    },
  });

  if (isLoadingCliente || isLoadingTransactions) {
    return (
      <AppShell title="Pagamentos">
        <div className="space-y-6">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-96 w-full" />
        </div>
      </AppShell>
    );
  }

  const activeProjeto = client?.projects?.[0];
  const totalContracted = activeProjeto?.value || 0;
  
  // Calcular totais reais das transações
  const totalPaid = transactions?.reduce((acc, tx) => acc + (tx.amount || 0), 0) || 0;
  const totalPending = Math.max(0, totalContracted - totalPaid);
  
  // Status financeiro
  const isUpToDate = totalPending === 0 || totalPaid > 0; // Simplificação para demo/real

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
                {activeProjeto?.title || "Nenhum projeto ativo"}
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
                {totalContracted > 0 ? `${Math.round((totalPaid / totalContracted) * 100)}% do total` : "0% do total"}
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
                Aguardando liquidação
              </p>
            </CardContent>
          </Card>
        </div>

        {/* STATUS E PRÓXIMO VENCIMENTO */}
        <div className="grid gap-6 md:grid-cols-2">
          <Card className="border-sidebar-border/50 bg-sidebar/30">
            <CardHeader className="pb-2 border-b border-border/10">
              <CardTitle className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Status Financeiro</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className={cn(
                "flex items-center gap-4 p-4 rounded-xl border",
                isUpToDate ? "bg-green-500/5 border-green-500/20" : "bg-yellow-500/5 border-yellow-500/20"
              )}>
                <div className={cn(
                  "size-12 rounded-full flex items-center justify-center",
                  isUpToDate ? "bg-green-500/10 text-green-500" : "bg-yellow-500/10 text-yellow-500"
                )}>
                  {isUpToDate ? <CheckCircle2 size={24} /> : <AlertTriangle size={24} />}
                </div>
                <div>
                  <p className="text-lg font-bold">{isUpToDate ? "Pagamentos em dia" : "Pagamento pendente"}</p>
                  <p className="text-sm text-muted-foreground">
                    {isUpToDate ? "Obrigado! Sua conta está regularizada." : "Existem faturas aguardando seu pagamento."}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-sidebar-border/50 bg-sidebar/30">
            <CardHeader className="pb-2 border-b border-border/10">
              <CardTitle className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Próximo Vencimento</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4 p-4 rounded-xl border border-border/50 bg-background/40">
                <div className="size-12 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                  <Calendar size={24} />
                </div>
                <div>
                  <p className="text-lg font-bold">Consulte sua fatura</p>
                  <p className="text-sm text-muted-foreground">Data de vencimento não disponível no momento.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* HISTÓRICO */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <CreditCard className="size-5 text-primary" />
            Histórico de Transações
          </h2>
          
          {/* MOBILE VIEW: Cards */}
          <div className="grid gap-4 md:hidden">
            {transactions && transactions.length > 0 ? (
              transactions.map((tx) => (
                <Card key={tx.id} className="border-sidebar-border/50 bg-sidebar/30 p-4 space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-bold text-sm">Pagamento</p>
                      <p className="text-xs text-muted-foreground">{shortDate(tx.created_at)}</p>
                    </div>
                    <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20 text-[10px] font-bold uppercase tracking-wider">
                      Pago
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-border/10">
                    <span className="text-lg font-black">{currency(tx.amount)}</span>
                    <Button variant="ghost" size="sm" className="h-8 px-2 text-primary">
                      <Download className="size-4" />
                    </Button>
                  </div>
                </Card>
              ))
            ) : (
              <Card className="p-8 text-center border-dashed">
                <p className="text-muted-foreground italic text-sm">Nenhum pagamento registrado.</p>
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
                    <th className="px-6 py-4 font-bold uppercase tracking-widest text-[10px] text-muted-foreground">Data</th>
                    <th className="px-6 py-4 font-bold uppercase tracking-widest text-[10px] text-muted-foreground">Valor</th>
                    <th className="px-6 py-4 font-bold uppercase tracking-widest text-[10px] text-muted-foreground">Status</th>
                    <th className="px-6 py-4 font-bold uppercase tracking-widest text-[10px] text-muted-foreground text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-sidebar-border/30">
                  {transactions?.map((tx) => (
                    <tr key={tx.id} className="hover:bg-sidebar/50 transition-colors group">
                      <td className="px-6 py-4">
                        <p className="font-bold">Pagamento de Parcela</p>
                        <p className="text-[10px] text-muted-foreground uppercase">Via Cartão/PIX</p>
                      </td>
                      <td className="px-6 py-4 text-muted-foreground">
                        {shortDate(tx.created_at)}
                      </td>
                      <td className="px-6 py-4 font-black text-lg">
                        {currency(tx.amount)}
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20 text-[10px] font-bold uppercase tracking-wider">
                          Pago
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Button variant="ghost" size="icon" className="group-hover:text-primary transition-colors">
                          <Download className="size-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                  {(!transactions || transactions.length === 0) && (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground italic bg-background/20">
                        Nenhum pagamento registrado no histórico.
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
