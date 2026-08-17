import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { meetingQueries } from '@/lib/meetings/queries';
import { meetingMutations } from '@/lib/meetings/mutations';
import { useSession, useRoles } from '@/lib/auth';
import { useEffect, useState, useMemo } from 'react';
import { MeetingRoomLayout } from '@/components/meetings/room/MeetingRoomLayout';
import { MeetingWaitingRoom } from '@/components/meetings/room/MeetingWaitingRoom';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

export const Route = createFileRoute('/_authenticated/reuniao/$meetingId')({
  component: MeetingRoomPage,
});

function MeetingRoomPage() {
  const { meetingId } = Route.useParams();
  const { user } = useSession();
  const { isAdmin } = useRoles();
  const navigate = useNavigate();
  const queryCliente = useQueryClient();
  const [hasJoined, setHasJoined] = useState(false);

  const { data: meeting, isLoading, error } = useQuery({
    queryKey: ['meeting', meetingId],
    queryFn: () => meetingQueries.getById(meetingId),
  });

  const participant = useMemo(() => 
    meeting?.participants.find(p => p.user_id === user?.id), 
    [meeting, user]
  );

  const canAccess = isAdmin || !!participant;

  useEffect(() => {
    if (error) {
      toast.error('Erro ao carregar reunião ou acesso negado.');
      navigate({ to: '/reunioes' });
    }
  }, [error, navigate]);

  // Real-time subscription for meeting status and participants
  useEffect(() => {
    const channel = supabase
      .channel(`meeting-${meetingId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'meetings',
          filter: `id=eq.${meetingId}`,
        },
        () => {
          queryCliente.invalidateQueries({ queryKey: ['meeting', meetingId] });
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'meeting_participants',
          filter: `meeting_id=eq.${meetingId}`,
        },
        () => {
          queryCliente.invalidateQueries({ queryKey: ['meeting', meetingId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [meetingId, queryCliente]);

  const joinMutation = useMutation({
    mutationFn: () => meetingMutations.updateParticipantPresence(meetingId, user!.id, 'join'),
    onSuccess: () => {
      setHasJoined(true);
      toast.success('Você entrou na sala.');
    }
  });

  const leaveMutation = useMutation({
    mutationFn: () => meetingMutations.updateParticipantPresence(meetingId, user!.id, 'leave'),
    onSuccess: () => {
      setHasJoined(false);
      navigate({ to: '/reunioes' });
      toast.info('Você saiu da reunião.');
    }
  });

  const startMeetingMutation = useMutation({
    mutationFn: () => meetingMutations.startMeeting(meetingId),
    onSuccess: () => toast.success('Reunião iniciada!'),
  });

  const completeMeetingMutation = useMutation({
    mutationFn: () => meetingMutations.completeMeeting(meetingId),
    onSuccess: () => {
      toast.info('Reunião encerrada.');
      navigate({ to: '/reunioes' });
    }
  });

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-950 p-8">
        <Skeleton className="w-64 h-8 mb-4" />
        <Skeleton className="w-full max-w-2xl h-96" />
      </div>
    );
  }

  if (!meeting || !canAccess) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-950 text-white p-8">
        <h1 className="text-2xl font-bold mb-4">Acesso Negado</h1>
        <p className="text-slate-400 mb-8">Você não tem permissão para acessar esta reunião.</p>
        <button 
          onClick={() => navigate({ to: '/reunioes' })}
          className="px-6 py-2 bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Voltar para Reuniões
        </button>
      </div>
    );
  }

  const isOrganizer = isAdmin || meeting.created_by === user?.id;

  if (!hasJoined) {
    return (
      <MeetingWaitingRoom 
        meeting={meeting} 
        onJoin={() => joinMutation.mutate()} 
        isJoining={joinMutation.isPending}
        isOrganizer={isOrganizer}
        onStart={() => startMeetingMutation.mutate()}
        isStarting={startMeetingMutation.isPending}
      />
    );
  }

  return (
    <MeetingRoomLayout 
      meeting={meeting}
      user={user!}
      isOrganizer={isOrganizer}
      onLeave={() => leaveMutation.mutate()}
      onComplete={() => completeMeetingMutation.mutate()}
      isCompleting={completeMeetingMutation.isPending}
    />
  );
}
