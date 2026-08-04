import { redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import type { AppRole } from "@/lib/auth";

/** Lê os papéis do usuário autenticado (admin sempre tem acesso total). */
export async function getCurrentRoles(): Promise<AppRole[]> {
  const { data: userData, error: userError } = await supabase.auth.getUser();
  const user = userData?.user;
  if (userError || !user) {
    if (typeof window === "undefined") {
      throw new Error("AUTH_REQUIRED_SSR_REDIRECT");
    }
    throw redirect({ to: "/auth" });
  }

  const { data, error } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id);
  if (error) return [];
  return (data ?? []).map((row) => row.role as AppRole);
}

/**
 * Bloqueia a rota antes de renderizar/consultar dados quando o papel não é permitido.
 * Admin tem acesso a todas as áreas.
 */
export async function requireRole(allowed: AppRole[]) {
  const roles = await getCurrentRoles();
  if (roles.includes("admin")) return { roles };
  if (!allowed.some((role) => roles.includes(role))) {
    throw redirect({ to: "/painel", replace: true });
  }
  return { roles };
}

/** Rotas exclusivas do time comercial (CRM). */
export const requireVendedor = () => requireRole(["vendedor", "diretor", "admin", "rh"]);

/** Rotas exclusivas do time de criação. */
export const requireCriador = () => requireRole(["criador"]);

/** Rotas administrativas. */
export const requireAdmin = () => requireRole(["admin"]);
