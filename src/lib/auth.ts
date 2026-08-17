import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type AppRole = "admin" | "diretor" | "rh" | "vendedor" | "criador" | "cliente";

/** Nomes em português das funções da plataforma. */
export const ROLE_LABEL: Record<string, string> = {
  admin: "Administrador",
  diretor: "Administrativo (Diretor)",
  rh: "Administrativo (RH)",
  vendedor: "Vendedor",
  criador: "Criador",
  cliente: "Clientee",
};

export const ROLE_OPTIONS: { value: AppRole; label: string }[] = [
  { value: "admin", label: ROLE_LABEL['admin']! },
  { value: "diretor", label: ROLE_LABEL['diretor']! },
  { value: "rh", label: ROLE_LABEL['rh']! },
  { value: "vendedor", label: ROLE_LABEL['vendedor']! },
  { value: "criador", label: ROLE_LABEL['criador']! },
  { value: "cliente", label: ROLE_LABEL['cliente']! },
];

export type Profile = {
  id: string;
  full_name: string | null;
  nickname: string | null;
  avatar_url: string | null;
  phone: string | null;
  pix_key: string | null;
  commission_rate: number;
};

export function useSession() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
      setLoading(false);
    });
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  return { session, user: session?.user ?? null, loading };
}

export function useProfile() {
  const { user } = useSession();
  return useQuery({
    queryKey: ["profile", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return data as Profile | null;
    },
  });
}

/** Gera uma URL assinada para a foto de perfil guardada no armazenamento privado. */
export function useAvatarUrl(path: string | null | undefined) {
  return useQuery({
    queryKey: ["avatar", path],
    enabled: !!path,
    staleTime: 30 * 60 * 1000,
    queryFn: async () => {
      if (path!.startsWith("http")) return path!;
      const { data, error } = await supabase.storage.from("avatars").createSignedUrl(path!, 3600);
      if (error) return null;
      return data?.signedUrl ?? null;
    },
  });
}

export function useRoles() {
  const { user } = useSession();
  const query = useQuery({
    queryKey: ["roles", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user!.id);
      if (error) throw error;
      return (data ?? []).map((r) => r.role as AppRole);
    },
  });

  const roles = query.data ?? [];
  const isDiretor = roles.includes("diretor");
  return {
    roles,
    isAdmin: roles.includes("admin") || isDiretor,
    isDiretor,
    isRh: roles.includes("rh"),
    isCriador: roles.includes("criador"),
    isVendedor: roles.includes("vendedor"),
    isClientee: roles.includes("cliente"),
    primaryRole: (roles[0] ?? "vendedor") as AppRole,
    loading: query.isLoading,
  };
}
