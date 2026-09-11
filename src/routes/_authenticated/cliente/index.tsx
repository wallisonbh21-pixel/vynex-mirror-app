import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { useClientePortalData } from "@/lib/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { 
  Rocket, 
  AlertCircle, 
  Inbox, 
  ArrowRight, 
  CheckCircle2, 
  MessageSquare, 
  FileText, 
  Calendar,
  Clock,
  ShieldCheck,
  LayoutDashboard,
  Palette,
  Monitor,
  Video,
  Send,
  Wallet,
  Activity,
  ArrowUpRight
} from "lucide-react";
import { ProjectProgression } from "@/components/ProjectProgression";
import { DashboardShell } from "@/components/DashboardShell";
import { DashboardHeader } from "@/components/DashboardHeader";
import { StatCard } from "@/components/StatCard";
import { PROJECT_STATUS, getProjectProgress, getProjectNextStep, label } from "@/lib/format";
import { useNotifications } from "@/lib/notifications";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/cliente/")({
  component: ClienteDashboard,
});

function ClienteDashboard() {
  const { data: client, isLoading, isError, refetch } = useClientePortalData();
  const { data: notifications = [] } = useNotifications();
  
  const { data: meetings = [] } = useQuery({
    queryKey: ["client-upcoming-meeting", client?.id],
    enabled: !!client,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("meetings")
        .select("*")
        .eq("client_id", client!.id)
        .gte("scheduled_at", new Date().toISOString())
        .order("scheduled_at", { ascending: true })
        .limit(1);
      if (error) throw error;
      return data || [];
    },
  });

  const { data: recentActivity = [] } = useQuery({
    queryKey: ["client-recent-activity", client?.id],
    enabled: !!client,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", client!.user_id!)
        .order("created_at", { ascending: false })
        .limit(5);
      if (error) throw error;
      return data || [];
    },
  });

  if (isLoading) {
    return (
      <AppShell title="Dashboard">
        <div className="flex flex-col items-center justify-center py-20 space-y-6">
          <Skeleton className="h-12 w-64" />
          <Skeleton className="h-48 w-full max-w-4xl" />
          <p className="text-sm text-muted-foreground animate-pulse">Carregando seu painel...</p>
        </div>
      </AppShell>
    );
  }

  if (isError || !client) {
    return (
      <AppShell title="Dashboard">
        <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
          <div className="rounded-full bg-destructive/10 p-6">
            <AlertCircle className="size-12 text-destructive" />
          </div>
          <h2 className="text-2xl font-bold">Não foi possível carregar seu painel.</h2>
          <p className="text-muted-foreground max-w-md">
            Ocorreu um erro ao buscar seus dados comerciais. Por favor, tente novamente ou contate o suporte.
          </p>
          <Button variant="outline" onClick={() => refetch()}>
            Tentar novamente
          </Button>
        </div>
      </AppShell>
    );
  }

  const projects = client.projects || [];
  const activeProjeto = projects[0];
  const nextMeeting = meetings[0];
  const unreadMessages = notifications.filter(n => n.category === 'chat' && !n.read_at).length;
  const newDocuments = notifications.filter(n => n.category === 'document' && !n.read_at).length;
  const pendingApprovals = activeProjeto?.status === 'aguardando_cliente' ? 1 : 0;

  // Determinar Ação Necessária
  let actionRequired = null;
  if (activeProjeto?.status === 'aguardando_cliente') {
    actionRequired = {
      title: "Seu projeto está aguardando aprovação.",
      buttonText: "REVISAR PROJETO",
      link: "/cliente/aprovacoes",
      icon: <ShieldCheck className="size-5 text-warning" />
    };
  } else if (unreadMessages > 0) {
    actionRequired = {
      title: "Você tem novas mensagens pendentes.",
      buttonText: "VER MENSAGENS",
      link: "/cliente/mensagens",
      icon: <MessageSquare className="size-5 text-primary" />
    };
  } else if (newDocuments > 0) {
    actionRequired = {
      title: "Existe um novo documento disponível.",
      buttonText: "VER DOCUMENTOS",
      link: "/cliente/documentos",
      icon: <FileText className="size-5 text-blue-500" />
    };
  }

  return (
    <AppShell title="PORTAL DO CLIENTE">
      <DashboardShell>
        <DashboardHeader 
          title={`Olá, ${client.contact_name || "Cliente"}! 👋`}
          description={`Acompanhe o desenvolvimento da ${client.company || "sua empresa"} na ScaleNexus.`}
        />

        {activeProjeto ? (
          <div className="grid gap-4 lg:grid-cols-12">
            {/* CARD PRINCIPAL - PROJETO ATUAL */}
            <Card className="surface card-hover overflow-hidden lg:col-span-8">
              <CardHeader className="flex flex-row items-center justify-between pb-4 border-b border-border/50 px-6 py-4">
                <div className="space-y-1">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-primary">Projeto em Foco</p>
                  <CardTitle className="text-xl font-bold">{activeProjeto.title}</CardTitle>
                </div>
                <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 px-3 py-1 text-[10px] font-bold uppercase tracking-wider">
                  {label(activeProjeto.status)}
                </Badge>
              </CardHeader>
              <CardContent className="pt-6 px-6 pb-6 space-y-8">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-muted/20 border border-border/50">
                    <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mb-1">TIPO DE SOLUÇÃO</p>
                    <p className="text-sm font-semibold">{activeProjeto.site_type || "Desenvolvimento Web"}</p>
                  </div>
                  <div className="p-4 rounded-xl bg-muted/20 border border-border/50">
                    <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mb-1">PRÓXIMA ETAPA</p>
                    <p className="text-sm font-bold text-primary">{getProjectNextStep(activeProjeto.status)}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-end">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Progresso do Desenvolvimento</p>
                    <p className="text-2xl font-black text-primary">{getProjectProgress(activeProjeto.status)}%</p>
                  </div>
                  <div className="h-3 w-full bg-muted/30 rounded-full overflow-hidden border border-border/20">
                    <div 
                      className="h-full bg-primary shadow-glow transition-all duration-1000 ease-out"
                      style={{ width: `${getProjectProgress(activeProjeto.status)}%` }}
                    />
                  </div>
                </div>

                <div className="pt-6 border-t border-border/30">
                  <ProjectProgression steps={[...PROJECT_STATUS].filter(s => s !== 'cancelado')} currentStatus={activeProjeto.status} />
                </div>
              </CardContent>
            </Card>

            {/* LATERAL DIREITA */}
            <div className="space-y-4 lg:col-span-4">
              {/* AÇÃO NECESSÁRIA */}
              <Card className={cn(
                "surface card-hover",
                actionRequired && "border-primary/30"
              )}>
                <CardHeader className="pb-2 px-5 pt-4">
                  <CardTitle className="text-[10px] font-bold uppercase tracking-widest flex items-center gap-2">
                    {actionRequired ? <AlertCircle className="size-3 text-primary animate-pulse" /> : <CheckCircle2 className="size-3 text-success" />}
                    {actionRequired ? "Ação Requerida" : "Status Atualizado"}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 px-5 pb-5">
                  {actionRequired ? (
                    <>
                      <div className="flex items-start gap-3 p-3 rounded-lg bg-card/50 border border-primary/20">
                        <div className="mt-0.5">{actionRequired.icon}</div>
                        <p className="text-xs font-bold leading-tight">{actionRequired.title}</p>
                      </div>
                      <Button asChild className="w-full font-bold uppercase tracking-widest text-[10px] shadow-glow bg-primary hover:bg-primary/90">
                        <Link to={actionRequired.link}>
                          {actionRequired.buttonText}
                          <ArrowRight className="ml-2 size-3" />
                        </Link>
                      </Button>
                    </>
                  ) : (
                    <div className="flex items-center gap-3 py-2">
                      <div className="size-8 rounded-full bg-success/10 flex items-center justify-center text-success">
                        <CheckCircle2 size={16} />
                      </div>
                      <p className="text-xs text-muted-foreground font-medium">Você está em dia com seu projeto.</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* PRÓXIMA REUNIÃO */}
              <Card className="surface card-hover">
                <CardHeader className="pb-3 px-5 pt-4 border-b border-border/50">
                  <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                    <Calendar className="size-3" />
                    Agendas & Reuniões
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-5">
                  {nextMeeting ? (
                    <div className="space-y-4">
                      <div className="flex items-center gap-4">
                        <div className="size-10 rounded-xl bg-primary/10 flex flex-col items-center justify-center text-primary border border-primary/20">
                          <span className="text-sm font-black leading-none">{new Date(nextMeeting.scheduled_at).getDate()}</span>
                          <span className="text-[8px] font-bold uppercase leading-none mt-1">
                            {new Date(nextMeeting.scheduled_at).toLocaleString('pt-BR', { month: 'short' })}
                          </span>
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-sm truncate">{nextMeeting.title}</p>
                          <p className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5 font-medium">
                            <Clock className="size-3" />
                            {new Date(nextMeeting.scheduled_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                      <Button asChild variant="outline" size="sm" className="w-full text-[10px] font-bold uppercase tracking-widest border-primary/30 text-primary hover:bg-primary/5">
                        <Link to="/reuniao/$meetingId" params={{ meetingId: nextMeeting.id }}>
                          Acessar Sala Virtual
                        </Link>
                      </Button>
                    </div>
                  ) : (
                    <div className="py-2 text-center">
                      <p className="text-[10px] text-muted-foreground italic font-medium">Nenhum compromisso agendado</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* ATALHOS RÁPIDOS */}
              <div className="grid grid-cols-2 gap-3">
                <QuickLink to="/cliente/projeto" icon={<Palette className="size-4" />} label="Projeto" />
                <QuickLink to="/cliente/mensagens" icon={<Send className="size-4" />} label="Mensagens" badge={unreadMessages} />
                <QuickLink to="/cliente/documentos" icon={<FileText className="size-4" />} label="Documentos" badge={newDocuments} />
                <QuickLink to="/cliente/pagamentos" icon={<Wallet className="size-4" />} label="Financeiro" />
              </div>
            </div>
          </div>
        ) : (
          <Card className="surface card-hover border-dashed p-12 text-center">
            <Inbox className="mx-auto size-16 text-muted-foreground/20 mb-6" />
            <h3 className="text-xl font-bold mb-2 uppercase tracking-tight">Seu projeto ainda não foi iniciado.</h3>
            <p className="text-muted-foreground max-w-md mx-auto text-sm">
              Nossa equipe está preparando tudo para começar. Você será notificado assim que o primeiro passo for dado.
            </p>
          </Card>
        )}

        {/* RESUMO EM CARDS COMPACTOS */}
        {activeProjeto && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            <StatCard label="PROGRESSO REAL" value={`${getProjectProgress(activeProjeto.status)}%`} icon={Activity} />
            <StatCard 
              label="MENSAGENS" 
              value={unreadMessages > 0 ? `${unreadMessages} novas` : "Em dia"} 
              icon={MessageSquare} 
              status={unreadMessages > 0 ? 'active' : 'idle'}
            />
            <StatCard 
              label="DOCUMENTOS" 
              value={newDocuments > 0 ? `${newDocuments} novo` : "Nenhum"} 
              icon={FileText} 
              status={newDocuments > 0 ? 'active' : 'idle'}
            />
            <StatCard 
              label="APROVAÇÕES" 
              value={pendingApprovals > 0 ? "1 pendente" : "Concluído"} 
              icon={ShieldCheck} 
              status={pendingApprovals > 0 ? 'warning' : 'success'}
            />
          </div>
        )}

        {/* ATIVIDADE RECENTE */}
        <Card className="surface card-hover mt-4 overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between border-b border-border/50 px-6 py-4">
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <Activity className="size-4 text-primary" />
              Linha do Tempo do Projeto
            </CardTitle>
            <Button variant="ghost" size="sm" asChild className="text-[10px] font-bold uppercase tracking-widest text-brand-500 hover:text-brand-600">
              <Link to="/cliente/notificacoes">Ver histórico completo</Link>
            </Button>
          </CardHeader>
          <CardContent className="pt-6 px-6 pb-6">
            <div className="space-y-6 relative before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[1px] before:bg-border/30">
              {recentActivity.length > 0 ? (
                recentActivity.map((activity, idx) => (
                  <div key={idx} className="relative pl-8 group">
                    <div className="absolute left-0 top-1 size-[22px] rounded-full border border-border bg-card flex items-center justify-center z-10 group-hover:border-primary/50 transition-colors shadow-sm">
                      <div className="size-1.5 rounded-full bg-primary" />
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                      <div>
                        <p className="text-sm font-bold">{activity.title}</p>
                        <p className="text-xs text-muted-foreground font-medium">{activity.body}</p>
                      </div>
                      <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60 bg-muted/30 px-2 py-0.5 rounded shrink-0 w-fit">
                        {new Date(activity.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-muted-foreground italic pl-8 font-medium">Nenhuma atividade registrada recentemente.</p>
              )}
            </div>
          </CardContent>
        </Card>
      </DashboardShell>
    </AppShell>
  );
}

function QuickLink({ to, icon, label, badge }: { to: string; icon: any; label: string; badge?: number }) {
  return (
    <Button asChild variant="outline" className="h-20 flex-col gap-2 bg-card/30 hover:bg-primary/5 hover:border-primary/30 transition-all border-border/50 relative shadow-panel group">
      <Link to={to}>
        <div className="size-8 rounded-full bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary/20 transition-colors">
          {icon}
        </div>
        <span className="text-[9px] font-bold uppercase tracking-widest">{label}</span>
        {badge ? (
          <span className="absolute top-2 right-2 size-5 rounded-full bg-primary text-primary-foreground text-[10px] font-black flex items-center justify-center animate-bounce shadow-glow">
            {badge}
          </span>
        ) : null}
      </Link>
    </Button>
  );
}
