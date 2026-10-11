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

// Sem chave administrativa: a função segura do banco valida papel (admin/vendedor) e define o dono.
export const registerNewCliente = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: unknown) => registerClienteSchema.parse(data))
  .handler(async ({ data, context }) => {
    const { safeDbMessage } = await import("@/lib/public-db.server");
    const { data: newCliente, error } = await context.supabase.rpc("sn_register_client", {
      p_contact_email: data.contact_email,
      p_contact_name: data.contact_name,
      p_contact_phone: data.contact_phone,
      p_company: data.company,
      p_notes: data.notes,
    });
    if (error || !newCliente) throw new Error(safeDbMessage(error, "Erro ao salvar o registro do cliente."));
    return { success: true, client: newCliente, message: "Cliente cadastrado com sucesso." };
  });
