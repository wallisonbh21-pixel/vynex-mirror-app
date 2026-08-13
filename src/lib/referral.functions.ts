import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export const getReferralToken = createServerFn({ method: "GET" })
  .handler(async ({ context }) => {
    const { userId } = context;
    if (!userId) throw new Error("Não autorizado");

    // Verificar papéis do usuário
    const { data: roles } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", userId);
    
    const userRoles = roles?.map(r => r.role) || [];
    const isAdmin = userRoles.includes("admin") || userRoles.includes("diretor");

    if (isAdmin) {
      // Admin vê o token institucional
      const { data: token } = await supabaseAdmin
        .from("referral_tokens")
        .select("*")
        .eq("is_institutional", true)
        .eq("is_active", true)
        .maybeSingle();
      
      return token;
    }

    // Vendedor vê seu próprio token
    const { data: token } = await supabaseAdmin
      .from("referral_tokens")
      .select("*")
      .eq("seller_id", userId)
      .eq("is_active", true)
      .maybeSingle();
    
    return token;
  });

export const getReferralMetrics = createServerFn({ method: "GET" })
  .handler(async ({ context }) => {
    const { userId } = context;
    if (!userId) throw new Error("Não autorizado");

    const { data: roles } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", userId);
    
    const userRoles = roles?.map(r => r.role) || [];
    const isAdmin = userRoles.includes("admin") || userRoles.includes("diretor");

    let query = supabaseAdmin
      .from("lead_attribution")
      .select("lead_id, leads(status)");
    
    if (!isAdmin) {
      query = query.eq("originator_id", userId);
    } else {
      // Para admin, se quisermos a visão institucional, podemos filtrar por onde referral_token_id é institucional
      // Mas o plano pede visão global + institucional. Vamos pegar tudo.
    }

    const { data: attributionData, error } = await query;
    if (error) throw error;

    const leads = attributionData?.map(a => (a.leads as any)) || [];
    const total = leads.length;
    const novos = leads.filter(l => l.status === "novo").length;
    const emNegociacao = leads.filter(l => ["contatado", "interessado", "proposta", "negociacao"].includes(l.status)).length;
    const convertidos = leads.filter(l => l.status === "fechado").length;
    const taxaConversao = total > 0 ? Math.round((convertidos / total) * 100) : 0;

    return { total, novos, emNegociacao, convertidos, taxaConversao };
  });

export const getReferralLeads = createServerFn({ method: "GET" })
  .handler(async ({ context }) => {
    const { userId } = context;
    if (!userId) throw new Error("Não autorizado");

    const { data: roles } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", userId);
    
    const userRoles = roles?.map(r => r.role) || [];
    const isAdmin = userRoles.includes("admin") || userRoles.includes("diretor");

    let query = supabaseAdmin
      .from("lead_attribution")
      .select(`
        lead_id,
        originator_id,
        leads (
          id,
          name,
          company,
          status,
          created_at,
          niche
        ),
        current_responsible:profiles!lead_attribution_current_responsible_id_fkey (
          full_name,
          nickname
        )
      `)
      .order("attributed_at", { ascending: false });

    if (!isAdmin) {
      query = query.eq("originator_id", userId);
    }

    const { data, error } = await query;
    if (error) throw error;

    return data;
  });

export const getAdminReferralStats = createServerFn({ method: "GET" })
  .handler(async ({ context }) => {
    const { userId } = context;
    if (!userId) throw new Error("Não autorizado");

    const { data: leads } = await supabaseAdmin
      .from("leads")
      .select("status");
    
    const total = leads?.length || 0;
    const convertidos = leads?.filter(l => l.status === "fechado").length || 0;
    
    const { data: sellersStats } = await supabaseAdmin
      .from("profiles")
      .select(`
        id,
        full_name,
        nickname,
        lead_attribution!lead_attribution_originator_id_fkey (
          id,
          leads(status)
        )
      `);

    const performance = sellersStats?.map(s => {
      const attributions = (s.lead_attribution as any[]) || [];
      const sLeads = attributions.map(a => a.leads);
      const sTotal = sLeads.length;
      const sConvertidos = sLeads.filter(l => l.status === "fechado").length;
      return {
        name: s.nickname || s.full_name || "Vendedor",
        total: sTotal,
        convertidos: sConvertidos,
        taxa: sTotal > 0 ? Math.round((sConvertidos / sTotal) * 100) : 0
      };
    }).filter(s => s.total > 0) || [];

    return { total, performance };
  });
