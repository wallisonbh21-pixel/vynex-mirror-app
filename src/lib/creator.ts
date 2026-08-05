import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/lib/auth";
import { PROJECT_STATUS } from "@/lib/format";

export type CreatorProject = {
  id: string;
  owner_id: string;
  creator_id: string | null;
  client_id: string | null;
  title: string;
  description: string | null;
  site_type: string | null;
  status: string;
  due_date: string | null;
  value: number;
  commission: number;
  commission_rate: number;
  commission_status: string;
  assigned_at: string | null;
  delivered_at: string | null;
  delivery_link: string | null;
  delivery_notes: string | null;
  created_at: string;
};

const PROJECTS_KEY = ["projects"];

/** Vitrine: projetos ainda não assumidos por nenhum criador. */
export function useAvailableProjects() {
  return useQuery({
    queryKey: ["projects", "disponiveis"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .eq("status", "disponivel")
        .is("creator_id", null)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as CreatorProject[];
    },
  });
}

/** Projetos que pertencem ao criador logado. */
export function useMyCreatorProjects() {
  const { user } = useSession();
  return useQuery({
    queryKey: ["projects", "meus", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .eq("creator_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as CreatorProject[];
    },
  });
}

type RpcClient = {
  rpc: (fn: string, args: Record<string, unknown>) => Promise<{ error: { message: string } | null }>;
};

/** Assume o projeto de forma atômica — só o primeiro criador consegue. */
export function useClaimProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (projectId: string) => {
      const { error } = await (supabase as unknown as RpcClient).rpc("claim_project", {
        _project_id: projectId,
      });
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PROJECTS_KEY });
      toast.success("Projeto assumido! Ele já está em produção na sua fila.");
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

/** Atualiza etapa/entrega de um projeto do criador. */
export function useUpdateCreatorProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...values }: { id: string } & Record<string, unknown>) => {
      const { error } = await supabase
        .from("projects")
        .update(values as never)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PROJECTS_KEY });
      toast.success("Projeto atualizado.");
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

/** Resumo financeiro do criador a partir das comissões e saques. */
export function creatorEarnings(projects: CreatorProject[], withdrawals: { amount: number; status: string }[]) {
  const commissionOf = (p: CreatorProject) =>
    Number(p.commission) > 0 ? Number(p.commission) : (Number(p.value) * Number(p.commission_rate)) / 100;

  const pending = projects
    .filter((p) => p.commission_status === "pendente" && p.status !== "cancelado")
    .reduce((sum, p) => sum + commissionOf(p), 0);
  const released = projects
    .filter((p) => p.commission_status === "disponivel")
    .reduce((sum, p) => sum + commissionOf(p), 0);
  const paid = projects
    .filter((p) => p.commission_status === "pago")
    .reduce((sum, p) => sum + commissionOf(p), 0);

  const withdrawn = withdrawals
    .filter((w) => w.status === "pago")
    .reduce((sum, w) => sum + Number(w.amount), 0);
  const requested = withdrawals
    .filter((w) => w.status === "pendente")
    .reduce((sum, w) => sum + Number(w.amount), 0);

  return {
    commissionOf,
    pending,
    released,
    paid,
    withdrawn,
    requested,
    balance: Math.max(released - requested - withdrawn, 0),
  };
}

/** Agrupa projetos e ganhos por mês (últimos 6 meses). */
export function monthlySeries(projects: CreatorProject[], commissionOf: (p: CreatorProject) => number) {
  const months: { key: string; label: string; projetos: number; ganhos: number }[] = [];
  const now = new Date();
  for (let i = 5; i >= 0; i -= 1) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({
      key: date.toISOString().slice(0, 7),
      label: new Intl.DateTimeFormat("pt-BR", { month: "short" }).format(date),
      projetos: 0,
      ganhos: 0,
    });
  }
  const index = new Map(months.map((m) => [m.key, m]));
  projects.forEach((project) => {
    const started = (project.assigned_at ?? project.created_at).slice(0, 7);
    const bucket = index.get(started);
    if (bucket) bucket.projetos += 1;
    if (project.status === "entregue" && project.delivered_at) {
      const paidBucket = index.get(project.delivered_at.slice(0, 7));
      if (paidBucket) paidBucket.ganhos += commissionOf(project);
    }
  });
  return months;
}
