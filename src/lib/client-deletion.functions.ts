import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const deleteClienteSchema = z.object({ clientId: z.string().uuid() });

// Sem chave administrativa: o banco valida papel, carteira do vendedor e projetos vinculados.
export const deleteCliente = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: unknown) => deleteClienteSchema.parse(data))
  .handler(async ({ data, context }) => {
    const { safeDbMessage } = await import("@/lib/public-db.server");
    const { data: result, error } = await context.supabase.rpc("sn_delete_client", { p_client_id: data.clientId });
    if (error) throw new Error(safeDbMessage(error, "Erro ao excluir o registro do cliente."));
    const r = (result ?? {}) as { hadAuthUser?: boolean };
    return { success: true, message: "Cliente excluído com sucesso.", hadAuthUser: !!r.hadAuthUser };
  });
