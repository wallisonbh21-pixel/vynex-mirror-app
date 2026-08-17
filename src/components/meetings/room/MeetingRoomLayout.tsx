import { useState, useEffect } from 'react';
import { MeetingWithParticipants, MeetingMessage, MeetingNote } from '@/lib/meetings/types';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Usuários, MessageSquare, StickyNote, Info, LogOut, XCircle, Send, CheckCircle2 } from 'lucide-react';
import { useQuery, useMutation, useQueryCliente } from '@tanstack/react-query';
import { meetingQueries } from '@/lib/meetings/queries';
import { meetingMutations } from '@/lib/meetings/mutations';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { sanitizeExternalUrl } from '@/lib/security';

interface MeetingRoomLayoutProps {
  meeting: MeetingWithParticipants & { project?: { title: string }, client?: { name: string } };
  user: { id: string };
  isOrganizer: boolean;
  onLeave: () => void;
  onComplete: () => void;
  isCompleting: boolean;
}

export function MeetingRoomLayout({ 
  meeting, 
  user, 
  isOrganizer, 
  onLeave, 
  onComplete, 
  isCompleting 
}: MeetingRoomLayoutProps) {
  const queryCliente = useQueryCliente();
  const [message, setMessage] = useState('');
  const [note, setNote] = useState('');

  const { data: messages = [] } = useQuery({
    queryKey: ['meeting-messages', meeting.id],
    queryFn: () => meetingQueries.getMessages(meeting.id),
  });

  const { data: notes = [] } = useQuery({
    queryKey: ['meeting-notes', meeting.id],
    queryFn: () => meetingQueries.getNotes(meeting.id),
  });

  // Subscription for new messages and notes
  useEffect(() => {
    const channel = supabase
      .channel(`meeting-data-${meeting.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'meeting_messages', filter: `meeting_id=eq.${meeting.id}` }, () => {
        queryCliente.invalidateQueries({ queryKey: ['meeting-messages', meeting.id] });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'meeting_notes', filter: `meeting_id=eq.${meeting.id}` }, () => {
        queryCliente.invalidateQueries({ queryKey: ['meeting-notes', meeting.id] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [meeting.id, queryCliente]);

  const sendMessageMutation = useMutation({
    mutationFn: (text: string) => meetingMutations.sendMessage({ meeting_id: meeting.id, sender_id: user.id, message: text }),
    onSuccess: () => setMessage(''),
  });

  const saveNoteMutation = useMutation({
    mutationFn: (content: string) => meetingMutations.saveNote({ meeting_id: meeting.id, author_id: user.id, content }),
    onSuccess: () => {
      setNote('');
      toast.success('Nota salva.');
    },
  });

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim()) sendMessageMutation.mutate(message.trim());
  };

  return (
    <div className="flex flex-col h-screen bg-slate-950 text-white overflow-hidden">
      {/* Header */}
      <header className="h-16 border-b border-slate-800 px-6 flex items-center justify-between bg-slate-900/50 backdrop-blur-md z-10">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-blue-500">
            <span className="font-bold text-lg tracking-tight">ScaleNexus <span className="text-white">Meeting</span></span>
          </div>
          <div className="h-4 w-px bg-slate-800 mx-2" />
          <div>
            <h1 className="text-sm font-semibold truncate max-w-[200px] sm:max-w-md">{meeting.title}</h1>
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1 text-[10px] uppercase font-bold text-green-500">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                Em andamento
              </span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          {isOrganizer && (
            <Button 
              variant="destructive" 
              size="sm" 
              className="bg-red-600/10 text-red-500 border-red-500/20 hover:bg-red-600 hover:text-white"
              onClick={onComplete}
              disabled={isCompleting}
            >
              <XCircle className="w-4 h-4 mr-2" />
              Encerrar Reunião
            </Button>
          )}
          <Button variant="outline" size="sm" className="border-slate-700 hover:bg-slate-800" onClick={onLeave}>
            <LogOut className="w-4 h-4 mr-2" />
            Sair
          </Button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex overflow-hidden">
        {/* Media / Video Area (Placeholder) */}
        <div className="flex-1 relative bg-black flex flex-col items-center justify-center p-8">
          <div className="absolute inset-0 bg-gradient-to-b from-slate-900/20 to-black pointer-events-none" />
          <div className="text-center z-10 max-w-lg">
            <div className="w-20 h-20 bg-blue-600/20 rounded-full flex items-center justify-center mx-auto mb-6 border border-blue-500/30">
              <Info className="w-10 h-10 text-blue-500" />
            </div>
            <h2 className="text-2xl font-bold mb-4">Área Principal da Sala</h2>
            <p className="text-slate-400 text-lg leading-relaxed">
              Vídeo e áudio serão disponibilizados nesta sala em uma próxima atualização.
            </p>
            <div className="mt-8 p-4 bg-slate-900/80 rounded-xl border border-slate-800 inline-block">
              <p className="text-sm text-slate-500">ScaleNexus Forge AI pronta para transcrição em breve.</p>
            </div>
          </div>
          
          {/* Active Participants Bar (Small) */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-3 bg-slate-900/80 p-2 rounded-2xl border border-slate-800 backdrop-blur-sm">
            {meeting.participants.map(p => (
              <div key={p.id} className="relative group">
                <Avatar className="w-10 h-10 border-2 border-slate-800 group-hover:border-blue-500 transition-all">
                  <AvatarImage src={p.profiles?.avatar_url || ''} />
                  <AvatarFallback className="bg-slate-800 text-slate-400">
                    {p.profiles?.full_name?.charAt(0) || '?'}
                  </AvatarFallback>
                </Avatar>
                {p.joined_at && !p.left_at && (
                  <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-slate-900 rounded-full" />
                )}
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-slate-800 text-[10px] rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                  {p.profiles?.full_name}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Sidebar Tabs */}
        <aside className="w-full max-w-[400px] border-l border-slate-800 bg-slate-900/30 flex flex-col hidden lg:flex">
          <Tabs defaultValue="participants" className="flex-1 flex flex-col">
            <TabsList className="w-full h-12 bg-slate-900/50 border-b border-slate-800 rounded-none px-2 gap-2">
              <TabsTrigger value="participants" className="flex-1 data-[state=active]:bg-slate-800"><Usuários className="w-4 h-4 mr-2" /> Participantes</TabsTrigger>
              <TabsTrigger value="chat" className="flex-1 data-[state=active]:bg-slate-800"><MessageSquare className="w-4 h-4 mr-2" /> Chat</TabsTrigger>
              <TabsTrigger value="notes" className="flex-1 data-[state=active]:bg-slate-800"><StickyNote className="w-4 h-4 mr-2" /> Notas</TabsTrigger>
              <TabsTrigger value="info" className="flex-1 data-[state=active]:bg-slate-800"><Info className="w-4 h-4 mr-2" /> Info</TabsTrigger>
            </TabsList>

            <TabsContent value="participants" className="flex-1 overflow-hidden m-0">
              <ScrollArea className="h-full">
                <div className="p-6 space-y-6">
                  <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Ativos agora</h3>
                  <div className="space-y-4">
                    {meeting.participants.map(p => (
                      <div key={p.id} className="flex items-center justify-between group">
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarImage src={p.profiles?.avatar_url || ''} />
                            <AvatarFallback>{p.profiles?.full_name?.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-sm font-medium">{p.profiles?.full_name}</p>
                            <p className="text-[10px] text-slate-500 capitalize">{p.participant_type.replace('_', ' ')}</p>
                          </div>
                        </div>
                        <Badge variant="outline" className={p.joined_at && !p.left_at ? "bg-green-500/10 text-green-500 border-green-500/20" : "bg-slate-800 text-slate-500"}>
                          {p.joined_at && !p.left_at ? 'Online' : 'Offline'}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="chat" className="flex-1 flex flex-col overflow-hidden m-0">
              <ScrollArea className="flex-1 p-6">
                <div className="space-y-6">
                  {messages.map((m) => (
                    <div key={m.id} className={`flex flex-col ${m.sender_id === user.id ? 'items-end' : 'items-start'}`}>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-bold text-slate-500">{m.sender?.full_name}</span>
                        <span className="text-[10px] text-slate-600">{format(new Date(m.created_at), 'HH:mm')}</span>
                      </div>
                      <div className={`px-4 py-2 rounded-2xl text-sm max-w-[85%] ${m.sender_id === user.id ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-slate-800 text-slate-200 rounded-tl-none'}`}>
                        {m.message.split(/\s+/).some(word => word.startsWith('http')) ? (
                           m.message.split(/\s+/).map((word, i) => {
                             if (word.startsWith('http') || word.startsWith('www.')) {
                               const sanitized = sanitizeExternalUrl(word);
                               return sanitized ? <a key={i} href={sanitized} target="_blank" rel="noopener noreferrer" className="underline hover:opacity-80 break-all">{word} </a> : word + ' ';
                             }
                             return word + ' ';
                           })
                        ) : m.message}
                      </div>
                    </div>
                  ))}
                  {messages.length === 0 && (
                    <div className="text-center py-10">
                      <MessageSquare className="w-8 h-8 text-slate-800 mx-auto mb-2" />
                      <p className="text-slate-600 text-sm italic">Nenhuma mensagem ainda.</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
              <form onSubmit={handleSendMessage} className="p-4 border-t border-slate-800 bg-slate-900/50">
                <div className="flex gap-2">
                  <Input 
                    placeholder="Digite uma mensagem..." 
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="bg-slate-800 border-slate-700 focus:ring-blue-500"
                  />
                  <Button type="submit" size="icon" className="bg-blue-600 hover:bg-blue-700" disabled={sendMessageMutation.isPending}>
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </form>
            </TabsContent>

            <TabsContent value="notes" className="flex-1 flex flex-col overflow-hidden m-0">
              <ScrollArea className="flex-1 p-6">
                <div className="space-y-6">
                  {notes.map((n) => (
                    <div key={n.id} className="p-4 bg-slate-800/50 rounded-xl border border-slate-700">
                      <p className="text-sm text-slate-300 whitespace-pre-wrap">{n.content}</p>
                      <div className="mt-2 pt-2 border-t border-slate-700 flex justify-between items-center">
                        <span className="text-[10px] text-slate-500">{format(new Date(n.created_at), "dd/MM 'às' HH:mm")}</span>
                        {n.is_public && <Badge variant="outline" className="text-[9px] bg-blue-500/10 text-blue-500 border-blue-500/20">Compartilhada</Badge>}
                      </div>
                    </div>
                  ))}
                  {notes.length === 0 && (
                    <div className="text-center py-10">
                      <StickyNote className="w-8 h-8 text-slate-800 mx-auto mb-2" />
                      <p className="text-slate-600 text-sm italic">Nenhuma nota registrada.</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
              <div className="p-4 border-t border-slate-800 bg-slate-900/50 space-y-3">
                <Textarea 
                  placeholder="Registre uma nota da reunião..." 
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="bg-slate-800 border-slate-700 min-h-[100px] resize-none"
                />
                <Button className="w-full bg-slate-700 hover:bg-slate-600 text-white text-xs" onClick={() => saveNoteMutation.mutate(note)} disabled={!note.trim() || saveNoteMutation.isPending}>
                  Salvar Nota Pessoal
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="info" className="flex-1 overflow-hidden m-0">
              <ScrollArea className="h-full">
                <div className="p-6 space-y-6">
                  <div>
                    <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-4">Detalhes do Projeto</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between py-2 border-b border-slate-800">
                        <span className="text-xs text-slate-500">Projeto</span>
                        <span className="text-xs font-medium">{meeting.project?.title || 'Não vinculado'}</span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-slate-800">
                        <span className="text-xs text-slate-500">Clientee</span>
                        <span className="text-xs font-medium">{meeting.client?.name || 'Não vinculado'}</span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-slate-800">
                        <span className="text-xs text-slate-500">Tipo</span>
                        <span className="text-xs font-medium capitalize">{meeting.meeting_type.toLowerCase()}</span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-slate-800">
                        <span className="text-xs text-slate-500">Data</span>
                        <span className="text-xs font-medium">{format(new Date(meeting.scheduled_at), 'dd/MM/yyyy')}</span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-slate-800">
                        <span className="text-xs text-slate-500">Duração</span>
                        <span className="text-xs font-medium">{meeting.duration_minutes} minutos</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-4 bg-blue-500/5 rounded-xl border border-blue-500/10">
                    <p className="text-xs text-blue-500 leading-relaxed italic">
                      "Reunião de alinhamento estratégico para garantir a melhor entrega do seu projeto ScaleNexus."
                    </p>
                  </div>
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </aside>
      </main>

      {/* Mobile Footer Menu (Placeholder for tabs) */}
      <footer className="lg:hidden h-14 border-t border-slate-800 bg-slate-900 flex items-center justify-around px-2">
        <Button variant="ghost" size="icon" className="text-slate-400"><Usuários className="w-5 h-5" /></Button>
        <Button variant="ghost" size="icon" className="text-slate-400"><MessageSquare className="w-5 h-5" /></Button>
        <Button variant="ghost" size="icon" className="text-slate-400"><StickyNote className="w-5 h-5" /></Button>
        <Button variant="ghost" size="icon" className="text-slate-400"><Info className="w-5 h-5" /></Button>
      </footer>
    </div>
  );
}
