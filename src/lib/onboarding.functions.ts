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
    const { supabase: userSupabase, userId: actorId } = context;

    if (!actorId) throw new Error("[CLIENT_LOGIN_ERROR] etapa=auth_verify status=unauthorized");

    try {
      // 1. Validate actor roles (Admin or Vendedor)
      const { data: roles } = await userSupabase.from("user_roles").select("role").eq("user_id", actorId);
      const isAdmin = roles?.some((r: any) => r.role === 'admin');
      const isVendedor = roles?.some((r: any) => r.role === 'vendedor');

      if (!isAdmin && !isVendedor) throw new Error("[CLIENT_LOGIN_ERROR] etapa=permission_check status=forbidden");

      // 2. Fetch client and validate ownership
      const { data: client, error: clientErr } = await userSupabase
        .from("clients")
        .select("id, owner_id, status, user_id, contact_email, contact_name")
        .eq("id", data.clientId)
        .single();
      
      if (clientErr || !client) throw new Error(`[CLIENT_LOGIN_ERROR] etapa=client_lookup error=${clientErr?.message || "not_found"}`);

      if (!isAdmin && client.owner_id !== actorId) {
        throw new Error("[CLIENT_LOGIN_ERROR] etapa=permission_check status=forbidden");
      }

      const clientEmail = client.contact_email;
      if (!clientEmail) throw new Error("[CLIENT_LOGIN_ERROR] etapa=client_data error=missing_email");

      // 3. Search for Auth user by email
      console.log("[DEBUG] auth_lookup", { email: clientEmail });
      const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers();
      if (listError) throw new Error(`[CLIENT_LOGIN_ERROR] etapa=auth_lookup error=${listError.message}`);
      
      const existingAuthUser = users.find((u) => u.email?.toLowerCase() === clientEmail.toLowerCase());
      
      let targetAuthUserId: string = "";

      if (existingAuthUser) {
        // CASE: Auth user exists
        console.log("[DEBUG] auth_created_or_existing", { status: "existing", authId: existingAuthUser.id });
        targetAuthUserId = existingAuthUser.id;

        // Check if linked to ANOTHER client
        const { data: otherClient } = await supabaseAdmin
          .from("clients")
          .select("id")
          .eq("user_id", targetAuthUserId)
          .maybeSingle();

        if (otherClient && otherClient.id !== client.id) {
          // Verify if the actor owns this other client too (rare but possible)
          // Actually, the instruction says BLOQUEAR if linked to another client.
          throw new Error("Este e-mail já está vinculado a outro cliente. Entre em contato com um administrador.");
        }

        // Link client if not already linked (No insert, just update)
        if (client.user_id !== targetAuthUserId) {
          const { error: linkErr } = await supabaseAdmin.from("clients").update({ user_id: targetAuthUserId } as any).eq("id", client.id);
          if (linkErr) throw new Error(`[CLIENT_LOGIN_ERROR] etapa=client_link error=${linkErr.message}`);
        }
      } else {
        // CASE: Auth user does NOT exist - Create it
        // Check username uniqueness in profiles before creating Auth
        const { data: existingProfile } = await supabaseAdmin
          .from("profiles")
          .select("id")
          .eq("nickname", data.username)
          .maybeSingle();
          
        if (existingProfile) throw new Error("Este nome de usuário já está em uso.");

        const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
          email: clientEmail,
          email_confirm: true, 
          user_metadata: { 
            full_name: client.contact_name || "Cliente", 
            role: "cliente",
            username: data.username 
          },
        });

        if (createError) throw new Error(`[CLIENT_LOGIN_ERROR] etapa=auth_create error=${createError.message}`);
        
        targetAuthUserId = newUser.user.id;

        // Link Client (Update only!)
        const { error: linkNewErr } = await supabaseAdmin.from("clients").update({ user_id: targetAuthUserId } as any).eq("id", client.id);
        if (linkNewErr) throw new Error(`[CLIENT_LOGIN_ERROR] etapa=client_link_new error=${linkNewErr.message}`);
      }

      // 4. Ensure Profile exists and is correct
      const { error: profileErr } = await supabaseAdmin.from("profiles").upsert({
        id: targetAuthUserId,
        full_name: client.contact_name || "Cliente",
        nickname: data.username
      } as any);
      if (profileErr) throw new Error(`[CLIENT_LOGIN_ERROR] etapa=profile_upsert error=${profileErr.message}`);

      // 5. Ensure 'cliente' role
      const { error: roleErr } = await supabaseAdmin.from("user_roles").upsert({ 
        user_id: targetAuthUserId, 
        role: "cliente" as any,
      }, { onConflict: "user_id,role" });
      if (roleErr) throw new Error(`[CLIENT_LOGIN_ERROR] etapa=role_assign error=${roleErr.message}`);

      // 6. Generate and send recovery link
      console.log("[DEBUG] invite_generated", { email: clientEmail });
      const { error: recoveryError } = await supabaseAdmin.auth.admin.generateLink({
        type: 'recovery',
        email: clientEmail,
        options: {
          redirectTo: `${process.env['SITE_URL'] || 'http://localhost:8080'}/reset-password`
        }
      });

      if (recoveryError) {
        console.error("[DEBUG] email_failed", { error: recoveryError.message });
        return {
          success: false,
          error: "AUTH_LINK_FAILED",
          message: `[CLIENT_LOGIN_ERROR] etapa=send_email error=${recoveryError.message}`
        };
      }

      console.log("[DEBUG] email_sent", { email: clientEmail });
      console.log("[DEBUG] onboarding_completed", { clientId: data.clientId });
      return { 
        success: true, 
        userId: targetAuthUserId,
        message: existingAuthUser 
          ? "Este cliente já possui uma conta. Um novo link para definir a senha foi enviado."
          : "Login criado com sucesso. O link para definir a senha foi enviado para o cliente."
      };
    } catch (e: any) {
      if (e.message?.includes('[CLIENT_LOGIN_ERROR]')) {
        throw e;
      }
      throw new Error(`[CLIENT_LOGIN_ERROR] etapa=unknown error=${e.message}`);
    }
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
        redirectTo: `${process.env['SITE_URL'] || 'http://localhost:8080'}/reset-password`
      }
    });
    if (error) {
      throw new Error("Erro ao enviar link. Tente novamente mais tarde.");
    }
    return { success: true, message: "Um novo link de acesso foi enviado para o e-mail cadastrado." };
  });
