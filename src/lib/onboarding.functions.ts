import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const createClientAccountSchema = z.object({
  clientId: z.string().uuid(),
  username: z.string().min(3),
});

export const createClientPortalAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: unknown) => createClientAccountSchema.parse(data))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { createAuthUser } = await import("./auth-utils.server");
    const { supabase: userSupabase, userId: actorId } = context;

    if (!actorId) throw new Error("Não autorizado.");

    // 1. Validate actor roles (Admin or Vendedor)
    const { data: roles } = await userSupabase.from("user_roles").select("role").eq("user_id", actorId);
    const isAdmin = roles?.some((r: any) => r.role === 'admin' || r.role === 'diretor');
    const isVendedor = roles?.some((r: any) => r.role === 'vendedor');

    if (!isAdmin && !isVendedor) throw new Error("Não autorizado.");

    // 2. Fetch client and validate ownership
    const { data: client, error: clientErr } = await userSupabase
      .from("clients")
      .select("id, owner_id, contact_email, contact_name, user_id")
      .eq("id", data.clientId)
      .single();
    
    if (clientErr || !client) throw new Error("Cliente não encontrado.");

    if (!isAdmin && client.owner_id !== actorId) {
      throw new Error("Você não tem permissão para gerenciar este cliente.");
    }

    if (!client.contact_email) throw new Error("E-mail do cliente não informado.");

    // 3. Search for username uniqueness in profiles
    const { data: existingProfile } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .eq("nickname", data.username)
      .maybeSingle();

    if (existingProfile) {
      throw new Error("Este nome de usuário já está sendo utilizado.");
    }

    // 4. Search for Auth user by email
    const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers();
    if (listError) throw new Error(`Erro ao listar usuários: ${listError.message}`);
    
    const existingAuthUser = users.find((u) => u.email?.toLowerCase() === client.contact_email!.toLowerCase());
    
    if (existingAuthUser) {
      // Link if not linked
      if (client.user_id !== existingAuthUser.id) {
        await supabaseAdmin.from("clients").update({ user_id: existingAuthUser.id } as any).eq("id", client.id);
      }
      
      // Update status or ensure roles/profiles if needed
      await supabaseAdmin.from("user_roles").upsert({ user_id: existingAuthUser.id, role: "cliente" as any }, { onConflict: "user_id,role" });

      return { success: true, message: "Conta já existente vinculada com sucesso." };
    }

    // 5. Create new account
    const { user: newUser, initialPassword } = await createAuthUser(supabaseAdmin, {
      email: client.contact_email,
      username: data.username,
      fullName: client.contact_name || data.username,
      role: "cliente",
      clientId: client.id
    });

    // Link
    await supabaseAdmin.from("clients").update({ user_id: newUser.id } as any).eq("id", client.id);
    
    // Profile & Role
    await supabaseAdmin.from("profiles").upsert({ id: newUser.id, nickname: data.username, full_name: client.contact_name || data.username } as any);
    await supabaseAdmin.from("user_roles").upsert({ user_id: newUser.id, role: "cliente" as any }, { onConflict: "user_id,role" });

    // 6. Send access e-mail using REAL SMTP flow (inviteUserByEmail)
    console.log("[ONBOARDING] email_prepare", { email: client.contact_email });
    const siteUrl = process.env['SITE_URL'] || 'http://localhost:8080';
    
    console.log("[ONBOARDING] email_send_attempt", { email: client.contact_email });
    const { error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(client.contact_email, {
      redirectTo: `${siteUrl}/reset-password`,
      data: { 
        full_name: client.contact_name || data.username,
        username: data.username,
        platform_name: "ScaleNexus"
      }
    });

    if (inviteError) {
      console.error("[ONBOARDING] email_send_failed", { email: client.contact_email, error: inviteError.message });
      throw new Error(`Login criado, mas não foi possível enviar o e-mail. Verifique a configuração do serviço de e-mail. (Erro: ${inviteError.message})`);
    }

    console.log("[ONBOARDING] email_send_success", { email: client.contact_email });
    return { 
      success: true, 
      message: "Login criado e acesso enviado para o e-mail do cliente." 
    };
  });

export const resendInvite = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: unknown) => z.object({ email: z.string().email() }).parse(data))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { supabase: userSupabase, userId: actorId } = context;

    if (!actorId) throw new Error("Não autorizado.");

    const { data: roles } = await userSupabase.from("user_roles").select("role").eq("user_id", actorId);
    const isAdmin = roles?.some((r: any) => r.role === 'admin' || r.role === 'diretor');
    const isVendedor = roles?.some((r: any) => r.role === 'vendedor');

    if (!isAdmin && !isVendedor) throw new Error("Não autorizado.");

    if (!isAdmin) {
      const { data: client, error } = await userSupabase
        .from("clients")
        .select("owner_id")
        .eq("contact_email", data.email)
        .single();
      
      if (error || client?.owner_id !== actorId) {
        throw new Error("Não autorizado.");
      }
    }

    const siteUrl = process.env['SITE_URL'] || 'http://localhost:8080';
    await supabaseAdmin.auth.admin.inviteUserByEmail(data.email, {
      redirectTo: `${siteUrl}/reset-password`,
    });

    return { success: true, message: "E-mail de redefinição enviado." };
  });
