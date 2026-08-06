import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const createClientAccountSchema = z.object({
  email: z.string().email(),
  fullName: z.string().min(2),
  clientId: z.string().uuid(),
  username: z.string().min(3),
});

export const createClientPortalAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: unknown) => createClientAccountSchema.parse(data))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { supabase: userSupabase, userId: actorId } = context;

    if (!actorId) throw new Error("Não autorizado.");

    const { data: roles } = await userSupabase.from("user_roles").select("role").eq("user_id", actorId);
    const isAdmin = roles?.some((r: any) => r.role === 'admin');
    const isVendedor = roles?.some((r: any) => r.role === 'vendedor');

    const { data: client, error: clientErr } = await userSupabase
      .from("clients")
      .select("owner_id, status, user_id, company, contact_email, contact_name, username")
      .eq("id", data.clientId)
      .single();
    
    if (clientErr || !client) throw new Error("Cliente não encontrado.");

    if (!isAdmin) {
      if (!isVendedor || client.owner_id !== actorId) {
        throw new Error("Você não tem permissão para gerenciar este cliente.");
      }
    }

    if (client.status !== 'ativo') {
      throw new Error("Somente clientes ativos podem receber acesso ao portal.");
    }
    if (client.user_id) {
      throw new Error("Este cliente já possui um login vinculado.");
    }

    const { data: existingUserList } = await supabaseAdmin.auth.admin.listUsers();
    let user = existingUserList.users.find((u) => u.email === data.email);
    
    const { data: existingProfile } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .eq("nickname", data.username)
      .maybeSingle();
      
    if (existingProfile) throw new Error("Este nome de usuário já está em uso.");

    if (!user) {
      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email: data.email,
        email_confirm: true, 
        user_metadata: { 
          full_name: data.fullName, 
          role: "cliente",
          username: data.username 
        },
      });

      if (createError) throw createError;
      user = newUser.user;

      await supabaseAdmin.auth.admin.generateLink({
        type: 'recovery',
        email: data.email,
        options: {
          redirectTo: `${process.env['SITE_URL'] || 'http://localhost:8080'}/cliente/reset-password`
        }
      });
    }

    if (!user) throw new Error("Falha ao criar ou localizar usuário.");

    const { error: roleError } = await supabaseAdmin
      .from("user_roles")
      .upsert({ 
        user_id: user.id, 
        role: "cliente" as any,
      }, { onConflict: "user_id,role" });

    if (roleError) throw roleError;

    const { error: linkError } = await supabaseAdmin
      .from("clients")
      .update({ user_id: user.id } as any)
      .eq("id", data.clientId);

    if (linkError) throw linkError;

    await supabaseAdmin.from("profiles").upsert({
      id: user.id,
      full_name: data.fullName,
      nickname: data.username
    } as any);

    return { 
      success: true, 
      userId: user.id,
      message: "Acesso ao portal configurado com sucesso. Convite enviado."
    };
  });

export const updateLoginStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: unknown) => z.object({ userId: z.string(), status: z.string() }).parse(data))
  .handler(async ({ data }) => {
    return { success: true };
  });

export const resendInvite = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: unknown) => z.object({ email: z.string().email() }).parse(data))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { supabase: userSupabase, userId: actorId } = context;

    if (!actorId) throw new Error("Não autorizado.");

    const { data: roles } = await userSupabase.from("user_roles").select("role").eq("user_id", actorId);
    const isAdmin = roles?.some((r: any) => r.role === 'admin');
    const isVendedor = roles?.some((r: any) => r.role === 'vendedor');

    if (!isAdmin && !isVendedor) throw new Error("Não autorizado.");

    if (!isAdmin) {
      const { data: client, error } = await userSupabase
        .from("clients")
        .select("owner_id")
        .eq("contact_email", data.email)
        .single();
      
      if (error || client?.owner_id !== actorId) {
        throw new Error("Você não tem permissão para gerenciar este cliente.");
      }
    }

    const { error } = await supabaseAdmin.auth.admin.generateLink({
      type: 'recovery',
      email: data.email,
      options: {
        redirectTo: `${process.env['SITE_URL'] || 'http://localhost:8080'}/cliente/reset-password`
      }
    });
    if (error) throw error;
    return { success: true };
  });
