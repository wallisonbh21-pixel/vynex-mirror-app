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
          // Auth & Roles
          const authHeader = request.headers.get("Authorization");
          if (!authHeader?.startsWith("Bearer ")) {
            return new Response(JSON.stringify({ error: true, stage: "auth", message: "Não autorizado", requestId }), { status: 401 });
          }
          const token = authHeader.split(" ")[1];
          const { data: { user }, error: authError } = await supabase.auth.getUser(token);
          if (authError || !user) return new Response(JSON.stringify({ error: true, stage: "auth", message: "Sessão inválida", requestId }), { status: 401 });

          const { data: roles } = await supabaseAdmin.from("user_roles").select("role").eq("user_id", user.id);
          const userRoles = roles?.map(r => r.role) || [];
          if (!userRoles.includes("admin") && !userRoles.includes("vendedor") && !userRoles.includes("diretor")) {
             return new Response(JSON.stringify({ error: true, stage: "roles", message: "Sem permissão", requestId }), { status: 403 });
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

          const config = NICHE_STRATEGY[niche] || null;
          const uniqueResults = new Map();
          let queriesExecuted = 0;
          let pagesFetched = 0;
          let rawResultsCount = 0;

          // Search Strategy: Layered approach
          // Layer 1: Primary Categories
          // Layer 2: Secondary Categories
          // Layer 3: Search Terms
          
          const searchLayers = [];
          if (config) {
            if (config.primaryCategories.length > 0) searchLayers.push({ type: 'categories', values: config.primaryCategories });
            if (config.secondaryCategories.length > 0) searchLayers.push({ type: 'categories', values: config.secondaryCategories });
            if (config.searchTerms.length > 0) searchLayers.push({ type: 'text', values: config.searchTerms });
          } else {
            searchLayers.push({ type: 'text', values: [niche] });
          }

          for (const layer of searchLayers) {
            if (uniqueResults.size >= 30 && !rawMode) break;

            for (const value of layer.values) {
              if (uniqueResults.size >= 30 && !rawMode) break;

              let offset = 0;
              let hasMore = true;

              while (hasMore && (uniqueResults.size < 30 || rawMode)) {
                queriesExecuted++;
                pagesFetched++;
                
                const geoUrl = new URL("https://api.geoapify.com/v2/places");
                if (layer.type === 'categories') geoUrl.searchParams.set("categories", value);
                geoUrl.searchParams.set("text", layer.type === 'text' ? value : niche);
                geoUrl.searchParams.set("filter", `place:${areaPlaceId}`);
                geoUrl.searchParams.set("limit", "20");
                geoUrl.searchParams.set("offset", offset.toString());
                geoUrl.searchParams.set("lang", "pt");
                geoUrl.searchParams.set("apiKey", apiKey);

                const res = await fetch(geoUrl.toString());
                if (!res.ok) break;

                const data = await res.json();
                const features = data.features || [];
                rawResultsCount += features.length;

                if (features.length < 20) hasMore = false;
                else offset += 20;

                for (const f of features) {
                  const props = f.properties;
                  if (!props?.name) continue;
                  
                  const key = props.place_id || generateDeterministicId(`${props.name}-${props.lat}-${props.lon}`);
                  if (uniqueResults.has(key)) continue;

                  const relevance = calculateRelevanceScore(props, niche, config);
                  
                  // Skip if irrelevant or if we need high precision and it's just generic
                  if (!rawMode) {
                    if (relevance.level === 'IRRELEVANTE') continue;
                    if (precision === 'alta' && relevance.level === 'GENÉRICA') continue;
                  }

                  uniqueResults.set(key, {
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

                  if (uniqueResults.size >= 30 && !rawMode) break;
                }
                
                // Don't loop infinitely if we aren't finding new items
                if (features.length === 0) hasMore = false;
              }
            }
          }

          // Final Results & Sorting
          const allOpportunities = Array.from(uniqueResults.values());
          
          // Sort by relevance level: DIRETA > RELACIONADA > GENÉRICA
          const levelOrder: Record<string, number> = { 'DIRETA': 0, 'RELACIONADA': 1, 'GENÉRICA': 2, 'IRRELEVANTE': 3 };
          allOpportunities.sort((a, b) => {
            const orderA = levelOrder[a.relevance_level] ?? 99;
            const orderB = levelOrder[b.relevance_level] ?? 99;
            return orderA - orderB;
          });

          const finalOpportunities = allOpportunities.slice(0, 30);
          
          const diagnostic = { 
            requestId,
            queriesExecuted,
            pagesFetched,
            rawResults: rawResultsCount,
            deduplicatedResults: Array.from(uniqueResults.keys()).length,
            relevantResults: allOpportunities.length,
            finalResults: finalOpportunities.length,
            duration: Date.now() - startTime
          };

          return new Response(JSON.stringify({ 
            opportunities: finalOpportunities, 
            diagnostic, 
            stage: "complete",
            version: "v10.0-layered-search" 
          }), {
            headers: { "Content-Type": "application/json" }
          });

        } catch (e: any) {
          return new Response(JSON.stringify({ error: true, stage: "unknown", message: e.message, requestId }), { status: 500 });
        }
      }
    }
  }
});
