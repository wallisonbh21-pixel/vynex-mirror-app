import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { 
  Calendar, 
  Clock, 
  Video, 
  Usuários as UsuáriosIcon, 
  CheckCircle2, 
  XCircle, 
  Clock3,
  ExternalLink,
  MoreVertical
} from "lucide-react";
import { MeetingWithParticipants } from "@/lib/meetings/types";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";

interface MeetingCardProps {
  meeting: MeetingWithParticipants;
  onJoin?: (meeting: MeetingWithParticipants) => void;
  onCancel?: (id: string) => void;
  onStatusChange?: (id: string, status: any) => void;
}

const STATUS_CONFIG = {
  SCHEDULED: { label: "Agendada", color: "bg-blue-500/10 text-blue-500 border-blue-500/20", icon: Calendar },
  LIVE: { label: "Em andamento", color: "bg-green-500/10 text-green-500 border-green-500/20 shadow-[0_0_15px_rgba(34,197,94,0.3)] animate-pulse", icon: Video },
  COMPLETED: { label: "Concluída", color: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20", icon: CheckCircle2 },
  CANCELLED: { label: "Cancelada", color: "bg-red-500/10 text-red-500 border-red-500/20", icon: XCircle },
  NO_SHOW: { label: "Não compareceu", color: "bg-orange-500/10 text-orange-500 border-orange-500/20", icon: Clock3 },
};

export function MeetingCard({ meeting, onJoin, onCancel, onStatusChange }: MeetingCardProps) {
  const status = STATUS_CONFIG[meeting.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.SCHEDULED;
  const scheduledDate = new Date(meeting.scheduled_at);
  const isLive = meeting.status === 'LIVE';

  return (
    <Card className={cn(
      "overflow-hidden transition-all duration-300 hover:border-primary/50 group",
      isLive && "ring-2 ring-green-500/50 border-green-500/50"
    )}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className={cn("font-semibold uppercase tracking-wider text-[10px]", status.color)}>
                <status.icon className="mr-1 size-3" />
                {status.label}
              </Badge>
              <Badge variant="secondary" className="text-[10px] uppercase tracking-wider">
                {meeting.meeting_type}
              </Badge>
            </div>
            <CardTitle className="text-lg leading-tight group-hover:text-primary transition-colors">
              {meeting.title}
            </CardTitle>
            {meeting.description && (
              <CardDescription className="line-clamp-2">
                {meeting.description}
              </CardDescription>
            )}
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="size-8">
                <MoreVertical className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => onJoin?.(meeting)}>
                Ver detalhes
              </DropdownMenuItem>
              {meeting.status === 'SCHEDULED' && onCancel && (
                <DropdownMenuItem onClick={() => onCancel(meeting.id)} className="text-destructive">
                  Cancelar reunião
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="size-4 text-primary" />
            <span>{format(scheduledDate, "dd 'de' MMMM", { locale: ptBR })}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="size-4 text-primary" />
            <span>{format(scheduledDate, "HH:mm", { locale: ptBR })} ({meeting.duration_minutes} min)</span>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="flex -space-x-2">
            {meeting.participants?.slice(0, 3).map((p, i) => (
              <div 
                key={p.id} 
                className="size-7 rounded-full bg-sidebar-accent border-2 border-background flex items-center justify-center text-[10px] font-bold"
                title={p.participant_type}
              >
                {p.participant_type[0]}
              </div>
            ))}
            {(meeting.participants?.length || 0) > 3 && (
              <div className="size-7 rounded-full bg-muted border-2 border-background flex items-center justify-center text-[10px] font-bold">
                +{(meeting.participants?.length || 0) - 3}
              </div>
            )}
          </div>
          <span className="text-xs text-muted-foreground">
            {meeting.participants?.length || 0} participantes
          </span>
        </div>
      </CardContent>
      <CardFooter className="bg-muted/30 pt-4">
        <Button 
          className={cn(
            "w-full font-bold transition-all duration-300",
            isLive ? "bg-green-600 hover:bg-green-700 text-white" : "bg-primary hover:bg-primary/90"
          )}
          onClick={() => onJoin?.(meeting)}
        >
          {isLive ? <Video className="mr-2 size-4" /> : <ExternalLink className="mr-2 size-4" />}
          {isLive ? "Entrar Agora" : "Acessar Sala"}
        </Button>
      </CardFooter>
    </Card>
  );
}
