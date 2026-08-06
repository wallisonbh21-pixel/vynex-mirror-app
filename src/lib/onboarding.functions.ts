import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const createClientAccountSchema = z.object({
  email: z.string().email(),
  fullName: z.string().min(2),
  clientId: z.string().uuid(),
  username: z.string().min(3),
});

export const createClientPortalAccount = createServerFn({ method: "POST" })
  .validator((data: unknown) => createClientAccountSchema.parse(data))
  .handler(async ({ data }: { data: z.infer<typeof createClientAccountSchema> }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // 1. Check if username or email already exists in Auth
    const { data: existingUserList } = await supabaseAdmin.auth.admin.listUsers();
    let user = existingUserList.users.find((u) => u.email === data.email);
    
    // Check if username is taken in user_metadata or profiles
    const { data: existingProfile } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .eq("nickname", data.username)
      .maybeSingle();
      
    if (existingProfile) throw new Error("Este nome de usuário já está em uso.");

    if (!user) {
      // 2. Create new user with invite mechanism
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

      // Send invite/reset password email
      await supabaseAdmin.auth.admin.generateLink({
        type: 'recovery',
        email: data.email,
        options: {
          redirectTo: `${process.env['SITE_URL'] || 'http://localhost:8080'}/cliente/reset-password`
        }
      });
    }

    if (!user) throw new Error("Falha ao criar ou localizar usuário.");

    // 3. Assign 'cliente' role with 'pendente' status
    const { error: roleError } = await supabaseAdmin
      .from("user_roles")
      .upsert({ 
        user_id: user.id, 
        role: "cliente" as any,
        status: "pendente" as any 
      }, { onConflict: "user_id,role" });

    if (roleError) throw roleError;

    // 4. Link auth user to client record
    const { error: linkError } = await supabaseAdmin
      .from("clients")
      .update({ user_id: user.id } as any)
      .eq("id", data.clientId);

    if (linkError) throw linkError;

    // 5. Create Profile if missing
    await supabaseAdmin.from("profiles").upsert({
      id: user.id,
      full_name: data.fullName,
      nickname: data.username
    });

    // 6. Audit log
    // We can't easily get the calling user in a server function without extra context or middleware
    // but we can try to get it from auth.uid() in SQL if we had a trigger.
    // For now, let's just log the action.
    await supabaseAdmin.from("audit_logs").insert({
      action: "criação de acesso",
      target_id: user.id,
      details: { client_id: data.clientId, email: data.email }
    });

    return { 
      success: true, 
      userId: user.id,
      message: "Acesso ao portal configurado com sucesso. Convite enviado."
    };
  });

export const updateLoginStatus = createServerFn({ method: "POST" })
  .validator((data: unknown) => z.object({ userId: z.string(), status: z.string() }).parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("user_roles")
      .update({ status: data.status as any } as any)
      .eq("user_id", data.userId)
      .eq("role", "cliente");
    
    if (error) throw error;
    
    return { success: true };
  });

export const resendInvite = createServerFn({ method: "POST" })
  .validator((data: unknown) => z.object({ email: z.string().email() }).parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
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

