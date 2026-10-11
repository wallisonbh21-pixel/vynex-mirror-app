import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

/** Cliente com chave pública (anon), sem sessão. Usado só para chamar funções seguras do banco. */
export function publicDb() {
  const url = process.env["SUPABASE_URL"]!;
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"]!;
  return createClient<Database>(url, key, {
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input, init) => {
        const h = new Headers(init?.headers);
        if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) h.delete("Authorization");
        h.set("apikey", key);
        return fetch(input, { ...init, headers: h });
      },
    },
  });
}

/** Converte erros do banco em mensagens seguras (sem detalhes internos). */
export function safeDbMessage(err: { code?: string; message?: string } | null | undefined, fallback: string) {
  if (!err) return fallback;
  if (["42501", "22023", "23503", "54000"].includes(err.code ?? "")) return err.message ?? fallback;
  console.error("[db]", err.code, err.message);
  return fallback;
}
