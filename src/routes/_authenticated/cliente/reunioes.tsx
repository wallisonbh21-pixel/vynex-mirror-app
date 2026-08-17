import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar, Clock, Video, Users, ChevronRight } from "lucide-react";

export const Route = createFileRoute("/_authenticated/cliente/reunioes")({
  component: MyMeetings,
});

function MyMeetings() {
  const { data: meetings, isLoading } = useQuery({
    queryKey: ["client-meetings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("meetings")
        .select("*")
        .order("scheduled_at", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  if (isLoading) {
    return (
      <AppShell title="Reuniões">
        <Skeleton className="h-96 w-full" />
      </AppShell>
    );
  }

  const upcoming = meetings?.filter(m => m.status === "SCHEDULED" || m.status === "LIVE") || [];
  const past = meetings?.filter(m => m.status === "COMPLETED" || m.status === "CANCELLED" || m.status === "NO_SHOW") || [];

  return (
    <AppShell title="Reuniões">
      <div className="space-y-8">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Video className="size-5 text-primary" />
              Próximas Reuniões
            </h2>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {upcoming.length > 0 ? (
              upcoming.map((meeting) => (
                <Card key={meeting.id} className="border-sidebar-border/50 bg-sidebar/30 backdrop-blur-sm group hover:border-primary/30 transition-all shadow-glow-hover">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start mb-2">
                      <Badge variant={meeting.status === "LIVE" ? "destructive" : "outline"} className={meeting.status === "LIVE" ? "animate-pulse" : "border-primary/20 text-primary"}>
                        {meeting.status === "LIVE" ? "AO VIVO" : "AGENDADA"}
                      </Badge>
                      <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{meeting.meeting_type}</span>
                    </div>
                    <CardTitle className="text-lg line-clamp-1">{meeting.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="size-4" />
                        {new Date(meeting.scheduled_at).toLocaleDateString("pt-BR")}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="size-4" />
                        {new Date(meeting.scheduled_at).toLocaleTimeString("pt-BR", { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                    
                    <Button asChild className="w-full shadow-glow" variant={meeting.status === "LIVE" ? "default" : "secondary"}>
                      <Link to="/reuniao/$meetingId" params={{ meetingId: meeting.id }}>
                        Entrar na Reunião
                        <ChevronRight className="ml-2 size-4" />
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card className="col-span-full p-8 text-center border-dashed">
                <p className="text-muted-foreground">Você não tem reuniões agendadas no momento.</p>
              </Card>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-bold flex items-center gap-2 opacity-70">
            <Users className="size-5" />
            Reuniões Anteriores
          </h2>
          <Card className="border-sidebar-border/50 bg-sidebar/30 backdrop-blur-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-sidebar-border/50 bg-sidebar/50">
                    <th className="px-4 py-3 font-medium">Reunião</th>
                    <th className="px-4 py-3 font-medium">Data</th>
                    <th className="px-4 py-3 font-medium">Tipo</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-sidebar-border/30">
                  {past.map((meeting) => (
                    <tr key={meeting.id} className="hover:bg-sidebar/50 transition-colors">
                      <td className="px-4 py-3 font-medium">{meeting.title}</td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {new Date(meeting.scheduled_at).toLocaleDateString("pt-BR")}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="outline" className="text-[10px]">{meeting.meeting_type}</Badge>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="secondary" className="text-[10px]">{meeting.status}</Badge>
                      </td>
                    </tr>
                  ))}
                  {past.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground italic">
                        Histórico vazio.
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
