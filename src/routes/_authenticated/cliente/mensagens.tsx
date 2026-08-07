import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Send, MessageSquare, Plus, Loader2 } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/lib/auth";
import { useClientPortalData } from "@/lib/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/cliente/mensagens")({
  component: MyMessages,
});

function MyMessages() {
  const { user } = useSession();
  const { data: clientData, isLoading: loadingClient } = useClientPortalData();
  const [messageText, setMessageText] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  const activeProject = clientData?.projects?.[0];
  const projectId = activeProject?.id;

  const { data: messages, isLoading: loadingMessages } = useQuery({
    queryKey: ["project-messages", projectId],
    enabled: !!projectId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("project_messages")
        .select("*")
        .eq("project_id", projectId!)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (text: string) => {
      if (!user || !projectId) return;
      const { error } = await supabase
        .from("project_messages")
        .insert({
          project_id: projectId,
          sender_id: user.id,
          message: text,
        });
      if (error) throw error;
    },
    onSuccess: () => {
      setMessageText("");
      queryClient.invalidateQueries({ queryKey: ["project-messages", projectId] });
    },
    onError: (error: any) => {
      toast.error("Erro ao enviar mensagem: " + error.message);
    },
  });

  // Auto-scroll to bottom
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Realtime subscription
  useEffect(() => {
    if (!projectId) return;
    const channel = supabase
      .channel("project-messages")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "project_messages",
          filter: `project_id=eq.${projectId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["project-messages", projectId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [projectId, queryClient]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim() || sendMessageMutation.isPending) return;
    sendMessageMutation.mutate(messageText);
  };

  if (loadingClient || loadingMessages) {
    return (
      <AppShell title="Mensagens">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="size-8 animate-spin text-primary" />
        </div>
      </AppShell>
    );
  }

  if (!activeProject) {
    return (
      <AppShell title="Mensagens">
        <Card className="p-12 text-center border-dashed">
          <MessageSquare className="size-12 text-muted-foreground/20 mx-auto mb-4" />
          <p className="text-muted-foreground">Nenhum projeto ativo encontrado para iniciar uma conversa.</p>
        </Card>
      </AppShell>
    );
  }

  return (
    <AppShell title="Mensagens">
      <div className="h-[calc(100vh-12rem)] flex gap-6">
        <Card className="flex-1 border-sidebar-border/50 bg-sidebar/30 backdrop-blur-sm flex flex-col overflow-hidden">
          <div className="p-4 border-b border-sidebar-border/50 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                <MessageSquare className="size-5" />
              </div>
              <div>
                <h3 className="font-bold">Suporte: {activeProject.title}</h3>
                <p className="text-xs text-muted-foreground">Canal direto com a equipe ScaleNexus</p>
              </div>
            </div>
          </div>
          
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
              {messages && messages.length > 0 ? (
                messages.map((msg) => {
                  const isMe = msg.sender_id === user?.id;
                  return (
                    <div key={msg.id} className={cn(
                      "flex gap-3 max-w-[80%]",
                      isMe ? "ml-auto flex-row-reverse" : ""
                    )}>
                      <Avatar className="size-8 border border-sidebar-border/50">
                        <AvatarFallback className={isMe ? "bg-primary text-primary-foreground" : "bg-muted"}>
                          {isMe ? "EU" : "SN"}
                        </AvatarFallback>
                      </Avatar>
                      <div className={cn(
                        "space-y-1",
                        isMe ? "items-end" : ""
                      )}>
                        <div className={cn(
                          "rounded-2xl px-4 py-2 text-sm",
                          isMe ? "bg-primary text-primary-foreground" : "bg-sidebar-accent/50 text-foreground"
                        )}>
                          {msg.message}
                        </div>
                        <span className="text-[10px] text-muted-foreground px-1">
                          {new Date(msg.created_at).toLocaleTimeString("pt-BR", { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="flex flex-col items-center justify-center py-20 text-center opacity-40">
                  <MessageSquare className="size-12 mb-2" />
                  <p className="text-sm">Inicie uma conversa com nossa equipe sobre seu projeto.</p>
                </div>
              )}
              <div ref={scrollRef} />
            </div>
          </ScrollArea>
          
          <div className="p-4 border-t border-sidebar-border/50 bg-sidebar/20">
            <form className="flex gap-2" onSubmit={handleSend}>
              <Button variant="outline" size="icon" type="button" className="shrink-0 border-sidebar-border/50">
                <Plus className="size-4" />
              </Button>
              <Input 
                placeholder="Digite sua mensagem..." 
                className="bg-background/50 border-sidebar-border/50"
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                disabled={sendMessageMutation.isPending}
              />
              <Button type="submit" size="icon" className="shrink-0 shadow-glow" disabled={!messageText.trim() || sendMessageMutation.isPending}>
                {sendMessageMutation.isPending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
              </Button>
            </form>
          </div>
        </Card>
      </div>
    </AppShell>
  );
}

