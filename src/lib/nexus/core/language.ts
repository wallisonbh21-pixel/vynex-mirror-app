/**
 * NEXUSBUILD CORE — Idioma dos sites.
 * Regra: pt-BR é o idioma padrão de todo site criado ou editado pela plataforma.
 * Também expõe uma verificação leve de textos em inglês visíveis ao visitante.
 */
export const NEXUS_SITE_LANGUAGE = `IDIOMA DOS SITES (OBRIGATÓRIO)
- Todo site criado ou editado (do zero, por template ou template adaptado) usa Português do Brasil (pt-BR) por padrão.
- Vale para menus, botões, formulários, mensagens, avisos, chamadas para ação, títulos, subtítulos, depoimentos, perguntas frequentes e rodapés.
- Padrão brasileiro: moeda em R$, datas dd/mm/aaaa, telefones (11) 99999-9999, endereços e exemplos do Brasil, linguagem natural e profissional.
- Ao editar, altere apenas o pedido e preserve o idioma de todo o restante.
- Não traduza nomes próprios, marcas, siglas ou termos técnicos consagrados (SaaS, API, CRM, WhatsApp, nomes de produtos).
- Outro idioma só quando o usuário pedir explicitamente, e apenas para aquele projeto.
- Nunca invente CNPJ, registros profissionais, certificações, avaliações reais ou dados pessoais; dados demonstrativos devem ser marcados como fictícios.`;

/** Palavras comuns em inglês que não deveriam aparecer em textos visíveis em pt-BR. */
const EN_WORDS = new Set([
  "the", "and", "your", "you", "our", "with", "for", "get", "started", "learn", "more", "read", "now",
  "contact", "about", "home", "features", "pricing", "sign", "login", "submit", "send", "subscribe",
  "free", "trial", "book", "call", "today", "welcome", "services", "testimonials", "rights", "reserved",
  "privacy", "terms", "search", "loading", "next", "previous", "back", "close", "view", "all", "start",
  "here", "click", "join", "team", "blog", "careers", "support", "help", "best", "new", "why", "how", "what",
]);

/** Termos aceitos mesmo sendo estrangeiros (marcas, siglas, técnicos). */
const ALLOWED = new Set(["saas", "api", "crm", "whatsapp", "instagram", "email", "e-mail", "online", "site", "app", "dashboard", "premium", "ia", "ai", "seo", "ok"]);

/** Retorna as palavras suspeitas em inglês de um texto (ignora URLs, código e siglas). */
export function findEnglishWords(text: string): string[] {
  const clean = text.replace(/https?:\/\/\S+|\S+@\S+|`[^`]*`/g, " ");
  const hits = new Set<string>();
  for (const raw of clean.split(/[^A-Za-zÀ-ÿ'-]+/)) {
    if (!raw || /^[A-Z0-9]{2,}$/.test(raw)) continue; // siglas
    const w = raw.toLowerCase();
    if (ALLOWED.has(w)) continue;
    if (EN_WORDS.has(w)) hits.add(w);
  }
  // Exige ao menos 2 ocorrências distintas para reduzir falsos positivos ("e", "home office"…)
  return hits.size >= 2 ? [...hits] : [];
}
