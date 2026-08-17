
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
  Activity
} from "lucide-react";
import { ProjectProgression } from "@/components/ProjectProgression";
import { PROJECT_STATUS, getProjetoProgress, getProjetoNextStep, label } from "@/lib/format";
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
      // Unificando notificações como atividades recentes
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
      icon: <ShieldCheck className="size-5 text-yellow-500" />
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
    <AppShell title="Portal do Clientee">
      <div className="space-y-8 pb-10">
        {/* TOPO */}
        <div className="flex flex-col gap-2">
          <h2 className="text-3xl font-bold tracking-tight">
            Olá, {client.contact_name || "Clientee"}! 👋
          </h2>
          <p className="text-muted-foreground">
            Acompanhe tudo que a ScaleNexus está desenvolvendo para <span className="font-semibold text-foreground">{client.company || "sua empresa"}</span>.
          </p>
        </div>

        {activeProjeto ? (
          <div className="grid gap-6 lg:grid-cols-12">
            {/* CARD PRINCIPAL - PROJETO ATUAL */}
            <Card className="lg:col-span-8 border-sidebar-border/50 bg-sidebar/30 backdrop-blur-sm shadow-xl">
              <CardHeader className="flex flex-row items-center justify-between pb-2 border-b border-border/10">
                <div className="space-y-1">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-primary">PROJETO ATUAL</p>
                  <CardTitle className="text-2xl font-bold">{activeProjeto.title}</CardTitle>
                </div>
                <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 px-3 py-1 text-xs font-semibold uppercase tracking-wider">
                  {label(activeProjeto.status)}
                </Badge>
              </CardHeader>
              <CardContent className="pt-6 space-y-8">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-background/40 border border-border/50">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase mb-1">TIPO</p>
                    <p className="font-medium">{activeProjeto.site_type || "Desenvolvimento Web"}</p>
                  </div>
                  <div className="p-4 rounded-xl bg-background/40 border border-border/50">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase mb-1">PRÓXIMA ETAPA</p>
                    <p className="font-medium text-primary">{getProjetoNextStep(activeProjeto.status)}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-end">
                    <p className="text-sm font-bold uppercase tracking-widest text-muted-foreground">PROGRESSO</p>
                    <p className="text-2xl font-black text-primary">{getProjetoProgress(activeProjeto.status)}%</p>
                  </div>
                  <div className="h-4 w-full bg-secondary/50 rounded-full overflow-hidden border border-border/20">
                    <div 
                      className="h-full bg-gradient-to-r from-primary/80 to-primary shadow-[0_0_20px_rgba(59,130,246,0.5)] transition-all duration-1000 ease-out"
                      style={{ width: `${getProjetoProgress(activeProjeto.status)}%` }}
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-border/10">
                  <ProjectProgression steps={[...PROJECT_STATUS].filter(s => s !== 'cancelado')} currentStatus={activeProjeto.status} />
                </div>
              </CardContent>
            </Card>

            {/* LATERAL DIREITA */}
            <div className="lg:col-span-4 space-y-6">
              {/* AÇÃO NECESSÁRIA */}
              <Card className={cn(
                "border-2 transition-all duration-300",
                actionRequired ? "border-primary/30 bg-primary/5 shadow-glow" : "border-border/50 bg-background/40"
              )}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-bold uppercase tracking-widest flex items-center gap-2">
                    {actionRequired ? <AlertCircle className="size-4 text-primary animate-pulse" /> : <CheckCircle2 className="size-4 text-green-500" />}
                    {actionRequired ? "Ação Necessária" : "Tudo em ordem"}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {actionRequired ? (
                    <>
                      <div className="flex items-start gap-3 p-3 rounded-lg bg-background/60 border border-primary/20">
                        <div className="mt-0.5">{actionRequired.icon}</div>
                        <p className="text-sm font-medium leading-tight">{actionRequired.title}</p>
                      </div>
                      <Button asChild className="w-full font-bold tracking-wide shadow-glow">
                        <Link to={actionRequired.link}>
                          {actionRequired.buttonText}
                          <ArrowRight className="ml-2 size-4" />
                        </Link>
                      </Button>
                    </>
                  ) : (
                    <div className="flex items-center gap-3 py-2">
                      <div className="size-8 rounded-full bg-green-500/10 flex items-center justify-center text-green-500">
                        <CheckCircle2 size={18} />
                      </div>
                      <p className="text-sm text-muted-foreground">Nenhuma ação necessária no momento.</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* PRÓXIMA REUNIÃO */}
              <Card className="border-sidebar-border/50 bg-sidebar/30">
                <CardHeader className="pb-2 border-b border-border/10">
                  <CardTitle className="text-sm font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                    <Calendar className="size-4" />
                    Próxima Reunião
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                  {nextMeeting ? (
                    <div className="space-y-4">
                      <div className="flex items-start gap-3">
                        <div className="size-10 rounded-xl bg-primary/10 flex flex-col items-center justify-center text-primary border border-primary/20">
                          <span className="text-xs font-bold leading-none">{new Date(nextMeeting.scheduled_at).getDate()}</span>
                          <span className="text-[10px] font-medium uppercase leading-none mt-1">
                            {new Date(nextMeeting.scheduled_at).toLocaleString('pt-BR', { month: 'short' })}
                          </span>
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-sm truncate">{nextMeeting.title}</p>
                          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                            <Clock className="size-3" />
                            {new Date(nextMeeting.scheduled_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                      <Button asChild variant="outline" size="sm" className="w-full text-xs font-bold uppercase tracking-wider">
                        <Link to="/reuniao/$meetingId" params={{ meetingId: nextMeeting.id }}>
                          Entrar na Reunião
                        </Link>
                      </Button>
                    </div>
                  ) : (
                    <div className="py-4 text-center">
                      <p className="text-xs text-muted-foreground italic">Nenhuma reunião agendada</p>
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
          <Card className="p-20 text-center border-dashed border-2 bg-sidebar/10">
            <Inbox className="mx-auto size-16 text-muted-foreground/20 mb-6" />
            <h3 className="text-xl font-bold mb-2">Seu projeto ainda não foi iniciado.</h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              Nossa equipe está preparando tudo para começar. Você será notificado assim que o primeiro passo for dado.
            </p>
          </Card>
        )}

        {/* RESUMO EM CARDS COMPACTOS */}
        {activeProjeto && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard label="PROGRESSO" value={`${getProjetoProgress(activeProjeto.status)}%`} icon={<Activity size={14} />} />
            <StatCard 
              label="MENSAGENS" 
              value={unreadMessages > 0 ? `${unreadMessages} novas` : "Nenhuma nova"} 
              icon={<MessageSquare size={14} />} 
              status={unreadMessages > 0 ? 'active' : 'idle'}
            />
            <StatCard 
              label="DOCUMENTOS" 
              value={newDocuments > 0 ? `${newDocuments} novo` : "Nenhum novo"} 
              icon={<FileText size={14} />} 
              status={newDocuments > 0 ? 'active' : 'idle'}
            />
            <StatCard 
              label="APROVAÇÕES" 
              value={pendingApprovals > 0 ? "1 pendente" : "Em dia"} 
              icon={<ShieldCheck size={14} />} 
              status={pendingApprovals > 0 ? 'warning' : 'success'}
            />
          </div>
        )}

        {/* ATIVIDADE RECENTE */}
        <Card className="border-sidebar-border/50 bg-sidebar/30">
          <CardHeader className="pb-2 flex flex-row items-center justify-between border-b border-border/10">
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <Activity className="size-5 text-primary" />
              Atividade Recente
            </CardTitle>
            <Button variant="ghost" size="sm" asChild className="text-xs text-muted-foreground">
              <Link to="/cliente/notificacoes">Ver tudo</Link>
            </Button>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-6 relative before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[2px] before:bg-border/30">
              {recentActivity.length > 0 ? (
                recentActivity.map((activity, idx) => (
                  <div key={idx} className="relative pl-8 group">
                    <div className="absolute left-0 top-1 size-[24px] rounded-full border-2 border-background bg-sidebar flex items-center justify-center z-10 group-hover:border-primary/50 transition-colors">
                      <div className="size-2 rounded-full bg-primary" />
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                      <div>
                        <p className="text-sm font-semibold">{activity.title}</p>
                        <p className="text-xs text-muted-foreground">{activity.body}</p>
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60 bg-muted/30 px-2 py-0.5 rounded shrink-0">
                        {new Date(activity.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground italic pl-8">Nenhuma atividade registrada recentemente.</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}

function QuickLink({ to, icon, label, badge }: { to: string; icon: any; label: string; badge?: number }) {
  return (
    <Button asChild variant="outline" className="h-20 flex-col gap-2 bg-background/40 hover:bg-primary/5 hover:border-primary/30 transition-all border-border/50 relative">
      <Link to={to}>
        <div className="size-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
          {icon}
        </div>
        <span className="text-[10px] font-bold uppercase tracking-wider">{label}</span>
        {badge ? (
          <span className="absolute top-2 right-2 size-5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center animate-bounce">
            {badge}
          </span>
        ) : null}
      </Link>
    </Button>
  );
}

function StatCard({ label, value, icon, status = 'idle' }: { label: string; value: string; icon: any; status?: 'idle' | 'active' | 'warning' | 'success' }) {
  return (
    <Card className="border-sidebar-border/50 bg-sidebar/30 p-4">
      <div className="flex items-center gap-2 mb-2">
        <div className={cn(
          "size-6 rounded flex items-center justify-center",
          status === 'active' && "bg-primary/10 text-primary",
          status === 'warning' && "bg-yellow-500/10 text-yellow-500",
          status === 'success' && "bg-green-500/10 text-green-500",
          status === 'idle' && "bg-muted text-muted-foreground"
        )}>
          {icon}
        </div>
        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{label}</span>
      </div>
      <p className={cn(
        "text-lg font-black tracking-tight",
        status === 'active' && "text-primary",
        status === 'warning' && "text-yellow-500",
        status === 'success' && "text-green-500"
      )}>{value}</p>
    </Card>
  );
}
