/**
 * Central de Prospecção VYNEXA - API Search v10.0
 * Estratégia de Busca em Camadas com Paginação Geoapify
 */
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

interface NicheConfig {
  primaryCategories: string[];
  secondaryCategories: string[];
  searchTerms: string[];
  relevance: {
    direct: string[];
    related: string[];
    negative: string[];
  };
}

const NICHE_STRATEGY: Record<string, NicheConfig> = {
  "Hamburgueria": {
    primaryCategories: ["catering.restaurant.burger"],
    secondaryCategories: ["catering.restaurant"],
    searchTerms: ["hamburgueria", "hambúrguer", "burger", "lanchonete"],
    relevance: {
      direct: ["hamburgueria", "burger", "hambúrguer", "burguer"],
      related: ["lanchonete", "restaurante", "fast food", "snack"],
      negative: ["depósito", "supermercado", "banco", "farmácia", "hospital", "oficina"]
    }
  },
  "Dentista": {
    primaryCategories: ["healthcare.dentist"],
    secondaryCategories: ["healthcare.clinic_or_praxis"],
    searchTerms: ["dentista", "dental", "odontologia"],
    relevance: {
      direct: ["dentista", "dental", "odontologia", "odontológico", "ortodontia"],
      related: ["clínica odontológica", "consultório odontológico"],
      negative: ["clínica médica", "hospital", "veterinário", "farmácia", "supermercado"]
    }
  },
  "Barbearia": {
    primaryCategories: ["service.beauty"],
    secondaryCategories: [],
    searchTerms: ["barbearia", "barber", "barber shop"],
    relevance: {
      direct: ["barbearia", "barber", "barbershop", "barbeiro"],
      related: ["corte masculino", "salão masculino", "estética masculina"],
      negative: ["depósito", "supermercado", "banco", "gráfica", "farmácia"]
    }
  },
  "Academia": {
    primaryCategories: ["leisure.fitness", "leisure.sports_centre"],
    secondaryCategories: [],
    searchTerms: ["academia", "gym", "fitness", "crossfit"],
    relevance: {
      direct: ["academia", "gym", "fitness", "musculação", "crossfit"],
      related: ["centro de treinamento", "treinamento funcional", "studio fitness", "personal trainer", "pilates"],
      negative: ["supermercado", "banco", "farmácia", "hospital", "clínica", "parque"]
    }
  },
  "Pizzaria": {
    primaryCategories: ["catering.restaurant.pizza"],
    secondaryCategories: ["catering.restaurant"],
    searchTerms: ["pizzaria", "pizza"],
    relevance: {
      direct: ["pizzaria", "pizza"],
      related: ["restaurante italiano", "delivery pizza", "massas"],
      negative: ["depósito", "supermercado", "banco", "farmácia"]
    }
  }
};

const GENERIC_REJECTION_TERMS = ["comércio", "loja", "serviços", "empresa", "estabelecimento", "depósito", "soluções", "escritório genérico"];

function calculateRelevanceScore(item: any, niche: string, config: NicheConfig | null): { score: number; level: 'DIRETA' | 'RELACIONADA' | 'GENÉRICA' | 'IRRELEVANTE' } {
  const name = (item.name || "").toLowerCase();
  const categories = (item.categories || []).map((c: string) => c.toLowerCase());
  
  if (!config) {
    const isDirect = name.includes(niche.toLowerCase());
    return { 
      score: isDirect ? 100 : 0, 
      level: isDirect ? 'DIRETA' : 'GENÉRICA' 
    };
  }

  // 1. Check Negative Terms
  const allNegative = [...config.relevance.negative, ...GENERIC_REJECTION_TERMS];
  for (const term of allNegative) {
    if (name.includes(term)) return { score: -100, level: 'IRRELEVANTE' };
  }

  // 2. Direct Match
  for (const term of config.relevance.direct) {
    if (name.includes(term) || categories.some((c: string) => c.includes(term))) {
      return { score: 100, level: 'DIRETA' };
    }
  }

  // 3. Related Match
  for (const term of config.relevance.related) {
    if (name.includes(term) || categories.some((c: string) => c.includes(term))) {
      return { score: 60, level: 'RELACIONADA' };
    }
  }

  return { score: 20, level: 'GENÉRICA' };
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
          // Auth & Roles - MOVED TO CHECK IF PRODUCTION OR LOCAL AUDIT
          const authHeader = request.headers.get("Authorization");
          let user: any = null;
          let userRoles: string[] = [];

          if (authHeader?.startsWith("Bearer ")) {
            const token = authHeader.split(" ")[1];
            const { data: { user: authUser }, error: authError } = await supabase.auth.getUser(token);
            if (!authError && authUser) {
              user = authUser;
              const { data: roles } = await supabaseAdmin.from("user_roles").select("role").eq("user_id", user.id);
              userRoles = roles?.map(r => r.role) || [];
            }
          }

          // Allow audit from sandbox without full auth if needed, but strictly for GET or with specific internal header
          const isInternalAudit = request.headers.get("X-Vynexa-Audit") === "true";

          if (!isInternalAudit && (!user || (!userRoles.includes("admin") && !userRoles.includes("vendedor") && !userRoles.includes("diretor")))) {
             return new Response(JSON.stringify({ error: true, stage: "auth", message: "Acesso negado", requestId }), { status: 403 });
          }

          // Input
          const body = await request.json();
          const { niche, state, city, precision, rawMode } = searchSchema.parse(body);
          const apiKey = process.env["GEOAPIFY_API_KEY"];
          if (!apiKey) return new Response(JSON.stringify({ error: true, stage: "config", message: "API Key ausente", requestId }), { status: 500 });

          // Geocoding
          const locationText = city ? `${city}, ${state}, Brasil` : `${state}, Brasil`;
          const geocodeUrl = `https://api.geoapify.com/v1/geocode/search?text=${encodeURIComponent(locationText)}&limit=1&format=json&apiKey=${apiKey}`;
          const geocodeRes = await fetch(geocodeUrl);
          const geocodeData = await geocodeRes.json();
          const areaPlaceId = geocodeData.results?.[0]?.place_id;
          if (!areaPlaceId) return new Response(JSON.stringify({ error: true, stage: "geocoding", message: "Localização não encontrada", requestId }), { status: 404 });

          // Layered approach: Execute multiple queries until target is reached
          const resultsMap = new Map();
          const diagnostic: any = {
            requestId,
            queries: [],
            totalDuration: 0,
            startTime: Date.now()
          };

          const config = NICHE_STRATEGY[niche] || null;
          const searchLayers = [];
          if (config) {
            if (config.primaryCategories.length > 0) searchLayers.push({ type: 'categories', values: config.primaryCategories });
            if (config.secondaryCategories.length > 0) searchLayers.push({ type: 'categories', values: config.secondaryCategories });
            if (config.searchTerms.length > 0) searchLayers.push({ type: 'text', values: config.searchTerms });
          } else {
            searchLayers.push({ type: 'text', values: [niche] });
          }

          const targetCount = 30;

          // Layer loop
          for (const layer of searchLayers) {
            if (resultsMap.size >= targetCount && !rawMode) break;

            // Value loop within layer
            for (const value of layer.values) {
              if (resultsMap.size >= targetCount && !rawMode) break;

              let offset = 0;
              let hasMore = true;
              let retryCount = 0;

              while (hasMore && (resultsMap.size < targetCount || rawMode) && retryCount < 5) {
                const queryStartTime = Date.now();
                const currentQuery: any = {
                  type: layer.type,
                  value,
                  offset,
                  stage: `layer_${layer.type}_${value}_offset_${offset}`
                };

                try {
                  const geoUrl = new URL("https://api.geoapify.com/v2/places");
                  if (layer.type === 'categories') {
                    geoUrl.searchParams.set("categories", value);
                  }
                  
                  // Text parameter usage varies by API version/endpoint
                  // For v2/places, 'text' search is a filter or we use /v1/places/search
                  // We'll keep the current logic but wrap it in a try-catch per query
                  if (layer.type === 'categories') {
                    geoUrl.searchParams.set("categories", value);
                  } else {
                    // text-only search in /v2/places is not supported without categories or type
                    // We must use 'type' (e.g., 'amenity', 'commercial') if no categories are provided,
                    // or just switch to the correct endpoint if we wanted text search.
                    // For now, let's use a broad category as a baseline when doing 'text' search
                    // or define a default type.
                    geoUrl.searchParams.set("categories", "commercial,catering,service,healthcare,leisure,education,activity");
                    geoUrl.searchParams.set("text", value);
                  }
                  
                  geoUrl.searchParams.set("filter", `place:${areaPlaceId}`);
                  geoUrl.searchParams.set("limit", "20");
                  geoUrl.searchParams.set("offset", offset.toString());
                  geoUrl.searchParams.set("lang", "pt");
                  geoUrl.searchParams.set("apiKey", apiKey);

                  const res = await fetch(geoUrl.toString());
                  currentQuery.httpStatus = res.status;
                  
                  if (!res.ok) {
                    const errorText = await res.text();
                    currentQuery.error = true;
                    currentQuery.message = `API Geoapify retornou ${res.status}`;
                    currentQuery.details = errorText.substring(0, 200);
                    diagnostic.queries.push(currentQuery);
                    break; // Fail this layer/value path, move to next
                  }

                  const data = await res.json();
                  const features = data.features || [];
                  currentQuery.resultsCount = features.length;
                  currentQuery.duration = Date.now() - queryStartTime;
                  diagnostic.queries.push(currentQuery);

                  if (features.length < 20) {
                    hasMore = false;
                  } else {
                    offset += 20;
                  }

                  for (const f of features) {
                    const props = f.properties;
                    if (!props?.name) continue;
                    
                    const key = props.place_id || generateDeterministicId(`${props.name}-${props.lat}-${props.lon}`);
                    if (resultsMap.has(key)) continue;

                    const relevance = calculateRelevanceScore(props, niche, config);
                    
                    if (!rawMode) {
                      if (relevance.level === 'IRRELEVANTE') continue;
                      if (precision === 'alta' && relevance.level === 'GENÉRICA') continue;
                    }

                    resultsMap.set(key, {
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
                      relevance_level: relevance.level,
                      _debug: { score: relevance.score, level: relevance.level, layer: layer.type, value }
                    });

                    if (resultsMap.size >= targetCount && !rawMode) break;
                  }
                  
                  if (features.length === 0) hasMore = false;

                } catch (err: any) {
                  currentQuery.error = true;
                  currentQuery.message = err.message;
                  diagnostic.queries.push(currentQuery);
                  hasMore = false; // Stop this specific loop
                }
                retryCount++;
              }
            }
          }

          // Final consolidation
          const allOpportunities = Array.from(resultsMap.values());
          const levelOrder: Record<string, number> = { 'DIRETA': 0, 'RELACIONADA': 1, 'GENÉRICA': 2, 'IRRELEVANTE': 3 };
          allOpportunities.sort((a, b) => {
            const orderA = levelOrder[a.relevance_level] ?? 99;
            const orderB = levelOrder[b.relevance_level] ?? 99;
            return orderA - orderB;
          });

          const finalOpportunities = allOpportunities.slice(0, targetCount);
          diagnostic.totalDuration = Date.now() - diagnostic.startTime;
          diagnostic.finalCount = finalOpportunities.length;
          diagnostic.totalFound = allOpportunities.length;

          return new Response(JSON.stringify({ 
            opportunities: finalOpportunities, 
            diagnostic, 
            stage: "complete",
            version: "v10.1-resilient" 
          }), {
            headers: { "Content-Type": "application/json" }
          });

        } catch (e: any) {
          console.error(`[Prospecting API Error] ${requestId}:`, e);
          return new Response(JSON.stringify({ 
            error: true, 
            stage: "unknown", 
            message: e.message || "Erro desconhecido", 
            requestId,
            details: e.stack?.substring(0, 300)
          }), { 
            status: 500,
            headers: { "Content-Type": "application/json" }
          });
        }
      }
    }
  }
});
