import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

// Sem chave administrativa: cada função segura do banco usa a identidade do chamador
// (admin vê tudo; vendedor só as próprias indicações).
async function call<T>(supabase: any, fn: string): Promise<T> {
  const { data, error } = await supabase.rpc(fn);
  if (error) {
    console.error(`[referral] ${fn}`, error.code);
    throw new Error(error.code === "42501" ? "Acesso negado" : "Erro ao carregar indicações");
  }
  return data as T;
}

export const getReferralToken = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) =>
    call<{ token: string | null; is_active: boolean; is_institutional: boolean; exists: boolean }>(context.supabase, "sn_get_referral_token"));

export const getReferralMetrics = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) =>
    call<{ total: number; novos: number; emNegociacao: number; convertidos: number; taxaConversao: number }>(context.supabase, "sn_referral_metrics"));

export const getReferralLeads = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => call<any[]>(context.supabase, "sn_referral_leads"));

export const getAdminReferralStats = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) =>
    call<{ total: number; performance: { name: string; total: number; convertidos: number; taxa: number }[] }>(context.supabase, "sn_admin_referral_stats"));
