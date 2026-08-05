import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const searchSchema = z.object({
  niche: z.string(),
  state: z.string(),
  city: z.string().optional().nullable(),
  precision: z.enum(["alta", "ampla"]).default("alta"),
  rawMode: z.boolean().default(false),
});

interface RelevanceMap {
  direct: string[];
  related: string[];
  negative: string[];
}

const RELEVANCE_MAPS: Record<string, RelevanceMap> = {
  "Barbearia": {
    direct: ["barbearia", "barber", "barber shop", "barbershop"],
    related: ["corte masculino", "cabelo masculino", "salão masculino", "estética masculina"],
    negative: ["depósito", "gráfica", "soluções gráficas", "supermercado", "banco", "farmácia", "hospital", "oficina", "imobiliária"]
  },
  "Academia": {
    direct: ["academia", "gym", "fitness", "musculação", "crossfit"],
    related: ["centro de treinamento", "treinamento funcional", "studio fitness", "personal trainer", "pilates"],
    negative: ["supermercado", "banco", "farmácia", "hospital", "clínica", "parque", "praça", "depósito", "gráfica"]
  },
  "Oficina": {
    direct: ["oficina", "oficina mecânica", "mecânica", "auto center", "centro automotivo"],
    related: ["funilaria", "auto elétrica", "pneus", "injeção eletrônica", "serviços automotivos"],
    negative: ["supermercado", "banco", "barbearia", "gráfica", "imobiliária", "depósito genérico"]
  },
  "Imobiliária": {
    direct: ["imobiliária", "imóveis", "corretora de imóveis", "corretor de imóveis", "negócios imobiliários"],
    related: ["administração de imóveis", "aluguel de imóveis", "venda de imóveis", "consultoria imobiliária"],
    negative: ["padaria", "barbearia", "supermercado", "farmácia", "depósito", "gráfica"]
  },
  "Contabilidade": {
    direct: ["contabilidade", "contador", "contábil", "escritório contábil", "consultoria contábil"],
    related: ["assessoria contábil", "serviços contábeis", "fiscal", "departamento pessoal"],
    negative: ["salão", "lavanderia", "banco", "padaria", "depósito", "supermercado"]
  }
};

const GENERIC_REJECTION_TERMS = ["comércio", "loja", "serviços", "empresa", "estabelecimento", "depósito", "soluções", "escritório genérico"];

function calculateRelevance(item: any, niche: string, precision: "alta" | "ampla"): { score: number; reason: string; matches: { direct: string[]; related: string[]; negative: string[] } } {
  const name = (item.name || "").toLowerCase();
  const categories = (item.categories || []).map((c: string) => c.toLowerCase());
  const address = (item.address_line2 || "").toLowerCase();
  
  let score = 0;
  let reason = "Iniciando análise";
  const matches = { direct: [] as string[], related: [] as string[], negative: [] as string[] };

  const config = RELEVANCE_MAPS[niche] || {
    direct: [niche.toLowerCase()],
    related: [],
    negative: GENERIC_REJECTION_TERMS
  };

  // 1. Termos Negativos (Bloqueio crítico)
  for (const term of config.negative) {
    if (name.includes(term)) {
      matches.negative.push(term);
      return { score: -100, reason: `Termo incompatível detectado: "${term}"`, matches };
    }
  }

  // 2. Correspondência Direta (Nome e Categorias)
  for (const term of config.direct) {
    if (name.includes(term)) {
      score += 100;
      matches.direct.push(term);
      reason = `Correspondência direta no nome: "${term}"`;
    }
    if (categories.some((cat: string) => cat.includes(term))) {
      score += 90;
      matches.direct.push(term);
      reason = reason.includes("nome") ? `${reason} + categoria` : `Correspondência direta na categoria: "${term}"`;
    }
  }

  // 3. Termos Relacionados
  for (const term of config.related) {
    if (name.includes(term)) {
      score += 60;
      matches.related.push(term);
    }
    if (categories.some((cat: string) => cat.includes(term))) {
      score += 50;
    }
  }

  // 4. Correspondência em metadados/endereço
  if (address.includes(niche.toLowerCase())) {
    score += 30;
  }

  // 5. Penalidade por falta de evidência
  if (score === 0) {
    score = -80;
    reason = "Resultado sem nenhuma evidência relacionada ao nicho";
  }

  return { score, reason, matches };
}

function getGeoapifyCategories(niche: string): string | null {
  const MAP: Record<string, string> = {
    "Hamburgueria": "catering.restaurant.burger",
    "Restaurante": "catering.restaurant",
    "Pizzaria": "catering.restaurant.pizza",
    "Bar": "catering.bar",
    "Café": "catering.cafe",
    "Padaria": "commercial.food.bakery",
    "Hotel": "accommodation.hotel",
    "Pousada": "accommodation.guest_house",
    "Farmácia": "healthcare.pharmacy",
    "Loja de roupas": "commercial.clothing",
    "Dentista": "healthcare.dentist",
    "Clínica": "healthcare.clinic_or_praxis",
    "Pet Shop": "commercial.pet",
    "Salão de beleza": "service.beauty",
    "Barbearia": "service.beauty",
    "Oficina": "service.vehicle.repair",
    "Academia": "leisure.fitness,leisure.sports_centre",
  };
  return MAP[niche] || null;
}

function generateDeterministicId(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16);
}

export const Route = createFileRoute("/api/prospecting/search")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const requestId = Math.random().toString(36).substring(2, 10);
        const startTime = Date.now();
        
        try {
          // Stage: auth
          const authHeader = request.headers.get("Authorization");
          if (!authHeader?.startsWith("Bearer ")) {
            return new Response(JSON.stringify({ 
              error: true, stage: "auth", message: "Não autorizado", requestId 
            }), { status: 401 });
          }

          const token = authHeader.split(" ")[1];
          const { data: { user }, error: authError } = await supabase.auth.getUser(token);
          if (authError || !user) {
            return new Response(JSON.stringify({ 
              error: true, stage: "auth", message: "Sessão inválida", requestId 
            }), { status: 401 });
          }

          // Stage: roles (Verificando se o usuário tem permissão básica)
          const { data: roles } = await supabaseAdmin
            .from("user_roles")
            .select("role")
            .eq("user_id", user.id);
          
          const userRoles = roles?.map(r => r.role) || [];
          if (!userRoles.includes("admin") && !userRoles.includes("vendedor") && !userRoles.includes("diretor")) {
             return new Response(JSON.stringify({ 
              error: true, stage: "roles", message: "Sem permissão para prospecção", requestId 
            }), { status: 403 });
          }

          // Stage: input
          let body;
          try {
            body = await request.json();
          } catch (e) {
            return new Response(JSON.stringify({ 
              error: true, stage: "input", message: "JSON inválido", requestId 
            }), { status: 400 });
          }
          
          const { niche, state, city, precision, rawMode } = searchSchema.parse(body);
          const apiKey = process.env["GEOAPIFY_API_KEY"];
          if (!apiKey) {
            return new Response(JSON.stringify({ 
              error: true, stage: "geoapify_call", message: "API Key ausente nas configurações do servidor", requestId 
            }), { status: 500 });
          }

          // Stage: geocoding
          const locationText = city ? `${city}, ${state}, Brasil` : `${state}, Brasil`;
          const geocodeUrl = `https://api.geoapify.com/v1/geocode/search?text=${encodeURIComponent(locationText)}&limit=1&format=json&apiKey=${apiKey}`;
          
          const geocodeRes = await fetch(geocodeUrl);
          if (!geocodeRes.ok) {
            return new Response(JSON.stringify({ 
              error: true, stage: "geocoding", message: `Erro na geocodificação: ${geocodeRes.status}`, requestId 
            }), { status: geocodeRes.status });
          }
          
          const geocodeData = await geocodeRes.json();
          const areaPlaceId = geocodeData.results?.[0]?.place_id;
          if (!areaPlaceId) {
            return new Response(JSON.stringify({ 
              error: true, stage: "geocoding", message: "Localização não encontrada no Geoapify", requestId 
            }), { status: 404 });
          }

          // Stage: geoapify_call
          const allFeatures: any[] = [];
          const geoUrl = new URL("https://api.geoapify.com/v2/places");
          const category = getGeoapifyCategories(niche);
          
          if (category) geoUrl.searchParams.set("categories", category);
          else geoUrl.searchParams.set("type", "commercial");
          
          geoUrl.searchParams.set("text", niche);
          geoUrl.searchParams.set("filter", `place:${areaPlaceId}`);
          geoUrl.searchParams.set("limit", "30");
          geoUrl.searchParams.set("lang", "pt");
          geoUrl.searchParams.set("apiKey", apiKey);

          const res = await fetch(geoUrl.toString());
          const httpStatus = res.status;
          
          if (!res.ok) {
            return new Response(JSON.stringify({ 
              error: true, stage: "geoapify_call", message: `Erro na chamada Geoapify: ${httpStatus}`, requestId 
            }), { status: httpStatus });
          }

          // Stage: geoapify_response
          const data = await res.json();
          if (data.features) allFeatures.push(...data.features);
          const totalReceived = allFeatures.length;

          // Stage: mapping
          const unique = new Map();
          const diagnostic: any = { 
            requestId,
            httpStatus,
            totalReceived,
            sentToFrontend: 0,
            duration: 0,
            rawMode
          };

          for (const f of allFeatures) {
            const props = f.properties;
            if (!props?.name) continue;
            
            const key = props.place_id || generateDeterministicId(`${props.name}-${props.lat}-${props.lon}`);
            if (unique.has(key)) continue;

            // Se NÃO estiver em modo RAW, aplicar relevância v9.0
            if (!rawMode) {
              const relevance = calculateRelevance(props, niche, precision);
              const minScore = precision === "alta" ? 60 : 10;

              if (relevance.score <= -50 || relevance.score < minScore) {
                continue;
              }
            }

            unique.set(key, {
              business_name: props.name,
              category: niche,
              address: props.address_line2,
              city: props.city,
              state: props.state_code || state,
              lat: props.lat,
              lon: props.lon,
              place_id: props.place_id,
              website: props.website,
              opportunity_level: props.website ? "media" : "alta",
              status: "nova",
              _debug: rawMode ? { raw: true } : { score: calculateRelevance(props, niche, precision).score }
            });
          }

          // Stage: serialization
          const opportunities = Array.from(unique.values()).slice(0, 30);
          diagnostic.sentToFrontend = opportunities.length;
          diagnostic.duration = Date.now() - startTime;

          return new Response(JSON.stringify({ 
            opportunities, 
            diagnostic, 
            stage: "frontend",
            version: rawMode ? "RAW-DIAGNOSTIC" : "v9.0-3-levels" 
          }), {
            headers: { "Content-Type": "application/json" }
          });

        } catch (e: any) {
          return new Response(JSON.stringify({ 
            error: true, 
            stage: "unknown", 
            message: e.message, 
            requestId 
          }), { status: 500 });
        }
      }
    }
  }
});
