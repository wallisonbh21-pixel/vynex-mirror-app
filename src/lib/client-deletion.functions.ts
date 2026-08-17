import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const deleteClienteSchema = z.object({
  clientId: z.string().uuid(),
});

export const deleteCliente = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: unknown) => deleteClienteSchema.parse(data))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { userId: actorId, supabase: userSupabase } = context;

    if (!actorId) throw new Error("Não autorizado.");

    // 1. Verificar permissões do autor (Admin ou Vendedor)
    const { data: roles } = await userSupabase.from("user_roles").select("role").eq("user_id", actorId);
    const isAdmin = roles?.some((r: any) => r.role === 'admin' || r.role === 'diretor');
    const isVendedor = roles?.some((r: any) => r.role === 'vendedor');

    if (!isAdmin && !isVendedor) {
      throw new Error("Você não tem permissão para excluir clientes.");
    }

    // 2. Buscar o cliente e verificar propriedade se for Vendedor
    const { data: client, error: fetchError } = await userSupabase
      .from("clients")
      .select("id, owner_id, user_id, contact_name")
      .eq("id", data.clientId)
      .single();

    if (fetchError || !client) {
      throw new Error("Clientee não encontrado.");
    }

    if (!isAdmin && client.owner_id !== actorId) {
      throw new Error("Você não tem permissão para excluir este cliente, pois ele não pertence à sua carteira.");
    }

    // 3. Verificar integridade referencial (dados vinculados)
    // Verificamos projetos, pois é o vínculo mais comum que impede deleção limpa
    const { count: projectsCount } = await supabaseAdmin
      .from("projects")
      .select("id", { count: "exact", head: true })
      .eq("client_id", data.clientId);

    if (projectsCount && projectsCount > 0) {
      throw new Error(`Não é possível excluir o cliente "${client.contact_name}" porque existem ${projectsCount} projetos vinculados a ele.`);
    }

    // 4. Se houver um usuário Auth vinculado, avisamos no frontend (a deleção do Auth não é automática)
    // Aqui no backend apenas registramos se existe o vínculo
    const hasAuth = !!client.user_id;

    // 5. Executar a exclusão REAL no banco
    const { error: deleteError } = await supabaseAdmin
      .from("clients")
      .delete()
      .eq("id", data.clientId);

    if (deleteError) {
      console.error("[DEBUG] client_deletion_failed", deleteError);
      throw new Error(`Erro ao excluir o registro do cliente: ${deleteError.message}`);
    }

    return { 
      success: true, 
      message: "Clientee excluído com sucesso.",
      hadAuthUsuário: hasAuth
    };
  });
