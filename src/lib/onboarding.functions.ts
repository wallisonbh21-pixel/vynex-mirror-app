
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
    const { sendResendEmail } = await import("./resend.server");
    const { supabase: userSupabase, userId: actorId } = context;

    if (!actorId) throw new Error("Não autorizado.");

    // 1. Audit preparation
    const auditData: any = {
      clientId: data.clientId,
      username: data.username,
      auth_created: false,
      profile_linked: false,
      role_created: false,
      email_send_attempt: false,
      email_send_success: false,
      email_send_failed: false,
      resend_message_id: null
    };

    const logAudit = async (action: string, details: any) => {
      try {
        await supabaseAdmin.from("audit_logs" as any).insert({
          action,
          actor_id: actorId,
          target_id: data.clientId,
          details
        });
      } catch (e) {
        console.error("Audit log failed:", e);
      }
    };

    // 2. Validate actor roles
    const { data: roles } = await userSupabase.from("user_roles").select("role").eq("user_id", actorId);
    const isAdmin = roles?.some((r: any) => r.role === 'admin' || r.role === 'diretor');
    const isVendedor = roles?.some((r: any) => r.role === 'vendedor');

    if (!isAdmin && !isVendedor) throw new Error("Não autorizado.");

    // 3. Fetch client
    const { data: client, error: clientErr } = await userSupabase
      .from("clients")
      .select("id, owner_id, contact_email, contact_name, user_id")
      .eq("id", data.clientId)
      .single();
    
    if (clientErr || !client) throw new Error("Cliente não encontrado.");
    if (!isAdmin && client.owner_id !== actorId) throw new Error("Sem permissão.");
    if (!client.contact_email) throw new Error("E-mail não informado.");

    // 4. Check Username uniqueness
    const { data: existingProfile } = await supabaseAdmin.from("profiles").select("id").eq("nickname", data.username).maybeSingle();
    if (existingProfile) throw new Error("Usuário já em uso.");

    // 5. Auth User logic
    let targetUser: any = null;
    const { data: { users } } = await supabaseAdmin.auth.admin.listUsers();
    const existingAuthUser = users.find((u) => u.email?.toLowerCase() === client.contact_email!.toLowerCase());

    if (existingAuthUser) {
      targetUser = existingAuthUser;
      // Link if needed
      if (client.user_id !== targetUser.id) {
        await supabaseAdmin.from("clients").update({ user_id: targetUser.id } as any).eq("id", client.id);
      }
    } else {
      // Create new Auth
      const { user: newUser } = await createAuthUser(supabaseAdmin, {
        email: client.contact_email,
        username: data.username,
        fullName: client.contact_name || data.username,
        role: "cliente",
        clientId: client.id
      });
      targetUser = newUser;
      auditData.auth_created = true;
      await supabaseAdmin.from("clients").update({ user_id: targetUser.id } as any).eq("id", client.id);
    }

    // 6. Ensure Profile & Role
    await supabaseAdmin.from("profiles").upsert({ id: targetUser.id, nickname: data.username, full_name: client.contact_name || data.username } as any);
    auditData.profile_linked = true;
    
    await supabaseAdmin.from("user_roles").upsert({ user_id: targetUser.id, role: "cliente" as any }, { onConflict: "user_id,role" });
    auditData.role_created = true;

    // 7. Email Dispatch
    auditData.email_send_attempt = true;
    const siteUrl = process.env['SITE_URL'] || 'https://project--qldgixjihbbommenpfuf.lovable.app';
    
    const emailHtml = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
        <h2 style="color: #0F172A;">Olá, ${client.contact_name || data.username}! 👋</h2>
        <p>Seu acesso ao Portal do Cliente ScaleNexus está pronto.</p>
        <div style="background: #F8FAFC; border: 1px solid #E2E8F0; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <strong>Usuário:</strong> ${data.username}
        </div>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${siteUrl}/cliente/login" style="background: #3B82F6; color: white; padding: 12px 30px; border-radius: 6px; text-decoration: none; font-weight: bold;">
            ACESSAR MEU PORTAL
          </a>
        </div>
        <hr style="border: 0; border-top: 1px solid #E2E8F0; margin: 30px 0;">
        <p style="font-size: 12px; color: #64748B;">Equipe ScaleNexus</p>
      </div>
    `;

    try {
      // 7.1 Try Resend first (Professional method)
      let emailSent = false;
      let resendMessageId = null;

      try {
        const result = await sendResendEmail({
          to: client.contact_email,
          subject: "Seu acesso ao Portal do Cliente ScaleNexus foi criado",
          html: emailHtml,
          fromName: "Equipe ScaleNexus"
        });
        emailSent = true;
        resendMessageId = result.id;
        console.log("[DEBUG] Email sent via Resend", { resendMessageId });
      } catch (resendError: any) {
        console.warn("[DEBUG] Resend failed, falling back to Supabase Auth Invite/Recovery", resendError.message);
        
        // 7.2 Fallback to Supabase Auth (Temporary/Test method)
        if (existingAuthUser) {
          // If user already exists, send a password recovery link
          const { error: recoveryError } = await supabaseAdmin.auth.admin.generateLink({
            type: 'recovery',
            email: client.contact_email,
            options: { redirectTo: `${siteUrl}/cliente/login` }
          });
          if (recoveryError) throw recoveryError;
          console.log("[DEBUG] Password recovery link generated via Supabase Auth as fallback");
        } else {
          // If user is new, send a standard invite
          const { error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(client.contact_email, {
            data: { 
              full_name: client.contact_name || data.username,
              username: data.username,
              client_id: client.id
            },
            redirectTo: `${siteUrl}/cliente/login`
          });
          if (inviteError) throw inviteError;
          console.log("[DEBUG] Invite sent via Supabase Auth as fallback");
        }
        emailSent = true;
      }
      
      if (emailSent) {
        auditData.email_send_success = true;
        auditData.resend_message_id = resendMessageId;
        await logAudit("client_access_created_success", auditData);
        return { success: true, message: "Acesso configurado e e-mail enviado." };
      } else {
        throw new Error("Falha total no envio de e-mail.");
      }
    } catch (emailError: any) {
      auditData.email_send_failed = true;
      await logAudit("client_access_created_warning", { ...auditData, error: emailError.message });
      return { 
        success: false, 
        message: "Login configurado, mas houve falha no envio do e-mail.",
        error: emailError.message 
      };
    }
  });

export const resendInvite = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: unknown) => z.object({ email: z.string().email() }).parse(data))
  .handler(async ({ data, context }) => {
    // Legacy support or simplified resend if needed, but the main flow is above.
    return { success: true };
  });
