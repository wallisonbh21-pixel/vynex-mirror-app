import { useState, useEffect } from 'react';
import { MeetingWithParticipants } from '@/lib/meetings/types';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Calendar, Usuários, Clock, PlayCircle, ArrowLeft } from 'lucide-react';
import { format, isBefore, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useNavigate } from '@tanstack/react-router';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

interface MeetingWaitingRoomProps {
  meeting: MeetingWithParticipants;
  onJoin: () => void;
  isJoining: boolean;
  isOrganizer: boolean;
  onStart: () => void;
  isStarting: boolean;
}

export function MeetingWaitingRoom({ 
  meeting, 
  onJoin, 
  isJoining, 
  isOrganizer, 
  onStart, 
  isStarting 
}: MeetingWaitingRoomProps) {
  const navigate = useNavigate();
  const [timeLeft, setTimeLeft] = useState<string>('');
  const scheduledTime = parseISO(meeting.scheduled_at);
  const isAvailable = isBefore(scheduledTime, new Date()) || meeting.status === 'LIVE';

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      if (isBefore(now, scheduledTime)) {
        const diff = scheduledTime.getTime() - now.getTime();
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        setTimeLeft(
          `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
        );
      } else {
        setTimeLeft('00:00:00');
        clearInterval(timer);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [scheduledTime]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-950 p-4">
      <Card className="w-full max-w-2xl bg-slate-900 border-slate-800 p-8 shadow-2xl">
        <div className="flex justify-between items-start mb-8">
          <div className="flex items-center gap-2 text-blue-500">
            <PlayCircle className="w-8 h-8" />
            <span className="font-bold text-xl tracking-tight">ScaleNexus <span className="text-white">Meeting</span></span>
          </div>
          <Badge variant={meeting.status === 'LIVE' ? "default" : "outline"} className={meeting.status === 'LIVE' ? "bg-green-500/10 text-green-500 border-green-500/20" : "text-slate-400 border-slate-700"}>
            {meeting.status === 'LIVE' ? '🟢 AO VIVO' : '🕐 AGUARDANDO'}
          </Badge>
        </div>

        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-white mb-2">{meeting.title}</h1>
          <p className="text-slate-400">{meeting.description || 'Sem descrição.'}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
          <div className="space-y-4">
            <div className="flex items-center gap-3 text-slate-300">
              <Calendar className="w-5 h-5 text-blue-500" />
              <span>{format(scheduledTime, "dd 'de' MMMM", { locale: ptBR })}</span>
            </div>
            <div className="flex items-center gap-3 text-slate-300">
              <Clock className="w-5 h-5 text-blue-500" />
              <span>{format(scheduledTime, "HH:mm")} ({meeting.duration_minutes} min)</span>
            </div>
            <div className="flex items-center gap-3 text-slate-300">
              <Usuários className="w-5 h-5 text-blue-500" />
              <span>{meeting.participants.length} Participantes</span>
            </div>
          </div>

          <div className="bg-slate-950/50 rounded-xl p-6 border border-slate-800 flex flex-col items-center justify-center">
            {isAvailable ? (
              <div className="text-center">
                <p className="text-green-500 font-bold mb-2">🟢 REUNIÃO DISPONÍVEL</p>
                <p className="text-slate-400 text-sm">Você já pode entrar na sala.</p>
              </div>
            ) : (
              <div className="text-center">
                <p className="text-slate-400 text-sm mb-2">Começa em</p>
                <p className="text-4xl font-mono font-bold text-white">{timeLeft}</p>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Participantes</h3>
          <div className="flex flex-wrap gap-3">
            {meeting.participants.map((p) => (
              <div key={p.id} className="flex items-center gap-2 bg-slate-800/50 px-3 py-1.5 rounded-full border border-slate-700">
                <Avatar className="w-6 h-6">
                  <AvatarImage src={p.profiles?.avatar_url || ''} />
                  <AvatarFallback>{p.profiles?.full_name?.charAt(0) || '?'}</AvatarFallback>
                </Avatar>
                <span className="text-sm text-slate-300">{p.profiles?.full_name || 'Usuário'}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-10 flex flex-col sm:flex-row gap-4">
          <Button 
            variant="outline" 
            className="flex-1 border-slate-700 text-slate-300 hover:bg-slate-800"
            onClick={() => navigate({ to: '/reunioes' })}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
          
          {isOrganizer && meeting.status === 'SCHEDULED' && !isAvailable && (
            <Button 
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
              onClick={onStart}
              disabled={isStarting}
            >
              Iniciar Agora
            </Button>
          )}

          <Button 
            className="flex-1 bg-green-600 hover:bg-green-700 text-white"
            onClick={onJoin}
            disabled={!isAvailable && meeting.status !== 'LIVE' || isJoining}
          >
            {isJoining ? 'Entrando...' : 'ENTRAR NA SALA'}
          </Button>
        </div>

        {!isAvailable && meeting.status !== 'LIVE' && (
          <p className="text-center text-slate-500 text-xs mt-6 italic">
            "Você poderá entrar quando a reunião estiver disponível."
          </p>
        )}
      </Card>
    </div>
  );
}
