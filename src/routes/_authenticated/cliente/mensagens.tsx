import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Send, MessageSquare, Plus } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/_authenticated/cliente/mensagens")({
  component: MyMessages,
});

function MyMessages() {
  const [message, setMessage] = useState("");
  
  // Mock de mensagens para interface inicial
  const messages = [
    { id: 1, sender: "ScaleNexus", text: "Olá! Recebemos seu briefing e já estamos analisando.", time: "09:30", isMe: false },
    { id: 2, sender: "Você", text: "Perfeito! Qualquer dúvida estou à disposição.", time: "10:15", isMe: true },
    { id: 3, sender: "ScaleNexus", text: "Já iniciamos a fase de planejamento estratégico.", time: "Ontem", isMe: false },
  ];

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
                <h3 className="font-bold">Suporte ao Projeto</h3>
                <p className="text-xs text-muted-foreground">Canal oficial de comunicação</p>
              </div>
            </div>
          </div>
          
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
              {messages.map((msg) => (
                <div key={msg.id} className={cn(
                  "flex gap-3 max-w-[80%]",
                  msg.isMe ? "ml-auto flex-row-reverse" : ""
                )}>
                  <Avatar className="size-8 border border-sidebar-border/50">
                    <AvatarFallback className={msg.isMe ? "bg-primary text-primary-foreground" : "bg-muted"}>
                      {msg.sender[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className={cn(
                    "space-y-1",
                    msg.isMe ? "items-end" : ""
                  )}>
                    <div className={cn(
                      "rounded-2xl px-4 py-2 text-sm",
                      msg.isMe ? "bg-primary text-primary-foreground" : "bg-sidebar-accent/50 text-foreground"
                    )}>
                      {msg.text}
                    </div>
                    <span className="text-[10px] text-muted-foreground px-1">{msg.time}</span>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
          
          <div className="p-4 border-t border-sidebar-border/50 bg-sidebar/20">
            <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); setMessage(""); }}>
              <Button variant="outline" size="icon" type="button" className="shrink-0 border-sidebar-border/50">
                <Plus className="size-4" />
              </Button>
              <Input 
                placeholder="Digite sua mensagem..." 
                className="bg-background/50 border-sidebar-border/50"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
              <Button type="submit" size="icon" className="shrink-0 shadow-glow" disabled={!message}>
                <Send className="size-4" />
              </Button>
            </form>
          </div>
        </Card>
      </div>
    </AppShell>
  );
}

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(" ");
}
