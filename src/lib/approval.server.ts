import { supabaseAdmin } from "@/integrations/supabase/client.server";

/** Etapas oficiais do fluxo de aprovação. */
export const APPROVAL_FLOW = {
  producao: "em_producao",
  interna: "aguardando_aprovacao",
  liberado: "aguardando_cliente",
  ajustesInternos: "ajustes",
  ajustesCliente: "ajustes_solicitados",
  aprovado: "aprovado",
} as const;

export type ApprovalProject = {
  id: string;
  title: string;
  status: string;
  owner_id: string;
  creator_id: string | null;
  client_id: string | null;
  site_type: string | null;
  delivery_link: string | null;
  delivery_notes: string | null;
  due_date: string | null;
  approved_to_client_at: string | null;
  client_approved_at: string | null;
  client_token: string | null;
  client_token_expires_at: string | null;
};

export function generateClientToken() {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

/** Busca o projeto pelo token público, validando validade e etapa. */
export async function loadProjectByToken(token: string) {
  if (!token || token.length < 16) return null;
  const { data, error } = await supabaseAdmin
    .from("projects")
    .select(
      "id, title, status, owner_id, creator_id, client_id, site_type, delivery_link, delivery_notes, due_date, approved_to_client_at, client_approved_at, client_token, client_token_expires_at",
    )
    .eq("client_token", token)
    .maybeSingle();
  if (error || !data) return null;
  const project = data as unknown as ApprovalProject;
  if (
    project.client_token_expires_at &&
    new Date(project.client_token_expires_at).getTime() < Date.now()
  ) {
    return null;
  }
  return project;
}

export async function loadClient(clientId: string | null) {
  if (!clientId) return null;
  const { data } = await supabaseAdmin
    .from("clients")
    .select("id, company, contact_name, contact_email, contact_phone")
    .eq("id", clientId)
    .maybeSingle();
  return (data ?? null) as {
    id: string;
    company: string;
    contact_name: string | null;
    contact_email: string | null;
    contact_phone: string | null;
  } | null;
}

export async function adminUserIds() {
  const { data } = await supabaseAdmin
    .from("user_roles")
    .select("user_id, role")
    .in("role", ["admin", "diretor"]);
  return Array.from(new Set(((data ?? []) as { user_id: string }[]).map((r) => r.user_id)));
}

export async function notify(
  entries: {
    user_id: string;
    title: string;
    body?: string | null;
    category?: string;
    link?: string | null;
    project_id?: string | null;
  }[],
) {
  const rows = entries
    .filter((e) => !!e.user_id)
    .map((e) => ({
      user_id: e.user_id,
      title: e.title,
      body: e.body ?? null,
      category: e.category ?? "aprovacao",
      link: e.link ?? null,
      project_id: e.project_id ?? null,
    }));
  if (rows.length === 0) return;
  await supabaseAdmin.from("notifications").insert(rows as never);
}

export async function logApprovalEvent(entry: {
  project_id: string;
  actor_id?: string | null;
  actor_label: string;
  event_type: string;
  message?: string | null;
  previous_status?: string | null;
  new_status?: string | null;
}) {
  await supabaseAdmin.from("project_approval_events").insert({
    project_id: entry.project_id,
    actor_id: entry.actor_id ?? null,
    actor_label: entry.actor_label,
    event_type: entry.event_type,
    message: entry.message ?? null,
    previous_status: entry.previous_status ?? null,
    new_status: entry.new_status ?? null,
  } as never);
}

/**
 * Registra a mensagem de WhatsApp que será enviada quando a integração oficial
 * com a API do WhatsApp Business for ativada. Nada é enviado agora.
 */
export async function queueWhatsappMessage(entry: {
  project_id: string;
  client_id: string | null;
  phone: string;
  message: string;
  notification_type: string;
}) {
  if (!entry.phone) return;
  await supabaseAdmin.from("whatsapp_messages").insert({
    project_id: entry.project_id,
    client_id: entry.client_id,
    phone: entry.phone,
    message: entry.message,
    notification_type: entry.notification_type,
    send_status: "preparado",
  } as never);
}

export function approvalEmailContent(params: {
  clientName: string;
  company: string;
  link: string;
}) {
  const subject = "🎉 Seu novo site está pronto para avaliação!";
  const text = [
    `Olá, ${params.clientName}!`,
    "",
    "Temos uma ótima notícia!",
    "",
    `O site da ${params.company} foi finalizado pela equipe ScaleNexus e está pronto para sua avaliação.`,
    "",
    `Acesse o projeto por aqui: ${params.link}`,
    "",
    "Depois de visualizar o site, você poderá aprovar o projeto ou solicitar alterações.",
    "",
    "Atenciosamente,",
    "Equipe ScaleNexus",
    "Transforme oportunidades em negócios digitais.",
  ].join("\n");
  return { subject, text };
}
