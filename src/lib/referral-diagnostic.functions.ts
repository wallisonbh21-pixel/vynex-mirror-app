import { createServerFn } from "@tanstack/react-start";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { z } from "zod";

export const runDiagnosticDirect = createServerFn({ method: "POST" })
  .validator((data: { userId?: string }) => z.object({
    userId: z.string().uuid().optional()
  }).parse(data))
  .handler(async ({ data }) => {
    let { userId } = data;

    // Se não veio no data, tenta pegar do contexto (caso o middleware tenha funcionado no server)
    // Mas aqui o foco é o diagnóstico manual
    
    if (!userId) {
        // Tenta pegar o primeiro vendedor para o relatório de auditoria não ser vazio
        const { data: firstVendedor } = await supabaseAdmin
            .from("user_roles")
            .select("user_id")
            .eq("role", "vendedor")
            .limit(1)
            .maybeSingle();
        
        userId = firstVendedor?.user_id;
    }

    if (!userId) return { error: "Nenhum vendedor encontrado no banco para diagnosticar." };

    try {
      const { data: roles } = await supabaseAdmin
        .from("user_roles")
        .select("role")
        .eq("user_id", userId);
      
      const userRoles = roles?.map((r: any) => r.role) || [];
      const isVendedor = userRoles.includes("vendedor");
      const isAdmin = userRoles.includes("admin") || userRoles.includes("diretor");

      const { data: profile } = await supabaseAdmin
        .from("profiles")
        .select("id")
        .eq("id", userId)
        .maybeSingle();

      const { data: sellerToken, error: sellerTokenError } = await supabaseAdmin
        .from("referral_tokens")
        .select("*")
        .eq("seller_id", userId)
        .maybeSingle();

      const { data: instToken } = await supabaseAdmin
        .from("referral_tokens")
        .select("*")
        .eq("is_institutional", true)
        .maybeSingle();

      const { count: totalTokens } = await supabaseAdmin
        .from("referral_tokens")
        .select("*", { count: "exact", head: true });
      
      const { count: totalVendedores } = await supabaseAdmin
        .from("user_roles")
        .select("*", { count: "exact", head: true })
        .eq("role", "vendedor");

      const { data: allTokens } = await supabaseAdmin
        .from("referral_tokens")
        .select("seller_id, is_active, is_institutional");

      const validSellerIds = allTokens?.filter((t: any) => t.seller_id && !t.is_institutional).length || 0;
      const activeTokens = allTokens?.filter((t: any) => t.is_active).length || 0;

      const diagnostic = {
        userId,
        userRoles,
        isVendedor,
        isAdmin,
        profileExists: !!profile,
        sellerTokenExists: !!sellerToken,
        sellerTokenActive: sellerToken?.is_active,
        sellerTokenError: sellerTokenError ? {
            message: sellerTokenError.message,
            code: sellerTokenError.code,
            details: sellerTokenError.details,
            hint: sellerTokenError.hint
        } : null,
        instTokenExists: !!instToken,
        instTokenActive: instToken?.is_active,
        audit: {
            totalVendedores,
            totalTokens,
            validSellerIds,
            activeTokens
        }
      };

      console.log("REFERRAL_TOKEN_DIAGNOSTIC_SERVER_LOG:", diagnostic);
      
      return diagnostic;
    } catch (e: any) {
      return { error: e.message };
    }
  });
