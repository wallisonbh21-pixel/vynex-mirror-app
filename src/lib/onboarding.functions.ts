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

    // 3. Search for Auth user by email
    const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers();
    if (listError) throw new Error(`Erro ao listar usuários: ${listError.message}`);
    
    const existingAuthUser = users.find((u) => u.email?.toLowerCase() === client.contact_email!.toLowerCase());
    
    if (existingAuthUser) {
      // Link if not linked
      if (client.user_id !== existingAuthUser.id) {
        await supabaseAdmin.from("clients").update({ user_id: existingAuthUser.id } as any).eq("id", client.id);
      }
      return { success: true, message: "Conta já existente vinculada com sucesso." };
    }

    // 4. Create new account
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

    // Send email
    const siteUrl = process.env['SITE_URL'] || 'http://localhost:8080';
    await supabaseAdmin.auth.admin.inviteUserByEmail(client.contact_email, {
      redirectTo: `${siteUrl}/reset-password`,
      data: { 
        temp_password: initialPassword,
        is_new_client: true,
        platform_url: `${siteUrl}/auth`
      }
    });

    return { success: true, message: "Acesso criado e credenciais enviadas." };
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
