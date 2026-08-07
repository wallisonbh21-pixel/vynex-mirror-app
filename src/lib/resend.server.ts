
import { z } from "zod";

const RESEND_GATEWAY_URL = "https://connector-gateway.lovable.dev/resend/emails";

export const sendEmailSchema = z.object({
  to: z.string().email(),
  subject: z.string(),
  html: z.string(),
  fromName: z.string().optional().default("Equipe ScaleNexus"),
});

export type SendEmailInput = z.infer<typeof sendEmailSchema>;

/**
 * Sends an email using the linked Resend connection via Lovable Connector Gateway.
 * This is server-side only.
 */
export async function sendResendEmail(input: SendEmailInput) {
  const lovableApiKey = process.env.LOVABLE_API_KEY;
  const resendApiKey = process.env.RESEND_API_KEY;

  if (!lovableApiKey || !resendApiKey) {
    console.error("[RESEND] Missing API keys", { 
      hasLovableKey: !!lovableApiKey, 
      hasResendKey: !!resendApiKey 
    });
    throw new Error("Configuração de e-mail (Resend) não encontrada no servidor.");
  }

  const payload = {
    from: `${input.fromName} <onboarding@resend.dev>`, // Resend default if domain not verified
    to: [input.to],
    subject: input.subject,
    html: input.html,
  };

  console.log("[RESEND] email_send_attempt", { to: input.to, subject: input.subject });

  try {
    const response = await fetch(RESEND_GATEWAY_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${lovableApiKey}`,
        "X-Connection-Api-Key": resendApiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const responseData = await response.json();

    if (!response.ok) {
      console.error("[RESEND] email_send_failed", { 
        status: response.status, 
        data: responseData,
        to: input.to 
      });
      throw new Error(responseData?.message || `Erro ao enviar e-mail (${response.status})`);
    }

    console.log("[RESEND] email_send_success", { id: responseData.id, to: input.to });
    return responseData;
  } catch (error: any) {
    console.error("[RESEND] transport_error", error);
    throw error;
  }
}
