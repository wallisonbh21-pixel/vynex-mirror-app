import { SupabaseClient } from "@supabase/supabase-js";
import { crypto } from "node:crypto";

export function generateInitialPassword(): string {
  // Gera uma senha segura de 12 caracteres (letras e números)
  return Array.from(crypto.randomBytes(9))
    .map(b => b.toString(36))
    .join('')
    .slice(0, 12);
}

export async function createAuthUser(
  supabaseAdmin: SupabaseClient,
  { email, username, fullName, role, clientId }: { 
    email: string; 
    username: string; 
    fullName: string; 
    role: string;
    clientId?: string;
  }
) {
  const initialPassword = generateInitialPassword();

  const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password: initialPassword,
    email_confirm: true,
    user_metadata: {
      full_name: fullName,
      role: role,
      username: username,
      client_id: clientId,
      must_change_password: true
    },
  });

  if (createError) throw createError;

  return { user: newUser.user, initialPassword };
}
