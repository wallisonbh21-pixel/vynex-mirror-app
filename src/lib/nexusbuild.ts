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

/** Permissão de uso da NEXUSBUILD AI (espelha a regra aplicada no banco). */
export function useNexusAccess() {
  const { isAdmin, isCriador } = useRoles();
  return { canUse: Boolean(isAdmin || isCriador), isAdmin, isCriador };
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
 * Motor de resposta local (placeholder). Nenhum modelo externo é chamado nesta versão.
 * Substituível por chamada ao provedor de IA + streaming sem alterar a interface.
 */
export function replyEngine(prompt: string): string {
  const clean = prompt.trim();
  return [
    "Recebi sua mensagem:",
    "",
    `> ${clean.slice(0, 500)}`,
    "",
    "Ainda estou operando sem modelo de linguagem conectado — esta é a interface oficial da NEXUSBUILD AI dentro do ScaleNexus.",
    "Assim que o modelo for ligado, responderei com análise de projeto, planejamento e apoio à criação usando o contexto do seu histórico.",
  ].join("\n");
}

export function useSendMessage(conversationId: string | null) {
  const client = useQueryClient();
  const { user } = useSession();

  return useMutation({
    mutationFn: async (content: string) => {
      if (!user) throw new Error("Sessão expirada.");
      if (!conversationId) throw new Error("Nenhuma conversa aberta.");

      const { error: userError } = await supabase.from("nexusbuild_messages").insert({
        conversation_id: conversationId,
        user_id: user.id,
        role: "user",
        content,
      });
      if (userError) throw userError;

      const { error: aiError } = await supabase.from("nexusbuild_messages").insert({
        conversation_id: conversationId,
        user_id: user.id,
        role: "assistant",
        content: replyEngine(content),
        metadata: { engine: "local-placeholder", version: 1 },
      });
      if (aiError) throw aiError;

      await supabase
        .from("nexusbuild_conversations")
        .update({ updated_at: new Date().toISOString() })
        .eq("id", conversationId);
    },
    onSuccess: () => {
      if (conversationId) client.invalidateQueries({ queryKey: messagesKey(conversationId) });
      client.invalidateQueries({ queryKey: CONVERSATIONS_KEY });
    },
  });
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
