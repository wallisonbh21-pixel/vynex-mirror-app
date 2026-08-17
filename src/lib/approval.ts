import { useMutation, useQuery, useQueryCliente } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/lib/auth";
import { createNotifications } from "@/lib/notifications";
import { releaseToCliente } from "@/lib/approval.functions";

export const APPROVAL_STATUS = {
  producao: "em_producao",
  interna: "aguardando_aprovacao",
  liberado: "aguardando_cliente",
  ajustesInternos: "ajustes",
  ajustesClientee: "ajustes_solicitados",
  aprovado: "aprovado",
} as const;

export type ApprovalProjetoRow = {
  id: string;
  title: string;
  status: string;
  owner_id: string;
  creator_id: string | null;
  client_id: string | null;
  site_type: string | null;
  value: number;
  due_date: string | null;
  delivery_link: string | null;
  delivery_notes: string | null;
  submitted_at: string | null;
  approved_to_client_at: string | null;
  approved_to_client_by: string | null;
  client_approved_at: string | null;
  client_token: string | null;
  created_at: string;
};

export type ApprovalEvent = {
  id: string;
  project_id: string;
  actor_label: string;
  event_type: string;
  message: string | null;
  previous_status: string | null;
  new_status: string | null;
  created_at: string;
};

export const APPROVAL_EVENT_LABEL: Record<string, string> = {
  enviado_aprovacao: "Criador enviou para aprovação",
  liberado_cliente: "Administração liberou o envio ao cliente",
  ajustes_internos: "Administração solicitou ajustes",
  aprovado_cliente: "Clientee aprovou o site",
  ajustes_cliente: "Clientee solicitou alterações",
  retomada_producao: "Projeto retomou a produção",
};

/** Projetos em qualquer etapa do fluxo de aprovação (visão administrativa). */
export function useApprovalQueue() {
  return useQuery({
    queryKey: ["projects", "aprovacoes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .in("status", [
          APPROVAL_STATUS.interna,
          APPROVAL_STATUS.liberado,
          APPROVAL_STATUS.ajustesClientee,
          APPROVAL_STATUS.aprovado,
        ])
        .order("submitted_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as ApprovalProjetoRow[];
    },
  });
}

/** Histórico completo do fluxo de aprovação. */
export function useApprovalEvents(projectId?: string) {
  return useQuery({
    queryKey: ["project_approval_events", projectId ?? "todos"],
    queryFn: async () => {
      let query = supabase
        .from("project_approval_events")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200);
      if (projectId) query = query.eq("project_id", projectId);
      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as unknown as ApprovalEvent[];
    },
  });
}

async function adminIds() {
  const { data } = await supabase.from("user_roles").select("user_id, role").in("role", ["admin", "diretor"]);
  return Array.from(new Set(((data ?? []) as { user_id: string }[]).map((r) => r.user_id)));
}

function useInvalidate() {
  const queryCliente = useQueryCliente();
  return () => {
    queryCliente.invalidateQueries({ queryKey: ["projects"] });
    queryCliente.invalidateQueries({ queryKey: ["project_approval_events"] });
    queryCliente.invalidateQueries({ queryKey: ["notifications"] });
  };
}

/** CRIADOR envia o site para revisão interna da administração. */
export function useSubmitForApproval() {
  const invalidate = useInvalidate();
  const { user } = useSession();
  return useMutation({
    mutationFn: async (input: {
      project: ApprovalProjetoRow;
      delivery_link: string;
      delivery_notes?: string | null;
    }) => {
      const now = new Date().toISOString();
      const { error } = await supabase
        .from("projects")
        .update({
          status: APPROVAL_STATUS.interna,
          delivery_link: input.delivery_link,
          delivery_notes: input.delivery_notes ?? null,
          submitted_at: now,
        } as never)
        .eq("id", input.project.id);
      if (error) throw error;

      await supabase.from("project_approval_events").insert({
        project_id: input.project.id,
        actor_id: user?.id ?? null,
        actor_label: "Criador",
        event_type: "enviado_aprovacao",
        message: input.delivery_notes ?? null,
        previous_status: input.project.status,
        new_status: APPROVAL_STATUS.interna,
      } as never);

      const admins = await adminIds();
      await createNotifications([
        ...admins.map((id) => ({
          user_id: id,
          title: "Novo site aguardando aprovação.",
          body: input.project.title,
          project_id: input.project.id,
          link: "/aprovacoes",
        })),
        ...(user?.id
          ? [
              {
                user_id: user.id,
                title: "Seu projeto foi enviado para aprovação.",
                body: input.project.title,
                project_id: input.project.id,
                link: "/meus-projetos",
              },
            ]
          : []),
      ]);
    },
    onSuccess: () => {
      invalidate();
      toast.success("Enviado para revisão da administração.");
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

/** ADMIN/DIRETOR libera o envio ao cliente e gera o link seguro. */
export function useReleaseToCliente() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: async (projectId: string) =>
      releaseToCliente({ data: { projectId, origin: window.location.origin } }),
    onSuccess: () => {
      invalidate();
      toast.success("Envio liberado. Link seguro gerado para o cliente.");
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

/** ADMIN/DIRETOR devolve o projeto ao criador para ajustes. */
export function useRequestInternalAdjust() {
  const invalidate = useInvalidate();
  const { user } = useSession();
  return useMutation({
    mutationFn: async (input: { project: ApprovalProjetoRow; message: string }) => {
      const { error } = await supabase
        .from("projects")
        .update({ status: APPROVAL_STATUS.ajustesInternos } as never)
        .eq("id", input.project.id);
      if (error) throw error;

      await supabase.from("project_approval_events").insert({
        project_id: input.project.id,
        actor_id: user?.id ?? null,
        actor_label: "Administração",
        event_type: "ajustes_internos",
        message: input.message,
        previous_status: input.project.status,
        new_status: APPROVAL_STATUS.ajustesInternos,
      } as never);

      if (input.project.creator_id) {
        await createNotifications([
          {
            user_id: input.project.creator_id,
            title: "Administração solicitou ajustes no seu projeto.",
            body: `${input.project.title}: ${input.message}`,
            project_id: input.project.id,
            link: "/meus-projetos",
          },
        ]);
      }
    },
    onSuccess: () => {
      invalidate();
      toast.success("Ajustes solicitados ao criador.");
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

/** CRIADOR retoma a produção após pedido de alterações. */
export function useResumeProduction() {
  const invalidate = useInvalidate();
  const { user } = useSession();
  return useMutation({
    mutationFn: async (project: ApprovalProjetoRow) => {
      const { error } = await supabase
        .from("projects")
        .update({ status: APPROVAL_STATUS.producao } as never)
        .eq("id", project.id);
      if (error) throw error;
      await supabase.from("project_approval_events").insert({
        project_id: project.id,
        actor_id: user?.id ?? null,
        actor_label: "Criador",
        event_type: "retomada_producao",
        previous_status: project.status,
        new_status: APPROVAL_STATUS.producao,
      } as never);
    },
    onSuccess: () => {
      invalidate();
      toast.success("Projeto de volta à produção.");
    },
    onError: (error: Error) => toast.error(error.message),
  });
}
