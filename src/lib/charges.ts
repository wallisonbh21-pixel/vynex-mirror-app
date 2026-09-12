import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/**
 * Cobranças de clientes (arquitetura interna — sem gateway externo).
 *
 * Status possíveis (controlados exclusivamente pelo backend):
 * PENDENTE, DISPONIVEL_PARA_PAGAMENTO, PROCESSANDO, PAGO, VENCIDO, CANCELADO, ESTORNADO
 *
 * EVENTO DE "PROJETO PRONTO": o marco real já existente é
 * `projects.client_approved_at` (aprovação final do cliente), precedido por
 * `projects.approved_to_client_at`. Futuramente será esse evento a mudar a
 * cobrança de PENDENTE para DISPONIVEL_PARA_PAGAMENTO e a disparar a
 * notificação "Seu projeto está pronto! O pagamento já está disponível."
 * com destino /cliente/pagamentos. Nenhuma automação é ativada nesta fase.
 */
export type ChargeStatus =
  | "PENDENTE"
  | "DISPONIVEL_PARA_PAGAMENTO"
  | "PROCESSANDO"
  | "PAGO"
  | "VENCIDO"
  | "CANCELADO"
  | "ESTORNADO";

export type ClientCharge = {
  id: string;
  client_id: string;
  project_id: string | null;
  contract_id: string | null;
  description: string;
  charge_type: string;
  amount: number;
  status: string;
  due_date: string | null;
  paid_at: string | null;
  payment_provider: string | null;
  provider_charge_id: string | null;
  payment_method: string | null;
  checkout_url: string | null;
  expires_at: string | null;
  created_at: string;
};

export const CHARGE_STATUS_LABEL: Record<string, string> = {
  PENDENTE: "Pendente",
  DISPONIVEL_PARA_PAGAMENTO: "Disponível para pagamento",
  PROCESSANDO: "Processando",
  PAGO: "Pago",
  VENCIDO: "Vencido",
  CANCELADO: "Cancelado",
  ESTORNADO: "Estornado",
};

export const CHARGE_TYPE_LABEL: Record<string, string> = {
  PROJETO: "Projeto",
  MENSALIDADE: "Mensalidade",
  SERVICO_ADICIONAL: "Serviço adicional",
  TRAFEGO_PAGO: "Tráfego pago",
  OUTRO: "Outro",
};

/** Cobranças que contam como valor efetivamente recebido. */
const PAID_STATUSES = new Set(["PAGO"]);
/** Cobranças válidas ainda em aberto. Estorno e cancelamento nunca entram. */
const OPEN_STATUSES = new Set([
  "PENDENTE",
  "DISPONIVEL_PARA_PAGAMENTO",
  "PROCESSANDO",
  "VENCIDO",
]);

export function summarizeCharges(charges: ClientCharge[]) {
  const valid = charges.filter((c) => c.status !== "CANCELADO");
  const totalPaid = valid
    .filter((c) => PAID_STATUSES.has(c.status))
    .reduce((acc, c) => acc + Number(c.amount || 0), 0);
  // Estorno devolve o valor ao cliente: não é pago nem pendente.
  const totalPending = valid
    .filter((c) => OPEN_STATUSES.has(c.status))
    .reduce((acc, c) => acc + Number(c.amount || 0), 0);
  const totalContracted = totalPaid + totalPending;

  const nextDue = valid
    .filter((c) => OPEN_STATUSES.has(c.status) && !!c.due_date)
    .sort((a, b) => (a.due_date! < b.due_date! ? -1 : 1))[0] ?? null;

  const payable = valid.find(
    (c) => c.status === "DISPONIVEL_PARA_PAGAMENTO",
  ) ?? null;

  return {
    totalPaid,
    totalPending,
    totalContracted,
    nextDue,
    payable,
    hasCharges: charges.length > 0,
    isUpToDate: totalPending === 0 && charges.length > 0,
  };
}

/** Cobranças do cliente autenticado (RLS restringe ao próprio cliente). */
export function useClientCharges(clientId?: string) {
  return useQuery({
    queryKey: ["client-charges", clientId],
    enabled: !!clientId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("client_charges")
        .select("*")
        .eq("client_id", clientId!)
        .order("due_date", { ascending: true, nullsFirst: false })
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as ClientCharge[];
    },
  });
}

/** Listagem administrativa (somente leitura). */
export function useAdminCharges() {
  return useQuery({
    queryKey: ["admin-client-charges"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("client_charges")
        .select("*, clients(company, contact_name), projects(title)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as (ClientCharge & {
        clients: { company: string | null; contact_name: string | null } | null;
        projects: { title: string | null } | null;
      })[];
    },
  });
}
