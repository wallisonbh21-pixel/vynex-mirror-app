import { SupabaseCliente } from "@supabase/supabase-js";
import crypto from "node:crypto";

export function generateInitialPassword(): string {
  // Gera uma senha segura de 12 caracteres (letras e números)
  // Replaced crypto.randomBytes(9).toString('base64') with something simpler for Worker compatibility if needed, 
  // though crypto is supported in nodejs_compat.
  return crypto.randomBytes(12).toString('hex').slice(0, 12);
}

export async function createAuthUsuário(
  supabaseAdmin: SupabaseCliente,
  { email, username, fullName, role, clientId }: { 
    email: string; 
    username: string; 
    fullName: string; 
    role: string;
    clientId?: string;
  }
) {
  const initialPassword = generateInitialPassword();

  const { data: newUsuário, error: createError } = await supabaseAdmin.auth.admin.createUsuário({
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

  return { user: newUsuário.user, initialPassword };
}
