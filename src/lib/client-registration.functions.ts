import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const registerClientSchema = z.object({
  username: z.string().min(3, "O nome de usuário deve ter pelo menos 3 caracteres"),
  contact_email: z.string().email("E-mail inválido"),
  contact_name: z.string().optional().nullable().transform(val => val ?? ""),
  contact_phone: z.string().optional().nullable().transform(val => val ?? ""),
  company: z.string().optional().nullable().transform(val => val ?? ""),
  notes: z.string().default("").transform(val => val ?? ""),
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

    // 1. Check username uniqueness in profiles
    const { data: existingProfile } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .eq("nickname", data.username)
      .maybeSingle();

    if (existingProfile) {
      throw new Error("Este nome de usuário já está sendo utilizado.");
    }

    // 2. Check email uniqueness in clients
    const { data: existingClient } = await supabaseAdmin
      .from("clients")
      .select("id")
      .eq("contact_email", data.contact_email)
      .maybeSingle();

    if (existingClient) {
      throw new Error("Este e-mail já está cadastrado para outro cliente.");
    }

    // 3. Insert the client in 'clients' table
    const { data: newClient, error: insertError } = await supabaseAdmin
      .from("clients")
      .insert({
        contact_name: data.contact_name || data.username,
        contact_email: data.contact_email,
        contact_phone: data.contact_phone || "",
        company: data.company || "",
        status: "active",
        owner_id: actorId,
        notes: data.notes || JSON.stringify({ pending_username: data.username }),
      } as any)
      .select()
      .single();

    if (insertError) {
      console.error("Erro ao inserir cliente:", insertError);
      throw new Error("Não foi possível cadastrar o cliente.");
    }

    // 4. AUTOMATIC ONBOARDING: Create access portal account
    let onboardingResult = { success: false, message: "" };
    
    try {
      // 4.1 Check if Auth user already exists
      const { data: { users } } = await supabaseAdmin.auth.admin.listUsers();
      const existingAuthUser = users.find(u => u.email?.toLowerCase() === data.contact_email.toLowerCase());

      if (existingAuthUser) {
        // CASE: Auth exists - Check link to OTHER client
        const { data: otherClient } = await supabaseAdmin
          .from("clients")
          .select("id")
          .eq("user_id", existingAuthUser.id)
          .maybeSingle();

        if (otherClient && otherClient.id !== newClient.id) {
          return {
            success: true,
            client: newClient,
            onboardingSuccess: false,
            message: "Cliente cadastrado, mas este e-mail já está vinculado a outro cliente."
          };
        }

        // Link existing Auth to this new client
        await supabaseAdmin.from("clients").update({ user_id: existingAuthUser.id } as any).eq("id", newClient.id);
        
        // Update profile/role
        await supabaseAdmin.from("profiles").upsert({ id: existingAuthUser.id, nickname: data.username, full_name: data.contact_name || data.username } as any);
        await supabaseAdmin.from("user_roles").upsert({ user_id: existingAuthUser.id, role: "cliente" as any }, { onConflict: "user_id,role" });

        // Send access link
        await supabaseAdmin.auth.admin.generateLink({
          type: 'recovery',
          email: data.contact_email,
          options: { redirectTo: `${process.env['SITE_URL'] || 'http://localhost:8080'}/reset-password` }
        });

        onboardingResult = { success: true, message: "Cliente cadastrado e acesso enviado por e-mail." };
      } else {
        // CASE: Auth does NOT exist - Create it
        const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
          email: data.contact_email,
          email_confirm: true, 
          user_metadata: { 
            full_name: data.contact_name || data.username, 
            role: "cliente",
            username: data.username 
          },
        });

        if (createError) throw new Error(createError.message);

        const targetAuthUserId = newUser.user.id;
        
        // Link client
        await supabaseAdmin.from("clients").update({ user_id: targetAuthUserId } as any).eq("id", newClient.id);
        
        // Create Profile and Role
        await supabaseAdmin.from("profiles").upsert({ id: targetAuthUserId, nickname: data.username, full_name: data.contact_name || data.username } as any);
        await supabaseAdmin.from("user_roles").upsert({ user_id: targetAuthUserId, role: "cliente" as any }, { onConflict: "user_id,role" });

        // Send access link
        const { error: recoveryError } = await supabaseAdmin.auth.admin.generateLink({
          type: 'recovery',
          email: data.contact_email,
          options: { redirectTo: `${process.env['SITE_URL'] || 'http://localhost:8080'}/reset-password` }
        });

        if (recoveryError) {
          return {
            success: true,
            client: newClient,
            onboardingSuccess: false,
            message: "Cliente e acesso criados, mas não foi possível enviar o e-mail. Use 'Reenviar Acesso'."
          };
        }

        onboardingResult = { success: true, message: "Cliente cadastrado e acesso enviado por e-mail." };
      }
    } catch (e: any) {
      console.error("Erro no onboarding automático:", e);
      return {
        success: true,
        client: newClient,
        onboardingSuccess: false,
        message: "Cliente cadastrado, mas não foi possível criar o acesso."
      };
    }

    return { 
      success: true, 
      client: newClient,
      onboardingSuccess: onboardingResult.success,
      message: onboardingResult.message || "Cliente cadastrado com sucesso!" 
    };
  });
