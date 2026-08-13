import { createServerFn } from "@tanstack/react-start";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export const runDiagnosticDirect = createServerFn({ method: "POST" })
  .handler(async ({ context }) => {
    // Tenta pegar o userId do contexto injetado pelo middleware
    let userId = (context as any).userId;
    
    // Se falhar, tenta extrair do header Authorization manualmente para diagnóstico
    if (!userId) {
       console.log("DIAGNOSTIC: userId não encontrado no contexto. Verificando headers...");
       // Note: em createServerFn, o request está disponível no context
       const request = (context as any).request;
       if (request) {
           const authHeader = request.headers.get("Authorization");
           console.log("DIAGNOSTIC: Authorization Header presente:", !!authHeader);
       }
    }

    if (!userId) return { error: "Sem userId no contexto" };

    try {
      // 1. Verificar roles
      const { data: roles } = await supabaseAdmin
        .from("user_roles")
        .select("role")
        .eq("user_id", userId);
      
      const userRoles = roles?.map(r => r.role) || [];
      const isVendedor = userRoles.includes("vendedor");
      const isAdmin = userRoles.includes("admin") || userRoles.includes("diretor");

      // 2. Verificar Profile
      const { data: profile } = await supabaseAdmin
        .from("profiles")
        .select("id")
        .eq("id", userId)
        .maybeSingle();

      // 3. Verificar Token do Vendedor
      const { data: sellerToken, error: sellerTokenError } = await supabaseAdmin
        .from("referral_tokens")
        .select("*")
        .eq("seller_id", userId)
        .maybeSingle();

      // 4. Verificar Token Institucional
      const { data: instToken } = await supabaseAdmin
        .from("referral_tokens")
        .select("*")
        .eq("is_institutional", true)
        .maybeSingle();

      // 5. Auditoria de Tokens
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

      const validSellerIds = allTokens?.filter(t => t.seller_id && !t.is_institutional).length || 0;
      const activeTokens = allTokens?.filter(t => t.is_active).length || 0;

      // Log para o console do servidor conforme solicitado no item 6
      if (sellerTokenError) {
          console.error("REFERRAL_TOKEN_ERROR:", {
              message: sellerTokenError.message,
              code: sellerTokenError.code,
              details: sellerTokenError.details,
              hint: sellerTokenError.hint
          });
      }

      return {
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
    } catch (e: any) {
      return { error: e.message };
    }
  });
