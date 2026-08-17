import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
const registerClienteSchema = z.object({
    contact_email: z.string().email("E-mail inválido"),
    contact_name: z.string().optional().nullable().transform(val => val ?? ""),
    contact_phone: z.string().optional().nullable().transform(val => val ?? ""),
    company: z.string().optional().nullable().transform(val => val ?? ""),
    notes: z.string().optional().nullable().transform(val => val ?? ""),
});
export const registerNewCliente = createServerFn({ method: "POST" })
    .middleware([requireSupabaseAuth])
    .validator((data) => registerClienteSchema.parse(data))
    .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { userId: actorId, supabase: userSupabase } = context;
    if (!actorId)
        throw new Error("Não autorizado.");
    // Determine actor role
    const { data: roles } = await userSupabase.from("user_roles").select("role").eq("user_id", actorId);
    const isAdmin = roles?.some((r) => r.role === 'admin' || r.role === 'diretor');
    const isVendedor = roles?.some((r) => r.role === 'vendedor');
    if (!isAdmin && !isVendedor) {
        throw new Error("Você não tem permissão para cadastrar clientes.");
    }
    // Create the commercial client record
    const { data: newCliente, error: clientError } = await supabaseAdmin
        .from("clients")
        .insert({
        contact_name: data.contact_name,
        contact_email: data.contact_email,
        contact_phone: data.contact_phone,
        company: data.company,
        notes: data.notes,
        owner_id: actorId,
        status: "ativo"
    })
        .select()
        .single();
    if (clientError || !newCliente) {
        console.error("[DEBUG] client_creation_failed", clientError);
        throw new Error(`Erro ao salvar o registro do cliente: ${clientError?.message || "Registro não criado"}`);
    }
    console.log("[DEBUG] client_created", { clientId: newCliente.id, email: data.contact_email });
    return {
        success: true,
        client: newCliente,
        message: "Clientee cadastrado com sucesso."
    };
});
