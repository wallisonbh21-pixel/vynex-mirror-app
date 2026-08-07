import crypto from "node:crypto";
export function generateInitialPassword() {
    // Gera uma senha segura de 12 caracteres (letras e números)
    // Replaced crypto.randomBytes(9).toString('base64') with something simpler for Worker compatibility if needed, 
    // though crypto is supported in nodejs_compat.
    return crypto.randomBytes(12).toString('hex').slice(0, 12);
}
export async function createAuthUser(supabaseAdmin, { email, username, fullName, role, clientId }) {
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
    if (createError)
        throw createError;
    return { user: newUser.user, initialPassword };
}
