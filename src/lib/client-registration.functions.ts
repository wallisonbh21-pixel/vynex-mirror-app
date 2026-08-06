import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const registerClientSchema = z.object({
  contact_name: z.string().min(2, "Nome muito curto"),
  username: z.string().min(3, "Nome de usuário deve ter pelo menos 3 caracteres"),
  contact_email: z.string().email("E-mail inválido"),
  contact_phone: z.string().optional(),
  company: z.string().optional(),
  status: z.enum(["active", "inactive"]),
});

export const registerNewClient = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: unknown) => registerClientSchema.parse(data))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { userId: actorId } = context;

    if (!actorId) throw new Error("Não autorizado.");

    // Check username uniqueness in profiles
    const { data: existingProfile } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .eq("nickname", data.username)
      .maybeSingle();

    if (existingProfile) {
      throw new Error("Este nome de usuário já está em uso.");
    }

    // Check email uniqueness in clients
    const { data: existingClient } = await supabaseAdmin
      .from("clients")
      .select("id")
      .eq("contact_email", data.contact_email)
      .maybeSingle();

    if (existingClient) {
      throw new Error("Este e-mail já está cadastrado para outro cliente.");
    }

    // Insert the client
    const { data: newClient, error: insertError } = await supabaseAdmin
      .from("clients")
      .insert({
        contact_name: data.contact_name,
        contact_email: data.contact_email,
        contact_phone: data.contact_phone || null,
        company: data.company || data.contact_name, // fallback to name if no company
        status: data.status,
        owner_id: actorId, // Set the creator as owner
      } as any)
      .select()
      .single();

    if (insertError) throw insertError;

    return { 
      success: true, 
      client: newClient,
      message: "Cliente cadastrado com sucesso." 
    };
  });
