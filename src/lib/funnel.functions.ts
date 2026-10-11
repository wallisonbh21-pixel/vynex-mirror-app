import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export const leadFormSchema = z.object({
  name: z.string().min(2).max(200),
  company: z.string().max(200).optional(),
  email: z.string().email().max(255),
  whatsapp: z.string().min(10).max(30),
  city: z.string().max(120),
  state: z.string().max(60),
  segment: z.string().max(120),
  serviceId: z.string().uuid(),
  referralToken: z.string().max(200).optional(),
  details: z.record(z.string(), z.any()).optional(),
});

// Público, sem chave administrativa: uma função segura do banco valida, limita abuso e grava tudo numa transação.
export const submitLeadForm = createServerFn({ method: "POST" })
  .validator((data: unknown) => leadFormSchema.parse(data))
  .handler(async ({ data }) => {
    const { publicDb, safeDbMessage } = await import("@/lib/public-db.server");
    const { data: result, error } = await publicDb().rpc("sn_submit_public_lead", {
      p_name: data.name,
      p_company: data.company ?? "",
      p_email: data.email,
      p_whatsapp: data.whatsapp,
      p_city: data.city,
      p_state: data.state,
      p_segment: data.segment,
      p_service_id: data.serviceId,
      p_referral_token: data.referralToken ?? undefined,
      p_details: (data.details ?? {}) as never,
    });
    if (error) {
      return { success: false, message: safeDbMessage(error, "Ocorreu um erro inesperado ao processar sua solicitação.") };
    }
    return result as { success: boolean; message: string; isNew: boolean; leadId?: string };
  });
