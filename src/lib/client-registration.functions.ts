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
    const { createAuthUser } = await import("./auth-utils.server");
    const { userId: actorId, supabase: userSupabase } = context;

    if (!actorId) throw new Error("Não autorizado.");

    // Determine actor role
    const { data: roles } = await userSupabase.from("user_roles").select("role").eq("user_id", actorId);
    const isAdmin = roles?.some((r: any) => r.role === 'admin' || r.role === 'diretor');
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

    // 3. AUTOMATIC ONBOARDING: Create access portal account
    try {
      // Check if Auth user already exists
      const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers();
      if (listError) throw new Error(`Erro ao listar usuários: ${listError.message}`);
      
      const existingAuthUser = users.find(u => u.email?.toLowerCase() === data.contact_email.toLowerCase());

      if (existingAuthUser) {
        // Link existing Auth
        const { error: linkErr } = await supabaseAdmin.from("clients").update({ user_id: existingAuthUser.id } as any).eq("id", newClient.id);
        if (linkErr) throw new Error(`Erro ao vincular cliente: ${linkErr.message}`);
        
        return {
          success: true,
          client: newClient,
          onboardingSuccess: true,
          message: "Cliente cadastrado e vinculado à conta de acesso existente."
        };
      } else {
        // Create new Auth account with normal password
        const { user: newUser, initialPassword } = await createAuthUser(supabaseAdmin, {
          email: data.contact_email,
          username: data.username,
          fullName: data.contact_name || data.username,
          role: "cliente",
          clientId: newClient.id
        });

        // Link client
        const { error: linkErr } = await supabaseAdmin.from("clients").update({ user_id: newUser.id } as any).eq("id", newClient.id);
        if (linkErr) throw new Error(`Erro ao vincular cliente novo: ${linkErr.message}`);

        // Ensure Profile
        await supabaseAdmin.from("profiles").upsert({ 
          id: newUser.id, 
          nickname: data.username, 
          full_name: data.contact_name || data.username 
        } as any);

        // Ensure Role
        await supabaseAdmin.from("user_roles").upsert({ 
          user_id: newUser.id, 
          role: "cliente" as any 
        }, { onConflict: "user_id,role" });

        // Trigger email with credentials
        const siteUrl = process.env['SITE_URL'] || 'http://localhost:8080';
        const { error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(data.contact_email, {
          redirectTo: `${siteUrl}/reset-password`,
          data: { 
            temp_password: initialPassword,
            is_new_client: true,
            platform_url: `${siteUrl}/auth`
          }
        });

        if (inviteError) {
          console.error("[DEBUG] email_send_failed", inviteError);
          return {
            success: true,
            client: newClient,
            onboardingSuccess: false,
            message: "Cliente cadastrado, mas o e-mail de boas-vindas falhou. Comunique as credenciais manualmente."
          };
        }

        return { 
          success: true, 
          client: newClient,
          onboardingSuccess: true,
          message: "Cliente cadastrado e credenciais enviadas por e-mail." 
        };
      }
    } catch (e: any) {
      console.error("[DEBUG] onboarding_error", e);
      return {
        success: true,
        client: newClient,
        onboardingSuccess: false,
        message: "Cliente cadastrado comercialmente, mas ocorreu um erro no acesso."
      };
    }
  });
