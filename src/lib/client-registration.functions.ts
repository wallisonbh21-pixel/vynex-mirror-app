import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const registerClientSchema = z.object({
  contact_name: z.string().min(2, "O nome completo é obrigatório e deve ter pelo menos 2 caracteres"),
  username: z.string().min(3, "O nome de usuário é obrigatório e deve ter pelo menos 3 caracteres"),
  contact_email: z.string().email("E-mail inválido"),
  contact_phone: z.string().optional().nullable(),
  company: z.string().optional().nullable(),
  status: z.enum(["active", "inactive"]).default("active"),
});

export const registerNewClient = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: unknown) => registerClientSchema.parse(data))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { userId: actorId, supabase: userSupabase } = context;

    if (!actorId) throw new Error("Não autorizado.");

    // Determine actor role
    const { data: roles } = await userSupabase.from("user_roles").select("role").eq("user_id", actorId);
    const isAdmin = roles?.some((r: any) => r.role === 'admin');
    const isVendedor = roles?.some((r: any) => r.role === 'vendedor');

    if (!isAdmin && !isVendedor) {
      throw new Error("Você não tem permissão para cadastrar clientes.");
    }

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
        company: data.company || null,
        status: "active", // Always active as requested
        owner_id: actorId, // Link to the creator (admin or vendedor)
      } as any)
      .select()
      .single();

    if (insertError) {
      console.error("Erro ao inserir cliente:", insertError);
      throw new Error("Erro ao salvar o registro do cliente.");
    }

    return { 
      success: true, 
      client: newClient,
      message: "Cliente cadastrado com sucesso." 
    };
  });
