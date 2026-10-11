import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

// Sem chave administrativa: o link público é validado por funções seguras do banco
// (token, validade, etapa do projeto e ação permitida), numa transação.

type ApprovalView =
  | { valid: false }
  | {
      valid: true;
      project: {
        title: string; siteType: string | null; status: string; deliveryLink: string | null;
        deliveryNotes: string | null; releasedAt: string | null; approvedAt: string | null;
      };
      client: { name: string; company: string };
    };

export const getApprovalView = createServerFn({ method: "GET" })
  .inputValidator((data: { token: string }) => ({ token: String(data.token ?? "").slice(0, 200) }))
  .handler(async ({ data }): Promise<ApprovalView> => {
    const { publicDb } = await import("@/lib/public-db.server");
    const { data: r, error } = await publicDb().rpc("sn_approval_view", { p_token: data.token });
    if (error || !r) return { valid: false };
    return r as unknown as ApprovalView;
  });

type ActionResult = { ok: true } | { ok: false; error: string };

async function clientAction(token: string, action: "approve" | "changes", message?: string): Promise<ActionResult> {
  const { publicDb } = await import("@/lib/public-db.server");
  const { data: r, error } = await publicDb().rpc("sn_client_approval_action", {
    p_token: token, p_action: action, p_message: message ?? undefined,
  });
  if (error || !r) return { ok: false, error: "Não foi possível registrar sua resposta." };
  return r as unknown as ActionResult;
}

export const clientApproveSite = createServerFn({ method: "POST" })
  .inputValidator((data: { token: string }) => ({ token: String(data.token ?? "").slice(0, 200) }))
  .handler(async ({ data }) => clientAction(data.token, "approve"));

export const clientRequestChanges = createServerFn({ method: "POST" })
  .inputValidator((data: { token: string; message: string }) => ({
    token: String(data.token ?? "").slice(0, 200),
    message: String(data.message ?? "").trim().slice(0, 2000),
  }))
  .handler(async ({ data }) => {
    if (data.message.length < 5) return { ok: false as const, error: "Descreva as alterações desejadas." };
    return clientAction(data.token, "changes", data.message);
  });

/** ADMIN/DIRETOR libera o envio ao cliente e gera o link seguro (token gerado no banco). */
export const releaseToCliente = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { projectId: string; origin: string }) => ({
    projectId: String(data.projectId ?? ""),
    origin: String(data.origin ?? ""),
  }))
  .handler(async ({ data, context }) => {
    const { approvalEmailContent } = await import("@/lib/approval-content");
    const { safeDbMessage } = await import("@/lib/public-db.server");
    const origin = data.origin.replace(/\/$/, "");
    const draft = approvalEmailContent({ clientName: "{{NAME}}", company: "{{COMPANY}}", link: `${origin}/aprovacao/{{TOKEN}}` });

    const { data: r, error } = await context.supabase.rpc("sn_release_to_client", {
      p_project_id: data.projectId,
      p_whatsapp_message: `${draft.subject}\n\n${draft.text}`,
    });
    if (error || !r) throw new Error(safeDbMessage(error, "Não foi possível liberar o envio ao cliente."));
    const res = r as { token: string; clientName: string; company: string; clientEmail: string | null };
    const link = `${origin}/aprovacao/${res.token}`;
    const email = approvalEmailContent({ clientName: res.clientName, company: res.company, link });
    return {
      link,
      email,
      clientEmail: res.clientEmail ?? null,
      emailSent: false,
      emailPending: "Configure o domínio de e-mail para o envio automático.",
    };
  });
