import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const createClientAccountSchema = z.object({
  email: z.string().email(),
  fullName: z.string().min(2),
  clientId: z.string().uuid(),
});

export const createClientPortalAccount = createServerFn({ method: "POST" })
  .validator((data: unknown) => createClientAccountSchema.parse(data))
  .handler(async ({ data }: { data: z.infer<typeof createClientAccountSchema> }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // 1. Check if user already exists
    const { data: existingUser } = await supabaseAdmin.auth.admin.listUsers();
    let user = existingUser.users.find((u) => u.email === data.email);

    if (!user) {
      // 2. Create new user if not exists
      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email: data.email,
        email_confirm: true,
        user_metadata: { full_name: data.fullName, role: "cliente" },
      });

      if (createError) throw createError;
      user = newUser.user;
    }

    if (!user) throw new Error("Falha ao criar ou localizar usuário.");

    // 3. Assign 'cliente' role
    const { error: roleError } = await supabaseAdmin
      .from("user_roles")
      .upsert({ user_id: user.id, role: "cliente" as any }, { onConflict: "user_id,role" });

    if (roleError) throw roleError;

    // 4. Link auth user to client record
    const { error: linkError } = await supabaseAdmin
      .from("clients")
      .update({ user_id: user.id } as any)
      .eq("id", data.clientId);

    if (linkError) throw linkError;

    return { 
      success: true, 
      userId: user.id,
      message: "Acesso ao portal configurado com sucesso."
    };
  });
