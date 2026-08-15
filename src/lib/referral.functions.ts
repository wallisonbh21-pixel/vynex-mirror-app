import { createServerFn } from "@tanstack/react-start";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const getReferralToken = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const userId = context.userId;
    
    // 1. Verificar papéis do usuário
    const { data: roles } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", userId);
    
    const userRoles = roles?.map(r => r.role) || [];
    const isAdmin = userRoles.includes("admin") || userRoles.includes("diretor");

    // 2. Buscar token (Institucional para Admin, Pessoal para Vendedor)
    let query = supabaseAdmin
      .from("referral_tokens")
      .select("token, is_active, is_institutional")
      .eq("is_active", true);

    if (isAdmin) {
      query = query.eq("is_institutional", true);
    } else {
      query = query.eq("seller_id", userId).eq("is_institutional", false);
    }

    const { data: token, error } = await query.maybeSingle();

    if (error) {
      console.error("Error fetching referral token:", error);
      throw new Error("Erro ao carregar link de indicação");
    }

    // 3. Retorno serializável e limpo
    if (!token) {
      return {
        token: null,
        is_active: false,
        is_institutional: false,
        exists: false
      };
    }

    return {
      token: token.token,
      is_active: token.is_active,
      is_institutional: token.is_institutional,
      exists: true
    };
  });

export const getReferralMetrics = createServerFn({ method: "GET" })
  .handler(async ({ context }) => {
    const userId = (context as any).userId;
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
    }

    const { data: attributionData, error } = await query;
    if (error) throw error;

    const leads = (attributionData as any[])?.map(a => a.leads).filter(Boolean) || [];
    const total = leads.length;
    const novos = leads.filter(l => l.status === "novo").length;
    const emNegociacao = leads.filter(l => ["contatado", "interessado", "proposta", "negociacao"].includes(l.status)).length;
    const convertidos = leads.filter(l => l.status === "fechado").length;
    const taxaConversao = total > 0 ? Math.round((convertidos / total) * 100) : 0;

    return { total, novos, emNegociacao, convertidos, taxaConversao };
  });

export const getReferralLeads = createServerFn({ method: "GET" })
  .handler(async ({ context }) => {
    const userId = (context as any).userId;
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
        current_responsible_id,
        attributed_at
      `)
      .order("attributed_at", { ascending: false });

    if (!isAdmin) {
      query = query.eq("originator_id", userId);
    }

    const { data: attributions, error: attrError } = await query;
    if (attrError) throw attrError;
    if (!attributions || attributions.length === 0) return [];

    const leadIds = attributions.map(a => a.lead_id);
    const responsibleIds = Array.from(new Set(attributions.map(a => a.current_responsible_id).filter((id): id is string => !!id)));

    const { data: leads } = await supabaseAdmin
      .from("leads")
      .select("id, name, company, status, created_at, niche")
      .in("id", leadIds);

    const { data: profiles } = await supabaseAdmin
      .from("profiles")
      .select("id, full_name, nickname")
      .in("id", responsibleIds);

    return attributions.map(attr => {
      const lead = leads?.find(l => l.id === attr.lead_id);
      const responsible = profiles?.find(p => p.id === attr.current_responsible_id);
      return {
        ...attr,
        leads: lead,
        current_responsible: responsible
      };
    });
  });

export const getAdminReferralStats = createServerFn({ method: "GET" })
  .handler(async ({ context }) => {
    const userId = (context as any).userId;
    if (!userId) throw new Error("Não autorizado");

    const { data: roles } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", userId);
    
    const isAdmin = roles?.some(r => r.role === "admin" || r.role === "diretor");
    if (!isAdmin) throw new Error("Acesso negado");

    const { data: leads } = await supabaseAdmin
      .from("leads")
      .select("status");
    
    const total = leads?.length || 0;
    
    const { data: sellers } = await supabaseAdmin
      .from("profiles")
      .select("id, full_name, nickname");
    
    const { data: allAttributions } = await supabaseAdmin
      .from("lead_attribution")
      .select("originator_id, lead_id, leads(status)");

    const performance = sellers?.map(s => {
      const sAttributions = (allAttributions as any[])?.filter(a => a.originator_id === s.id) || [];
      const sLeads = sAttributions.map(a => a.leads).filter(Boolean);
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
