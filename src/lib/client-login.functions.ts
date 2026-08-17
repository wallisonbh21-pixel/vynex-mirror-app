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

export const getClienteAccessLogs = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .validator((data: unknown) => z.object({ userId: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: { user }, error } = await supabaseAdmin.auth.admin.getUsuárioById(data.userId);
    if (error) throw error;
    
    return {
      last_sign_in_at: user?.last_sign_in_at || null,
      created_at: user?.created_at || null
    };
  });
