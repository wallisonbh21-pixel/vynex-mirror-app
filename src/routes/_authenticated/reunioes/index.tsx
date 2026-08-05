import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { meetingQueries } from "@/lib/meetings/queries";
import { meetingMutations } from "@/lib/meetings/mutations";
import { MeetingCard } from "@/components/meetings/MeetingCard";
import { Button } from "@/components/ui/button";
import { 
  Plus, 
  Calendar as CalendarIcon, 
  LayoutGrid, 
  List, 
  History,
  Video,
  Clock,
  Filter
} from "lucide-react";
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { MeetingWithParticipants } from "@/lib/meetings/types";

export const Route = createFileRoute("/_authenticated/reunioes/")({
  component: MeetingsPage,
});

function MeetingsPage() {
  const queryClient = useQueryClient();
  const [view, setView] = useState<"grid" | "list">("grid");
  
  const { data: meetings, isLoading } = useQuery({
    queryKey: ["meetings"],
    queryFn: () => meetingQueries.list(),
  });

  const cancelMutation = useMutation({
    mutationFn: (id: string) => meetingMutations.cancel(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["meetings"] });
      toast.success("Reunião cancelada com sucesso");
    },
    onError: () => toast.error("Erro ao cancelar reunião"),
  });

  const upcomingMeetings = meetings?.filter(m => m.status === 'SCHEDULED' || m.status === 'LIVE') || [];
  const pastMeetings = meetings?.filter(m => m.status === 'COMPLETED' || m.status === 'CANCELLED' || m.status === 'NO_SHOW') || [];

  return (
    <AppShell 
      title="Central de Reuniões" 
      description="Gerencie suas reuniões, apresentações e alinhamentos estratégicos."
      actions={
        <Button className="font-bold shadow-glow">
          <Plus className="mr-2 size-4" /> Nova Reunião
        </Button>
      }
    >
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <Tabs defaultValue="upcoming" className="w-full sm:w-auto">
            <TabsList className="grid w-full grid-cols-2 sm:w-[300px]">
              <TabsTrigger value="upcoming" className="gap-2">
                <Clock className="size-4" /> Próximas
              </TabsTrigger>
              <TabsTrigger value="past" className="gap-2">
                <History className="size-4" /> Histórico
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              className="gap-2"
              onClick={() => setView(view === 'grid' ? 'list' : 'grid')}
            >
              {view === 'grid' ? <List className="size-4" /> : <LayoutGrid className="size-4" />}
              <span className="hidden sm:inline">{view === 'grid' ? 'Lista' : 'Grade'}</span>
            </Button>
            <Button variant="outline" size="sm" className="gap-2">
              <Filter className="size-4" />
              <span className="hidden sm:inline">Filtrar</span>
            </Button>
          </div>
        </div>

        <Tabs defaultValue="upcoming" className="mt-0">
          <TabsContent value="upcoming" className="mt-0 border-none p-0">
            {isLoading ? (
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-64 animate-pulse rounded-2xl bg-muted/50" />
                ))}
              </div>
            ) : upcomingMeetings.length > 0 ? (
              <div className={cn(
                "grid gap-6",
                view === 'grid' ? "grid-cols-1 md:grid-cols-2 xl:grid-cols-3" : "grid-cols-1"
              )}>
                {upcomingMeetings.map(meeting => (
                  <MeetingCard 
                    key={meeting.id} 
                    meeting={meeting}
                    onJoin={(m) => window.location.href = `/reuniao/${m.id}`}
                    onCancel={(id) => cancelMutation.mutate(id)}
                  />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-muted p-12 text-center">
                <div className="mb-4 flex size-16 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <CalendarIcon className="size-8" />
                </div>
                <h3 className="text-xl font-bold">Nenhuma reunião agendada</h3>
                <p className="mt-2 max-w-sm text-muted-foreground">
                  Você não possui reuniões para os próximos dias. Que tal agendar uma nova reunião com seu cliente ou equipe?
                </p>
                <Button className="mt-6 font-bold shadow-glow">
                  Agendar minha primeira reunião
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="past" className="mt-0 border-none p-0">
             <div className={cn(
                "grid gap-6",
                view === 'grid' ? "grid-cols-1 md:grid-cols-2 xl:grid-cols-3" : "grid-cols-1"
              )}>
                {pastMeetings.map(meeting => (
                  <MeetingCard 
                    key={meeting.id} 
                    meeting={meeting}
                    onJoin={(m) => window.location.href = `/reuniao/${m.id}`}
                  />
                ))}
              </div>
              {pastMeetings.length === 0 && !isLoading && (
                <div className="py-12 text-center text-muted-foreground">
                  Nenhuma reunião encontrada no histórico.
                </div>
              )}
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  );
}

// Helper needed for the grid conditional
function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(" ");
}
