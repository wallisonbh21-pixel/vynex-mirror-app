import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { 
  Copy, 
  Share2, 
  QrCode, 
  ExternalLink, 
  Target, 
  TrendingUp, 
  Users, 
  CheckCircle2, 
  Clock,
  Search,
  ChevronRight
} from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { StatCard } from "@/components/StatCard";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  getReferralToken, 
  getReferralMetrics, 
  getReferralLeads,
  getAdminReferralStats
} from "@/lib/referral.functions";

import { useRoles } from "@/lib/auth";
import { requireVendedor } from "@/lib/guard";
import { STATUS_LABEL, shortDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import { QRCodeSVG } from "qrcode.react";

export const Route = createFileRoute("/_authenticated/indicar")({
  beforeLoad: () => requireVendedor(),
  head: () => ({
    meta: [
      { title: "Indicação de Clientes — ScaleNexus" },
    ],
  }),
  component: ReferralPage,
});

function ReferralPage() {
  const { isAdmin } = useRoles() as any;
  
  const { 
    data: tokenData, 
    isLoading: isLoadingToken, 
    isError: isErrorToken,
    refetch: refetchToken
  } = useQuery({
    queryKey: ["referral-token"],
    queryFn: () => getReferralToken(),
    retry: 1,
  });

  const { data: metrics } = useQuery({
    queryKey: ["referral-metrics"],
    queryFn: () => getReferralMetrics(),
  });

  const { data: leads } = useQuery({
    queryKey: ["referral-leads"],
    queryFn: () => getReferralLeads(),
  });

  const { data: adminStats } = useQuery({
    queryKey: ["admin-referral-stats"],
    queryFn: () => getAdminReferralStats(),
    enabled: isAdmin,
  });


  const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
  const referralUrl = tokenData?.token ? `${baseUrl}/comece-seu-projeto/ref/${tokenData.token}` : "";

  const copyLink = () => {
    if (!referralUrl) return;
    navigator.clipboard.writeText(referralUrl);
    toast.success("Link copiado com sucesso.");
  };

  const shareWhatsApp = () => {
    const text = `Olá! A ScaleNexus ajuda empresas a criarem e evoluírem sua presença digital. Se quiser conhecer nossas soluções, conte um pouco sobre seu projeto por aqui: ${referralUrl}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  };

  const getFriendlyStatus = (status: string) => {
    const map: Record<string, string> = {
      novo: "Novo",
      contatado: "Contatado",
      interessado: "Em Negociação",
      proposta: "Em Negociação",
      negociacao: "Em Negociação",
      fechado: "Convertido",
      perdido: "Perdido",
    };
    return map[status] || STATUS_LABEL[status] || status;
  };

  return (
    <AppShell 
      title="Indicação de Clientes" 
      description={isAdmin ? "Visão administrativa e link institucional." : "Indique novos clientes e acompanhe seus resultados."}
    >
      <div className="space-y-8">
        {/* Link Area */}
        <section className="relative overflow-hidden rounded-3xl border border-border bg-card p-6 shadow-sm lg:p-8">
          <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-2">
              <h2 className="text-2xl font-bold tracking-tight">
                {isAdmin ? "Link Institucional ScaleNexus" : "Indique novos clientes"}
              </h2>
              <p className="text-muted-foreground">
                Compartilhe seu link exclusivo. Os interessados que preencherem o formulário serão identificados automaticamente como suas indicações.
              </p>
            </div>
            
            <div className="flex flex-wrap gap-3">
              <Button onClick={copyLink} className="gap-2 bg-primary hover:bg-primary/90">
                <Copy className="size-4" />
                Copiar Link
              </Button>
              <Button onClick={shareWhatsApp} variant="secondary" className="gap-2">
                <Share2 className="size-4" />
                WhatsApp
              </Button>
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" className="gap-2">
                    <QrCode className="size-4" />
                    QR Code
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>QR Code de Indicação</DialogTitle>
                  </DialogHeader>
                  <div className="flex flex-col items-center justify-center p-6 space-y-4">
                    <div className="bg-white p-4 rounded-xl border border-border">
                      {referralUrl && <QRCodeSVG value={referralUrl} size={256} />}
                    </div>
                    <p className="text-center text-sm text-muted-foreground">
                      Aponte a câmera para acessar o formulário de briefing.
                    </p>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
          
          <div className="mt-6 flex items-center gap-3 rounded-2xl bg-muted/50 p-4 font-mono text-sm">
            {isLoadingToken ? (
              <span className="flex items-center gap-2 text-muted-foreground italic">
                <Clock className="size-4 animate-spin" />
                Carregando seu link...
              </span>
            ) : isErrorToken ? (
              <div className="flex items-center justify-between w-full gap-2 text-destructive">
                <span className="italic">Não foi possível carregar seu link de indicação.</span>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => refetchToken()}
                  className="h-7 text-xs gap-1"
                >
                  <Clock className="size-3" />
                  Tentar novamente
                </Button>
              </div>
            ) : tokenData?.exists ? (
              <span className="truncate text-foreground font-medium">{referralUrl}</span>
            ) : (
              <span className="text-muted-foreground italic">Seu link de indicação ainda não está disponível.</span>
            ) }
          </div>
        </section>

        {/* Metrics Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <StatCard 
            label="Total de Indicações" 
            value={String(metrics?.total || 0)} 
            icon={Target} 
            hint="Leads originados"
          />
          <StatCard 
            label="Novos" 
            value={String(metrics?.novos || 0)} 
            icon={Clock} 
            hint="Aguardando contato"
          />
          <StatCard 
            label="Em Negociação" 
            value={String(metrics?.emNegociacao || 0)} 
            icon={TrendingUp} 
            hint="Processo comercial"
          />
          <StatCard 
            label="Convertidos" 
            value={String(metrics?.convertidos || 0)} 
            icon={CheckCircle2} 
            hint="Leads fechados"
          />
          <StatCard 
            label="Taxa de Conversão" 
            value={`${metrics?.taxaConversao || 0}%`} 
            icon={TrendingUp} 
            hint="Sucesso comercial"
          />
        </div>

        {isAdmin && adminStats && (
          <section className="space-y-4">
            <h3 className="text-lg font-semibold">Desempenho por Vendedor</h3>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {adminStats.performance.map((s: any) => (
                <Card key={s.name} className="p-4 space-y-2">
                  <div className="font-medium truncate">{s.name}</div>
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>Indicações: {s.total}</span>
                    <span className="text-primary font-semibold">{s.taxa}%</span>
                  </div>
                </Card>
              ))}
            </div>
          </section>
        )}

        {/* Leads Table */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold">Minhas Indicações</h3>
          </div>
          
          <div className="hidden lg:block overflow-hidden rounded-2xl border border-border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente/Empresa</TableHead>
                  <TableHead>Serviço/Nicho</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Responsável</TableHead>
                  <TableHead className="text-right">Ação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(leads as any[])?.map((item: any) => (
                  <TableRow key={item.lead_id}>
                    <TableCell>
                      <div className="font-medium">{item.leads?.company || item.leads?.name}</div>
                      <div className="text-xs text-muted-foreground">{item.leads?.name}</div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">{item.leads?.niche || "—"}</div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {shortDate(item.leads?.created_at)}
                    </TableCell>
                    <TableCell>
                      <span className={cn(
                        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
                        item.leads?.status === "fechado" ? "bg-green-500/10 text-green-500" :
                        item.leads?.status === "novo" ? "bg-blue-500/10 text-blue-500" :
                        "bg-yellow-500/10 text-yellow-500"
                      )}>
                        {getFriendlyStatus(item.leads?.status)}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {item.current_responsible?.nickname || item.current_responsible?.full_name || "A definir"}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" asChild>
                        <a href={`/leads/${item.lead_id}`}>
                          Abrir no CRM
                        </a>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {(!leads || (leads as any[]).length === 0) && (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                      Nenhuma indicação encontrada.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Mobile Cards */}
          <div className="grid gap-4 lg:hidden">
            {(leads as any[])?.map((item: any) => (
              <Card key={item.lead_id} className="p-4 space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-bold">{item.leads?.company || item.leads?.name}</div>
                    <div className="text-xs text-muted-foreground">{shortDate(item.leads?.created_at)}</div>
                  </div>
                  <span className={cn(
                    "rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider",
                    item.leads?.status === "fechado" ? "bg-green-500/20 text-green-500" :
                    item.leads?.status === "novo" ? "bg-blue-500/20 text-blue-500" :
                    "bg-yellow-500/20 text-yellow-500"
                  )}>
                    {getFriendlyStatus(item.leads?.status)}
                  </span>
                </div>
                
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="text-muted-foreground">Serviço:</div>
                  <div className="font-medium text-right">{item.leads?.niche || "—"}</div>
                  <div className="text-muted-foreground">Responsável:</div>
                  <div className="font-medium text-right">{item.current_responsible?.nickname || "A definir"}</div>
                </div>

                <Button variant="outline" size="sm" className="w-full text-xs h-8" asChild>
                  <a href={`/leads/${item.lead_id}`}>
                    Abrir no CRM
                  </a>
                </Button>
              </Card>
            ))}
          </div>
        </section>
      </div>
    </AppShell>
  );
}
