import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/lib/auth";

/**
 * Camada de leitura das comissões pessoais.
 * Nenhuma regra nova de cálculo é criada aqui: reaproveitamos os percentuais
 * definidos pelo ADMIN (profiles.commission_rate e projects.commission_rate).
 * Todas as consultas são filtradas pelo usuário autenticado e continuam
 * protegidas pelas policies existentes no banco.
 */

export type CommissionRow = {
  id: string;
  date: string;
  client: string;
  reference: string;
  type: string;
  rate: number;
  amount: number;
  base: number;
  status: "pendente" | "disponivel" | "pago";
};

export type WithdrawalRow = {
  id: string;
  amount: number;
  pix_key: string | null;
  status: string;
  paid_at: string | null;
  created_at: string;
};

/** Saques do usuário logado (RLS já restringe ao próprio usuário). */
export function useMyWithdrawals() {
  const { user } = useSession();
  return useQuery({
    queryKey: ["withdrawals", "meus", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("withdrawals")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as WithdrawalRow[];
    },
  });
}

type ContractRow = {
  id: string;
  title: string;
  amount: number;
  monthly_fee: number;
  status: string;
  signed_at: string;
  created_at: string;
  client_id: string | null;
  clients: { company: string | null } | null;
};

/** Comissões/bônus do VENDEDOR — derivadas dos contratos que ele fechou. */
export function useSellerCommissions() {
  const { user } = useSession();
  return useQuery({
    queryKey: ["commissions", "vendedor", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const [{ data: profile, error: profileError }, { data: contracts, error }] = await Promise.all([
        supabase.from("profiles").select("commission_rate").eq("id", user!.id).maybeSingle(),
        supabase
          .from("contracts")
          .select("id,title,amount,monthly_fee,status,signed_at,created_at,client_id,clients(company)")
          .eq("owner_id", user!.id)
          .order("signed_at", { ascending: false }),
      ]);
      if (profileError) throw profileError;
      if (error) throw error;

      const rate = Number((profile as { commission_rate?: number } | null)?.commission_rate ?? 0);
      const rows: CommissionRow[] = ((contracts ?? []) as unknown as ContractRow[]).map((contract) => ({
        id: contract.id,
        date: contract.signed_at ?? contract.created_at,
        client: contract.clients?.company ?? "Cliente não informado",
        reference: contract.title,
        type: "Bônus de venda",
        rate,
        base: Number(contract.amount),
        amount: (Number(contract.amount) * rate) / 100,
        status:
          contract.status === "encerrado"
            ? "pago"
            : contract.status === "ativo"
              ? "disponivel"
              : "pendente",
      }));
      return rows;
    },
  });
}

type ProjectRow = {
  id: string;
  title: string;
  status: string;
  value: number;
  commission: number;
  commission_rate: number;
  commission_status: string;
  delivered_at: string | null;
  assigned_at: string | null;
  created_at: string;
  clients: { company: string | null } | null;
};

/** Comissões do CRIADOR — derivadas dos projetos atribuídos a ele. */
export function useCreatorCommissions() {
  const { user } = useSession();
  return useQuery({
    queryKey: ["commissions", "criador", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select(
          "id,title,status,value,commission,commission_rate,commission_status,delivered_at,assigned_at,created_at,clients(company)",
        )
        .eq("creator_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;

      const projects = (data ?? []) as unknown as ProjectRow[];
      const rows: CommissionRow[] = projects.map((project) => ({
        id: project.id,
        date: project.delivered_at ?? project.assigned_at ?? project.created_at,
        client: project.clients?.company ?? "Cliente não informado",
        reference: project.title,
        type: "Comissão de criação",
        rate: Number(project.commission_rate),
        base: Number(project.value),
        amount:
          Number(project.commission) > 0
            ? Number(project.commission)
            : (Number(project.value) * Number(project.commission_rate)) / 100,
        status: (["pendente", "disponivel", "pago"].includes(project.commission_status)
          ? project.commission_status
          : "pendente") as CommissionRow["status"],
      }));

      return {
        rows,
        delivered: projects.filter((p) => p.status === "entregue").length,
        inProgress: projects.filter((p) =>
          ["em_producao", "aguardando_aprovacao", "aguardando_cliente", "ajustes", "ajustes_solicitados"].includes(
            p.status,
          ),
        ).length,
      };
    },
  });
}

/** Metas do mês corrente do usuário logado. */
export function useCurrentGoal() {
  const { user } = useSession();
  return useQuery({
    queryKey: ["goals", "atual", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("goals")
        .select("*")
        .eq("user_id", user!.id)
        .order("month", { ascending: false })
        .limit(1);
      if (error) throw error;
      return ((data ?? [])[0] ?? null) as { month: string; sales_target: number; revenue_target: number } | null;
    },
  });
}

/** Totais consolidados a partir das linhas de comissão e dos saques. */
export function summarize(rows: CommissionRow[], withdrawals: WithdrawalRow[]) {
  const sum = (status: CommissionRow["status"]) =>
    rows.filter((row) => row.status === status).reduce((total, row) => total + row.amount, 0);

  const pending = sum("pendente");
  const released = sum("disponivel");
  const paid = sum("pago");

  const withdrawn = withdrawals
    .filter((w) => w.status === "pago")
    .reduce((total, w) => total + Number(w.amount), 0);
  const requested = withdrawals
    .filter((w) => w.status === "pendente")
    .reduce((total, w) => total + Number(w.amount), 0);

  const monthKey = new Date().toISOString().slice(0, 7);
  const currentMonth = rows
    .filter((row) => (row.date ?? "").slice(0, 7) === monthKey)
    .reduce((total, row) => total + row.amount, 0);

  return {
    pending,
    released,
    paid,
    withdrawn,
    requested,
    currentMonth,
    balance: Math.max(released - requested - withdrawn, 0),
  };
}

export type PeriodKey = "mes" | "3meses" | "ano" | "todos" | "personalizado";

/** Filtro por período usado no histórico financeiro. */
export function inPeriod(
  date: string,
  period: PeriodKey,
  custom: { from: string; to: string },
) {
  if (!date) return period === "todos";
  const value = new Date(date.length === 10 ? `${date}T12:00:00` : date);
  const now = new Date();
  if (period === "todos") return true;
  if (period === "personalizado") {
    if (custom.from && value < new Date(`${custom.from}T00:00:00`)) return false;
    if (custom.to && value > new Date(`${custom.to}T23:59:59`)) return false;
    return true;
  }
  const start =
    period === "mes"
      ? new Date(now.getFullYear(), now.getMonth(), 1)
      : period === "3meses"
        ? new Date(now.getFullYear(), now.getMonth() - 2, 1)
        : new Date(now.getFullYear(), 0, 1);
  return value >= start;
}
