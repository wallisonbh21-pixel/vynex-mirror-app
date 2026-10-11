import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/lib/auth";
import { toast } from "sonner";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const sendNotification = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: unknown) => z.object({
    userId: z.string().uuid(),
    title: z.string(),
    message: z.string(),
    clientId: z.string().uuid().optional()
  }).parse(data))
  .handler(async ({ data, context }) => {
    const { supabase: userSupabase, userId: actorId } = context;
    if (!actorId) throw new Error("Não autorizado.");

    // Simple internal notification for now
    const { error } = await userSupabase.from("notifications").insert({
      user_id: data.userId,
      title: data.title,
      body: data.message,
      category: "mensagem",
      link: "/cliente/mensagens"
    } as any);

    if (error) throw error;
    return { success: true };
  });

/** Último acesso do cliente via função segura do banco (sem chave administrativa).
 * Recebe o ID do cliente; o banco deriva o usuário e confere papel/permissão. */
export const getClienteAccessLogs = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .validator((data: unknown) => z.object({ clientId: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    const { data: result, error } = await context.supabase.rpc("sn_client_last_access", {
      p_client_id: data.clientId,
    });
    if (error) throw new Error(error.code === "42501" ? "Acesso negado." : "Não foi possível consultar o último acesso.");
    const r = (result ?? {}) as { last_sign_in_at?: string | null; created_at?: string | null };
    return { last_sign_in_at: r.last_sign_in_at ?? null, created_at: r.created_at ?? null };
  });
