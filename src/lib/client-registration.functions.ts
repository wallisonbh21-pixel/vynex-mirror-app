import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const registerClientSchema = z.object({
  username: z.string().min(3, "O nome de usuário deve ter pelo menos 3 caracteres"),
  contact_email: z.string().email("E-mail inválido"),
  contact_name: z.string().optional().nullable().transform(val => val ?? ""),
  contact_phone: z.string().optional().nullable().transform(val => val ?? ""),
  company: z.string().optional().nullable().transform(val => val ?? ""),
  notes: z.string().optional().nullable().transform(val => val ?? ""),
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

    // 2. Create the commercial client record first
    const { data: newClient, error: clientError } = await supabaseAdmin
      .from("clients")
      .insert({
        contact_name: data.contact_name,
        contact_email: data.contact_email,
        contact_phone: data.contact_phone,
        company: data.company,
        notes: data.notes,
        owner_id: actorId,
        status: "ativo"
      } as any)
      .select()
      .single();

    if (clientError || !newClient) {
      console.error("[DEBUG] client_creation_failed", clientError);
      throw new Error(`Erro ao salvar o registro do cliente: ${clientError?.message || "Registro não criado"}`);
    }

    console.log("[DEBUG] client_created", { clientId: newClient.id, email: data.contact_email });

    // 4. AUTOMATIC ONBOARDING: Create access portal account
    let onboardingResult = { success: false, message: "" };
    
    try {
      // 4.1 Check if Auth user already exists
      console.log("[DEBUG] auth_lookup", { email: data.contact_email });
      const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers();
      if (listError) throw new Error(`Erro ao listar usuários: ${listError.message}`);
      
      const existingAuthUser = users.find(u => u.email?.toLowerCase() === data.contact_email.toLowerCase());

      let targetAuthUserId: string;

      if (existingAuthUser) {
        console.log("[DEBUG] auth_created_or_existing", { status: "existing", authId: existingAuthUser.id });
        targetAuthUserId = existingAuthUser.id;

        // CASE: Auth exists - Check link to OTHER client
        const { data: otherClient } = await supabaseAdmin
          .from("clients")
          .select("id")
          .eq("user_id", targetAuthUserId)
          .maybeSingle();

        if (otherClient && otherClient.id !== newClient.id) {
          console.log("[DEBUG] onboarding_failed", { reason: "email_linked_to_other_client" });
          return {
            success: true,
            client: newClient,
            onboardingSuccess: false,
            message: "Cliente cadastrado, mas este e-mail já está vinculado a outro cliente."
          };
        }

        // Link existing Auth to this new client (Case 3)
        const { error: linkErr } = await supabaseAdmin.from("clients").update({ user_id: targetAuthUserId } as any).eq("id", newClient.id);
        if (linkErr) throw new Error(`Erro ao vincular cliente: ${linkErr.message}`);
        console.log("[DEBUG] client_linked", { clientId: newClient.id, authId: targetAuthUserId });

      } else {
        // CASE: Auth does NOT exist - Create it (Case 1)
        console.log("[DEBUG] auth_created_or_existing", { status: "creating" });
        const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
          email: data.contact_email,
          email_confirm: true, 
          user_metadata: { 
            full_name: data.contact_name || data.username, 
            role: "cliente",
            username: data.username 
          },
        });

        if (createError) throw new Error(`Erro ao criar conta Auth: ${createError.message}`);
        targetAuthUserId = newUser.user.id;
        console.log("[DEBUG] auth_created_or_existing", { status: "created", authId: targetAuthUserId });

        // Link client
        const { error: linkErr } = await supabaseAdmin.from("clients").update({ user_id: targetAuthUserId } as any).eq("id", newClient.id);
        if (linkErr) throw new Error(`Erro ao vincular cliente novo: ${linkErr.message}`);
        console.log("[DEBUG] client_linked", { clientId: newClient.id, authId: targetAuthUserId });
      }

      // 4.2 Create/Update Profile (official structure)
      console.log("[DEBUG] profile_created_or_updated", { authId: targetAuthUserId, nickname: data.username });
      const { error: profileErr } = await supabaseAdmin.from("profiles").upsert({ 
        id: targetAuthUserId, 
        nickname: data.username, 
        full_name: data.contact_name || data.username 
      } as any);
      if (profileErr) throw new Error(`Erro ao atualizar perfil: ${profileErr.message}`);

      // 4.3 Ensure Role
      const { error: roleErr } = await supabaseAdmin.from("user_roles").upsert({ 
        user_id: targetAuthUserId, 
        role: "cliente" as any 
      }, { onConflict: "user_id,role" });
      if (roleErr) throw new Error(`Erro ao definir role: ${roleErr.message}`);

      // 4.4 Generate access link
      console.log("[DEBUG] invite_generated", { email: data.contact_email });
      const { data: linkData, error: recoveryError } = await supabaseAdmin.auth.admin.generateLink({
        type: 'recovery',
        email: data.contact_email,
        options: { redirectTo: `${process.env['SITE_URL'] || 'http://localhost:8080'}/reset-password` }
      });

      if (recoveryError) {
        console.error("[DEBUG] email_failed", { error: recoveryError.message });
        return {
          success: true,
          client: newClient,
          onboardingSuccess: false,
          message: "Cliente e acesso criados, mas não foi possível enviar o e-mail. Use 'Reenviar Acesso'."
        };
      }

      console.log("[DEBUG] email_sent", { email: data.contact_email });
      console.log("[DEBUG] onboarding_completed", { clientId: newClient.id });
      onboardingResult = { success: true, message: "Cliente cadastrado e acesso enviado por e-mail." };

    } catch (e: any) {
      console.error("[DEBUG] onboarding_error", e);
      return {
        success: true,
        client: newClient,
        onboardingSuccess: false,
        message: "Cliente cadastrado, mas não foi possível concluir a criação do acesso."
      };
    }

    return { 
      success: true, 
      client: newClient,
      onboardingSuccess: onboardingResult.success,
      message: onboardingResult.message || "Cliente cadastrado com sucesso!" 
    };
  });
