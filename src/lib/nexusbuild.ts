import { useCallback, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useSession, useRoles } from "@/lib/auth";

/**
 * NEXUSBUILD AI — camada de dados da interface de conversa.
 * A geração de resposta fica isolada em `replyEngine` para que, no futuro,
 * possamos plugar um modelo de linguagem com streaming sem tocar na UI.
 */

export type NexusRole = "user" | "assistant" | "system";

export interface NexusConversation {
  id: string;
  user_id: string;
  title: string;
  context: Record<string, unknown>;
  archived: boolean;
  created_at: string;
  updated_at: string;
}

export interface NexusMessage {
  id: string;
  conversation_id: string;
  user_id: string;
  role: NexusRole;
  content: string;
  metadata: Record<string, unknown>;
  created_at: string;
}

const CONVERSATIONS_KEY = ["nexusbuild", "conversations"];
const messagesKey = (id: string) => ["nexusbuild", "messages", id];

/** Permissão de uso da NEXUSBUILD AI (espelha exatamente a regra aplicada no banco). */
export function useNexusAccess() {
  const { roles } = useRoles();
  const isAdmin = roles.includes("admin");
  const isCriador = roles.includes("criador");
  return { canUse: isAdmin || isCriador, isAdmin, isCriador };
}

export function useNexusConversations() {
  return useQuery({
    queryKey: CONVERSATIONS_KEY,
    queryFn: async (): Promise<NexusConversation[]> => {
      const { data, error } = await supabase
        .from("nexusbuild_conversations")
        .select("*")
        .eq("archived", false)
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as NexusConversation[];
    },
  });
}

export function useNexusMessages(conversationId: string | null) {
  return useQuery({
    queryKey: messagesKey(conversationId ?? "none"),
    enabled: Boolean(conversationId),
    queryFn: async (): Promise<NexusMessage[]> => {
      const { data, error } = await supabase
        .from("nexusbuild_messages")
        .select("*")
        .eq("conversation_id", conversationId as string)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data ?? []) as unknown as NexusMessage[];
    },
  });
}

export function useCreateConversation() {
  const client = useQueryClient();
  const { user } = useSession();
  return useMutation({
    mutationFn: async (title?: string): Promise<NexusConversation> => {
      if (!user) throw new Error("Sessão expirada.");
      const { data, error } = await supabase
        .from("nexusbuild_conversations")
        .insert({ user_id: user.id, title: title || "Nova conversa" })
        .select("*")
        .single();
      if (error) throw error;
      return data as unknown as NexusConversation;
    },
    onSuccess: () => client.invalidateQueries({ queryKey: CONVERSATIONS_KEY }),
  });
}

export function useRenameConversation() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, title }: { id: string; title: string }) => {
      const { error } = await supabase
        .from("nexusbuild_conversations")
        .update({ title })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => client.invalidateQueries({ queryKey: CONVERSATIONS_KEY }),
  });
}

export function useDeleteConversation() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("nexusbuild_conversations").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => client.invalidateQueries({ queryKey: CONVERSATIONS_KEY }),
  });
}

/**
 * Conversa com o orquestrador da NEXUSBUILD AI (`/api/nexus/chat`).
 * O servidor autentica, aplica permissões, executa ferramentas e persiste as
 * mensagens; aqui apenas transmitimos o texto em tempo real para a tela.
 */
export function useNexusChat(conversationId: string | null) {
  const client = useQueryClient();
  const [streaming, setStreaming] = useState("");
  const [toolActivity, setToolActivity] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const send = useCallback(
    async (content: string, targetId?: string) => {
      const id = targetId ?? conversationId;
      if (!id) throw new Error("Nenhuma conversa aberta.");

      setPending(true);
      setStreaming("");
      setToolActivity(null);

      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const token = sessionData.session?.access_token;
        if (!token) throw new Error("Sessão expirada.");

        const response = await fetch("/api/nexus/chat", {
          method: "POST",
          headers: { "content-type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ conversation_id: id, message: content }),
        });

        if (!response.ok || !response.body) {
          throw new Error(
            response.status === 403
              ? "Você não tem permissão para usar a NEXUSBUILD AI."
              : "Não foi possível falar com a NEXUSBUILD AI agora.",
          );
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        let failure: string | null = null;

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          let nl: number;
          while ((nl = buffer.indexOf("\n")) !== -1) {
            const line = buffer.slice(0, nl).trim();
            buffer = buffer.slice(nl + 1);
            if (!line.startsWith("data:")) continue;
            let event: any;
            try {
              event = JSON.parse(line.slice(5).trim());
            } catch {
              continue;
            }
            if (event.type === "delta") setStreaming((prev) => prev + event.text);
            if (event.type === "tool") setToolActivity(event.name);
            if (event.type === "error") failure = event.message;
          }
        }

        if (failure) throw new Error(failure);
      } finally {
        setPending(false);
        setToolActivity(null);
        setStreaming("");
        await client.invalidateQueries({ queryKey: messagesKey(id) });
        await client.invalidateQueries({ queryKey: CONVERSATIONS_KEY });
      }
    },
    [client, conversationId],
  );

  return { send, streaming, toolActivity, pending };
}

/** Título automático a partir da primeira mensagem do usuário. */
export function deriveTitle(text: string) {
  const clean = text.trim().replace(/\s+/g, " ");
  return clean.length > 48 ? `${clean.slice(0, 48)}…` : clean || "Nova conversa";
}

/** Agrupa conversas por período para a lista lateral. */
export function groupByPeriod(conversations: NexusConversation[]) {
  const now = Date.now();
  const day = 86_400_000;
  const groups: { label: string; items: NexusConversation[] }[] = [
    { label: "Hoje", items: [] },
    { label: "Últimos 7 dias", items: [] },
    { label: "Anteriores", items: [] },
  ];
  for (const conv of conversations) {
    const diff = now - new Date(conv.updated_at).getTime();
    if (diff < day) groups[0]!.items.push(conv);
    else if (diff < day * 7) groups[1]!.items.push(conv);
    else groups[2]!.items.push(conv);
  }
  return groups.filter((g) => g.items.length > 0);
}
