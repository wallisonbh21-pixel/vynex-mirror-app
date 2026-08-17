import { createServerFn } from "@tanstack/react-start";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export const getAdminDashboardData = createServerFn({ method: "GET" })
  .handler(async () => {
    // 1. Receita e MRR (Contratos Ativos)
    const { data: contracts } = await supabaseAdmin
      .from("contracts")
      .select("amount, monthly_fee, signed_at, status");

    const activeContracts = contracts?.filter(c => c.status === 'ativo') || [];
    const revenueTotal = activeContracts.reduce((acc, c) => acc + (Number(c.amount) || 0), 0);
    const mrrTotal = activeContracts.reduce((acc, c) => acc + (Number(c.monthly_fee) || 0), 0);

    // 2. Comissões a Pagar
    const { data: commissions } = await supabaseAdmin
      .from("commissions" as any)
      .select("amount, status");
    
    const commissionsToPay = (commissions as any[])?.filter(c => c.status === 'pendente')
      .reduce((acc, c) => acc + (Number(c.amount) || 0), 0) || 0;

    // 3. Funil de Leads
    const { data: leads } = await supabaseAdmin
      .from("leads")
      .select("status");
    
    const funnel: Record<string, number> = {};
    leads?.forEach(l => {
      if (l.status) funnel[l.status] = (funnel[l.status] || 0) + 1;
    });

    // 4. Contratos Recentes
    const { data: recentContracts } = await supabaseAdmin
      .from("contracts")
      .select("*, clients(company), profiles:owner_id(full_name)")
      .order("created_at", { ascending: false })
      .limit(5);

    // 5. Destaques do Time (Vendedores)
    // Agrupamento manual dos contratos por vendedor
    const sellerPerformance: Record<string, { name: string, count: number, value: number }> = {};
    activeContracts.forEach(c => {
      const ownerId = (c as any).owner_id;
      if (!ownerId) return;
      if (!sellerPerformance[ownerId]) {
        sellerPerformance[ownerId] = { name: "Vendedor", count: 0, value: 0 };
      }
      sellerPerformance[ownerId].count++;
      sellerPerformance[ownerId].value += Number(c.amount) || 0;
    });

    return {
      stats: {
        revenue: revenueTotal,
        activeContractsCount: activeContracts.length,
        mrr: mrrTotal,
        commissionsPending: commissionsToPay,
      },
      funnel,
      recentContracts: recentContracts || [],
      highlights: Object.values(sellerPerformance).sort((a, b) => b.value - a.value).slice(0, 3)
    };
  });
