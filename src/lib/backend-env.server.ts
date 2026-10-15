/**
 * Endereço e chave pública do backend para código de servidor.
 * Usa as variáveis de servidor quando existem e, na falta delas (ex.: Vercel
 * sem SUPABASE_* configuradas), recorre aos valores públicos VITE_* embutidos
 * no build. Ambos são públicos — nunca coloque chaves secretas aqui.
 */
export function getBackendEnv() {
  const url = process.env["SUPABASE_URL"] || import.meta.env.VITE_SUPABASE_URL || "";
  const key =
    process.env["SUPABASE_PUBLISHABLE_KEY"] || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || "";
  return { url, key };
}
