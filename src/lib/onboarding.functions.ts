import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const createClientAccountSchema = z.object({
  email: z.string().email(),
  fullName: z.string().optional().nullable(),
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
      .select("id, owner_id, status, user_id, contact_email, contact_name")
      .eq("id", data.clientId)
      .single();
    
    if (clientErr || !client) throw new Error("Cliente não encontrado.");

    if (!isAdmin) {
      if (!isVendedor || client.owner_id !== actorId) {
        throw new Error("Você não tem permissão para gerenciar este cliente.");
      }
    }

    if (client.status !== 'ativo' && client.status !== 'active') {
      throw new Error("Somente clientes ativos podem receber acesso ao portal.");
    }

    // Check if user already exists in Auth by email
    const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers();
    if (listError) throw new Error("Erro ao verificar usuários existentes.");
    
    const existingUser = users.find((u) => u.email?.toLowerCase() === data.email.toLowerCase());
    
    if (existingUser) {
      // User exists in Auth.
      
      // Check if this existing user is already linked to ANOTHER client
      const { data: otherClient } = await supabaseAdmin
        .from("clients")
        .select("id, contact_name, contact_email")
        .eq("user_id", existingUser.id)
        .maybeSingle();

      if (otherClient && otherClient.id !== client.id) {
        throw new Error(`Este e-mail já está vinculado a outro cliente. Solicite a análise de um administrador.`);
      }

      // If it exists in Auth but is NOT linked to any client (or linked to this one)
      // We perform the linkage/update and send/resend invite.
      
      // 1. Ensure Role
      await supabaseAdmin.from("user_roles").upsert({ 
        user_id: existingUser.id, 
        role: "cliente" as any,
      }, { onConflict: "user_id,role" });

      // 2. Link Client
      await supabaseAdmin.from("clients").update({ user_id: existingUser.id } as any).eq("id", client.id);

      // 3. Ensure Profile (Update nickname/username if provided)
      await supabaseAdmin.from("profiles").upsert({
        id: existingUser.id,
        full_name: data.fullName || client.contact_name || null,
        nickname: data.username
      } as any);

      // 4. Generate recovery link (Resend access)
      const { error: recoveryError } = await supabaseAdmin.auth.admin.generateLink({
        type: 'recovery',
        email: data.email,
        options: {
          redirectTo: `${process.env['SITE_URL'] || 'http://localhost:8080'}/cliente/reset-password`
        }
      });

      if (recoveryError) {
        return {
          success: false,
          error: "AUTH_LINK_FAILED",
          message: "A conta já existe e está vinculada, mas não foi possível enviar o e-mail de acesso. Verifique a configuração de e-mail do sistema."
        };
      }

      return { 
        success: true, 
        userId: existingUser.id,
        message: "Um novo link de acesso foi enviado para o e-mail cadastrado."
      };
    }

    // New User flow
    // Check if username is in use in profiles
    const { data: existingProfile } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .eq("nickname", data.username)
      .maybeSingle();
      
    if (existingProfile) throw new Error("Este nome de usuário já está em uso.");

    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: data.email,
      email_confirm: true, 
      user_metadata: { 
        full_name: data.fullName || client.contact_name || null, 
        role: "cliente",
        username: data.username 
      },
    });

    if (createError) throw new Error(`Erro ao criar usuário: ${createError.message}`);

    const authUser = newUser.user;

    // Assign Role
    await supabaseAdmin.from("user_roles").upsert({ 
      user_id: authUser.id, 
      role: "cliente" as any,
    }, { onConflict: "user_id,role" });

    // Link Client
    await supabaseAdmin.from("clients").update({ user_id: authUser.id } as any).eq("id", data.clientId);

    // Create Profile
    await supabaseAdmin.from("profiles").upsert({
      id: authUser.id,
      full_name: data.fullName || client.contact_name || null,
      nickname: data.username
    } as any);

    // Generate recovery link
    const { error: recoveryError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'recovery',
      email: data.email,
      options: {
        redirectTo: `${process.env['SITE_URL'] || 'http://localhost:8080'}/cliente/reset-password`
      }
    });

    if (recoveryError) {
      // If auth creation succeeded but email failed, we still have the user linked,
      // but we return success: false to the UI can show "Reenviar acesso"
      return {
        success: false,
        error: "AUTH_LINK_FAILED",
        userId: authUser.id,
        message: "Login criado com sucesso, mas não foi possível enviar o e-mail de acesso. Verifique a configuração de e-mail do sistema."
      };
    }

    return { 
      success: true, 
      userId: authUser.id,
      message: "Login criado com sucesso. Um e-mail de acesso foi enviado para o cliente."
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
    if (error) {
      throw new Error("Não foi possível enviar o e-mail de acesso. Verifique a configuração de e-mail do sistema.");
    }
    return { success: true, message: "Um novo link de acesso foi enviado para o e-mail cadastrado." };
  });
