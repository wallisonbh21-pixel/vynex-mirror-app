import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/** Portal público do cliente: dados mínimos do projeto a partir do token. */
export const getApprovalView = createServerFn({ method: "GET" })
  .inputValidator((data: { token: string }) => ({ token: String(data.token ?? "") }))
  .handler(async ({ data }) => {
    const { loadProjetoByToken, loadCliente } = await import("@/lib/approval.server");
    const project = await loadProjetoByToken(data.token);
    if (!project) return { valid: false as const };
    const client = await loadCliente(project.client_id);
    return {
      valid: true as const,
      project: {
        title: project.title,
        siteType: project.site_type,
        status: project.status,
        deliveryLink: project.delivery_link,
        deliveryNotes: project.delivery_notes,
        releasedAt: project.approved_to_client_at,
        approvedAt: project.client_approved_at,
      },
      client: {
        name: client?.contact_name ?? "",
        company: client?.company ?? "",
      },
    };
  });

/** Clientee aprova o site pelo link seguro. */
export const clientApproveSite = createServerFn({ method: "POST" })
  .inputValidator((data: { token: string }) => ({ token: String(data.token ?? "") }))
  .handler(async ({ data }) => {
    const {
      loadProjetoByToken,
      loadCliente,
      adminUserIds,
      notify,
      logApprovalEvent,
      APPROVAL_FLOW,
    } = await import("@/lib/approval.server");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const project = await loadProjetoByToken(data.token);
    if (!project) return { ok: false as const, error: "Este link não é mais válido." };
    if (project.client_approved_at || project.status === APPROVAL_FLOW.aprovado) {
      return { ok: false as const, error: "Este site já foi aprovado anteriormente." };
    }
    if (project.status !== APPROVAL_FLOW.liberado) {
      return { ok: false as const, error: "Este projeto não está aguardando aprovação do cliente." };
    }

    const client = await loadCliente(project.client_id);
    const now = new Date().toISOString();
    const { error } = await supabaseAdmin
      .from("projects")
      .update({ status: APPROVAL_FLOW.aprovado, client_approved_at: now, client_token: null } as never)
      .eq("id", project.id);
    if (error) return { ok: false as const, error: "Não foi possível registrar a aprovação." };

    await logApprovalEvent({
      project_id: project.id,
      actor_label: client?.contact_name || client?.company || "Clientee",
      event_type: "aprovado_cliente",
      previous_status: project.status,
      new_status: APPROVAL_FLOW.aprovado,
    });

    const admins = await adminUserIds();
    await notify([
      ...admins.map((id) => ({
        user_id: id,
        title: "Clientee aprovou o site.",
        body: `${client?.company ?? "Clientee"} aprovou o projeto ${project.title}.`,
        project_id: project.id,
        link: "/aprovacoes",
      })),
      ...(project.creator_id
        ? [
            {
              user_id: project.creator_id,
              title: "Seu projeto foi aprovado pelo cliente.",
              body: project.title,
              project_id: project.id,
              link: "/meus-projetos",
            },
          ]
        : []),
      {
        user_id: project.owner_id,
        title: "Seu cliente teve o site aprovado.",
        body: `${client?.company ?? "Clientee"} — ${project.title}`,
        project_id: project.id,
        link: "/projetos",
      },
    ]);

    return { ok: true as const };
  });

/** Clientee solicita alterações pelo link seguro. */
export const clientRequestChanges = createServerFn({ method: "POST" })
  .inputValidator((data: { token: string; message: string }) => ({
    token: String(data.token ?? ""),
    message: String(data.message ?? "").trim().slice(0, 2000),
  }))
  .handler(async ({ data }) => {
    if (data.message.length < 5) {
      return { ok: false as const, error: "Descreva as alterações desejadas." };
    }
    const {
      loadProjetoByToken,
      loadCliente,
      adminUserIds,
      notify,
      logApprovalEvent,
      APPROVAL_FLOW,
    } = await import("@/lib/approval.server");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const project = await loadProjetoByToken(data.token);
    if (!project) return { ok: false as const, error: "Este link não é mais válido." };
    if (project.status !== APPROVAL_FLOW.liberado) {
      return { ok: false as const, error: "Este projeto não está aguardando aprovação do cliente." };
    }

    const client = await loadCliente(project.client_id);
    const { error } = await supabaseAdmin
      .from("projects")
      .update({ status: APPROVAL_FLOW.ajustesClientee } as never)
      .eq("id", project.id);
    if (error) return { ok: false as const, error: "Não foi possível registrar a solicitação." };

    await logApprovalEvent({
      project_id: project.id,
      actor_label: client?.contact_name || client?.company || "Clientee",
      event_type: "ajustes_cliente",
      message: data.message,
      previous_status: project.status,
      new_status: APPROVAL_FLOW.ajustesClientee,
    });

    const admins = await adminUserIds();
    await notify([
      ...admins.map((id) => ({
        user_id: id,
        title: "Clientee solicitou alterações.",
        body: `${client?.company ?? "Clientee"} — ${project.title}: ${data.message}`,
        project_id: project.id,
        link: "/aprovacoes",
      })),
      ...(project.creator_id
        ? [
            {
              user_id: project.creator_id,
              title: "Clientee solicitou alterações no projeto.",
              body: `${project.title}: ${data.message}`,
              project_id: project.id,
              link: "/meus-projetos",
            },
          ]
        : []),
      {
        user_id: project.owner_id,
        title: "Clientee solicitou alterações no projeto.",
        body: `${client?.company ?? "Clientee"} — ${project.title}`,
        project_id: project.id,
        link: "/projetos",
      },
    ]);

    return { ok: true as const };
  });

/** ADMIN/DIRETOR libera o envio ao cliente e gera o link seguro. */
export const releaseToCliente = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { projectId: string; origin: string }) => ({
    projectId: String(data.projectId ?? ""),
    origin: String(data.origin ?? ""),
  }))
  .handler(async ({ data, context }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (!isAdmin) throw new Error("Apenas administradores podem liberar o envio ao cliente.");

    const {
      generateClienteToken,
      loadCliente,
      notify,
      logApprovalEvent,
      queueWhatsappMessage,
      approvalEmailContent,
      APPROVAL_FLOW,
    } = await import("@/lib/approval.server");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: row } = await supabaseAdmin
      .from("projects")
      .select("id, title, status, owner_id, creator_id, client_id")
      .eq("id", data.projectId)
      .maybeSingle();
    const project = row as unknown as {
      id: string;
      title: string;
      status: string;
      owner_id: string;
      creator_id: string | null;
      client_id: string | null;
    } | null;
    if (!project) throw new Error("Projeto não encontrado.");
    if (project.status !== APPROVAL_FLOW.interna) {
      throw new Error("Somente projetos aguardando aprovação interna podem ser liberados.");
    }

    const token = generateClienteToken();
    const expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    const { error } = await supabaseAdmin
      .from("projects")
      .update({
        status: APPROVAL_FLOW.liberado,
        client_token: token,
        client_token_expires_at: expires,
        approved_to_client_by: context.userId,
        approved_to_client_at: new Date().toISOString(),
      } as never)
      .eq("id", project.id);
    if (error) throw new Error("Não foi possível liberar o envio ao cliente.");

    const client = await loadCliente(project.client_id);
    const origin = data.origin.replace(/\/$/, "");
    const link = `${origin}/aprovacao/${token}`;

    await logApprovalEvent({
      project_id: project.id,
      actor_id: context.userId,
      actor_label: "Administração",
      event_type: "liberado_cliente",
      message: `Link seguro gerado para ${client?.company ?? "cliente"}.`,
      previous_status: project.status,
      new_status: APPROVAL_FLOW.liberado,
    });

    const email = approvalEmailContent({
      clientName: client?.contact_name || client?.company || "cliente",
      company: client?.company ?? "sua empresa",
      link,
    });

    if (client?.contact_phone) {
      await queueWhatsappMessage({
        project_id: project.id,
        client_id: client.id,
        phone: client.contact_phone,
        message: `${email.subject}\n\n${email.text}`,
        notification_type: "aprovacao_site",
      });
    }

    if (project.creator_id) {
      await notify([
        {
          user_id: project.creator_id,
          title: "Seu projeto foi liberado para o cliente.",
          body: project.title,
          project_id: project.id,
          link: "/meus-projetos",
        },
      ]);
    }
    await notify([
      {
        user_id: project.owner_id,
        title: "Site enviado para aprovação do cliente.",
        body: `${client?.company ?? "Clientee"} — ${project.title}`,
        project_id: project.id,
        link: "/projetos",
      },
    ]);

    return {
      link,
      email,
      clientEmail: client?.contact_email ?? null,
      emailSent: false,
      emailPending: "Configure o domínio de e-mail para o envio automático.",
    };
  });
