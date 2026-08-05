import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

// Schema para a busca via Geoapify
const searchSchema = z.object({
  niche: z.string(),
  state: z.string(),
  city: z.string().optional().nullable(),
});

/**
 * Mapeamento de nichos comerciais para categorias oficiais da Geoapify Places API v2.
 * Apenas categorias verificadas e suportadas devem ser incluídas aqui.
 * Documentação: https://apidocs.geoapify.com/docs/places/categories/
 */
const NICHE_CATEGORY_MAP: Record<string, string> = {
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
  "Hamburguer": "catering.restaurant.burger",
  "Oficina": "service.vehicle.repair",
};

/**
 * Definição centralizada de relevância por nicho.
 * Utilizada para filtrar e pontuar resultados da Geoapify.
 */
interface RelevanceConfig {
  positiveTerms: string[];
  positiveCategories: string[];
  negativeTerms: string[];
  negativeCategories: string[];
  minScore: number;
}

const RELEVANCE_CONFIGS: Record<string, RelevanceConfig> = {
  "Academia": {
    positiveTerms: ["academia", "fitness", "musculação", "crossfit", "centro de treinamento", "treinamento funcional", "gym", "studio fitness", "ct ", "personal trainer", "treinamento esportivo", "pilates"],
    positiveCategories: ["leisure.spa", "leisure.fitness_centre"],
    negativeTerms: ["supermercado", "carrefour", "clínica", "hospital", "farmácia", "parque", "praça", "banco", "escola", "igreja", "rua", "avenida", "bairro", "residência", "condomínio", "edifício"],
    negativeCategories: ["healthcare", "commercial.supermarket", "leisure.park", "education", "religion", "service.financial", "accommodation"],
    minScore: 10,
  },
  "Oficina": {
    positiveTerms: ["oficina", "mecânica", "auto center", "reparos automotivos", "lanternagem", "pintura automotiva", "freios", "suspensão", "pneus", "centro automotivo", "car service"],
    positiveCategories: ["service.vehicle.repair", "commercial.vehicle"],
    negativeTerms: ["concessionária", "venda de carros", "estacionamento", "lava jato", "supermercado", "clínica", "rua", "avenida"],
    negativeCategories: ["commercial.supermarket", "healthcare", "parking"],
    minScore: 10,
  },
  "Imobiliária": {
    positiveTerms: ["imobiliária", "imóveis", "corretor", "venda", "aluguel", "negócios imobiliários", "properties", "real estate"],
    positiveCategories: ["office", "commercial"],
    negativeTerms: ["condomínio", "edifício", "residencial", "rua", "avenida", "supermercado"],
    negativeCategories: ["accommodation", "commercial.supermarket"],
    minScore: 10,
  },
  "Contabilidade": {
    positiveTerms: ["contabilidade", "contador", "contábil", "assessoria contábil", "escritório contábil", "accounting"],
    positiveCategories: ["office"],
    negativeTerms: ["advocacia", "jurídico", "rua", "avenida"],
    negativeCategories: ["healthcare", "accommodation"],
    minScore: 10,
  },
  "Advocacia": {
    positiveTerms: ["advocacia", "advogado", "jurídico", "escritório de advocacia", "direito", "law", "legal"],
    positiveCategories: ["office"],
    negativeTerms: ["contabilidade", "rua", "avenida"],
    negativeCategories: ["healthcare", "accommodation"],
    minScore: 10,
  },
  "Fotografia": {
    positiveTerms: ["fotografia", "fotógrafo", "estúdio fotográfico", "foto", "photo", "studio"],
    positiveCategories: ["service", "commercial"],
    negativeTerms: ["rua", "avenida"],
    negativeCategories: ["healthcare", "accommodation"],
    minScore: 10,
  },
  "Eventos": {
    positiveTerms: ["eventos", "buffet", "salão de festas", "casa de festas", "organização de eventos", "cerimonial", "party"],
    positiveCategories: ["entertainment", "catering"],
    negativeTerms: ["igreja", "escola", "rua", "avenida"],
    negativeCategories: ["religion", "education"],
    minScore: 10,
  },
  "Hamburgueria": {
    positiveTerms: ["hamburgueria", "burger", "hambúrguer", "artesanal", "lanches"],
    positiveCategories: ["catering.restaurant.burger"],
    negativeTerms: ["pizzaria", "oriental", "rua", "avenida"],
    negativeCategories: ["catering.restaurant.pizza"],
    minScore: 10,
  },
  "Barbearia": {
    positiveTerms: ["barbearia", "barbeiro", "barber", "beard", "corte masculino"],
    positiveCategories: ["service.beauty"],
    negativeTerms: ["feminino", "depilação", "unhas", "rua", "avenida"],
    negativeCategories: ["healthcare"],
    minScore: 10,
  },
  "Clínica": {
    positiveTerms: ["clínica", "médica", "saúde", "consultório", "especialidades", "health", "clinic"],
    positiveCategories: ["healthcare.clinic_or_praxis", "healthcare.hospital"],
    negativeTerms: ["academia", "fitness", "rua", "avenida"],
    negativeCategories: ["leisure.fitness_centre"],
    minScore: 10,
  },
};

function calculateRelevance(item: any, niche: string, searchNiche: string): number {
  const name = (item.name || "").toLowerCase();
  const categories = (item.categories || []);
  const config = RELEVANCE_CONFIGS[searchNiche];
  
  let score = 0;

  // Se for "Outros", usamos o termo pesquisado para relevância básica
  const targetTerms = config?.positiveTerms || [niche.toLowerCase()];
  const negativeTerms = config?.negativeTerms || ["rua", "avenida", "travessa", "bairro", "praça", "parque"];
  const positiveCats = config?.positiveCategories || [];
  const negativeCats = config?.negativeCategories || [];

  // 1. Verificar termos negativos críticos (Descarte imediato)
  if (negativeTerms.some(term => name.includes(term))) {
    return -100;
  }

  // 2. Verificar categorias negativas críticas (Descarte imediato)
  if (categories.some((cat: string) => negativeCats.some(negCat => cat === negCat || cat.startsWith(negCat + ".")))) {
    return -100;
  }

  // 3. Pontuar por termos positivos no nome
  for (const term of targetTerms) {
    if (name.includes(term)) {
      score += 20;
    }
  }

  // 4. Pontuar por categorias positivas
  for (const cat of categories) {
    if (positiveCats.some(posCat => cat === posCat || cat.startsWith(posCat + "."))) {
      score += 30;
    }
  }

  // Se não tem config específica mas é "Outros", tenta match textual simples
  if (!config && name.includes(niche.toLowerCase())) {
    score += 50;
  }

  return score;
}

/**
 * Categorias oficiais suportadas pela Geoapify Places API v2.
 * Esta lista serve como um "gate" de segurança para evitar erros 400.
 * Se a categoria não estiver aqui, ela NÃO deve ser enviada no parâmetro 'categories'.
 */
const OFFICIAL_CATEGORIES = new Set([
  "accommodation", "accommodation.hotel", "accommodation.hostel", "accommodation.guest_house", "accommodation.apartment",
  "activity", "activity.community_center",

  "airport", "airport.international",
  "commercial", "commercial.clothing", "commercial.food", "commercial.food.bakery", "commercial.pet", "commercial.supermarket",
  "catering", "catering.restaurant", "catering.restaurant.burger", "catering.restaurant.pizza", "catering.restaurant.thai",
  "catering.cafe", "catering.bar", "catering.pub", "catering.fast_food",
  "education", "education.school", "education.university",
  "entertainment", "entertainment.cinema", "entertainment.culture",
  "healthcare", "healthcare.hospital", "healthcare.clinic_or_praxis", "healthcare.dentist", "healthcare.pharmacy",
  "heritage",
  "leisure", "leisure.park", "leisure.playground",
  "natural",
  "office", "office.government",
  "parking",
  "pet",
  "production",
  "public_transport",
  "religion",
  "rental",
  "service", "service.beauty", "service.vehicle", "service.vehicle.repair",
  "tourism",
  "camping"
]);

/**
 * Valida se uma estratégia de busca é tecnicamente válida para a Geoapify v2.
 * A API v2 EXIGE 'categories' ou 'type'.
 */
function validateSearchStrategy(niche: string, categories: string | null): { valid: boolean; strategy: "categories" | "type+text"; error?: string } {
  // BLOQUEIO FINAL DE SEGURANÇA: NUNCA permitir activity.sport
  if (categories && (categories.includes("activity.sport") || categories.includes("activity.sport.swimming_pool"))) {
    return { 
      valid: false, 
      strategy: "categories", 
      error: "Configuração de categoria inválida detectada (activity.sport bloqueada)." 
    };
  }

  if (categories && categories.length > 0) {
    return { valid: true, strategy: "categories" };
  }
  
  if (niche && niche.trim().length > 0) {
    // Para busca textual, usamos 'type=commercial' como âncora estrutural obrigatória
    return { valid: true, strategy: "type+text" };
  }

  return { 
    valid: false, 
    strategy: "type+text", 
    error: "A busca requer um nicho definido ou uma categoria válida." 
  };
}

function getGeoapifyCategories(niche: string, requestId: string): { categories: string | null; log: string } {
  const mapped = NICHE_CATEGORY_MAP[niche];
  
  if (!mapped) {
    return { categories: null, log: `[Search][${requestId}] Niche "${niche}" not mapped. Using structural text search.` };
  }

  const requestedCategories = mapped.split(",");
  const validatedCategories: string[] = [];

  for (const cat of requestedCategories) {
    if (OFFICIAL_CATEGORIES.has(cat)) {
      validatedCategories.push(cat);
    }
  }

  const finalCategories = validatedCategories.length > 0 ? validatedCategories.join(",") : null;
  return { categories: finalCategories, log: `[Search][${requestId}] Categories: ${finalCategories}` };
}

/**
 * Função simples para gerar um ID determinístico sem dependências de Node.js (crypto)
 * que possam causar crash no runtime Edge.
 */
function generateDeterministicId(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(16);
}

export const Route = createFileRoute("/api/prospecting/search")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const requestId = Math.random().toString(36).substring(2, 15);
        let stage = "init";
        console.log(`[Search][${requestId}] Request iniciada: ${request.method} ${request.url}`);
        
        try {
          // 1. Validar autenticação e autorização
          stage = "auth";
          const authHeader = request.headers.get("Authorization");
          if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return new Response(JSON.stringify({ error: "Não autorizado", stage }), {
              status: 401,
              headers: { "Content-Type": "application/json" },
            });
          }

          const token = authHeader.split(" ")[1];
          const { data: { user }, error: authError } = await supabase.auth.getUser(token);

          if (authError || !user) {
            return new Response(JSON.stringify({ error: "Sessão inválida ou expirada", stage }), {
              status: 401,
              headers: { "Content-Type": "application/json" },
            });
          }

          // Verificar papel
          stage = "roles";
          const { data: roles, error: rolesError } = await supabaseAdmin
            .from("user_roles")
            .select("role")
            .eq("user_id", user.id);
          
          if (rolesError) {
            return new Response(JSON.stringify({ error: "Erro ao verificar permissões", stage }), { 
              status: 500,
              headers: { "Content-Type": "application/json" }
            });
          }

          const userRoles = (roles ?? []).map(r => String(r.role).toLowerCase());
          const allowedRoles = ["admin", "vendedor", "diretor", "rh"];
          if (!userRoles.some(r => allowedRoles.includes(r))) {
            return new Response(JSON.stringify({ error: "Acesso negado para o seu perfil", stage }), {
              status: 403,
              headers: { "Content-Type": "application/json" },
            });
          }

          // 2. Validar input
          stage = "input";
          const body = await request.json();
          const { niche, state, city } = searchSchema.parse(body);

          // 3. Obter API Key (Secret)
          stage = "secrets";
          const apiKey = process.env["GEOAPIFY_API_KEY"];
          if (!apiKey) {
            return new Response(
              JSON.stringify({ error: "Serviço de prospecção não configurado (API Key ausente).", stage }),
              { status: 500, headers: { "Content-Type": "application/json" } }
            );
          }

          // 4. Geocodificação (Resolver local para obter Place ID da área)
          stage = "geocoding";
          const locationText = city && city.trim() ? `${city}, ${state}, Brasil` : `${state}, Brasil`;
          console.log(`[Search][${requestId}] Geocodificando: ${locationText}`);
          
          const geocodeUrl = `https://api.geoapify.com/v1/geocode/search?text=${encodeURIComponent(locationText)}&limit=1&format=json&apiKey=${apiKey}`;
          const geocodeResponse = await fetch(geocodeUrl);
          
          if (!geocodeResponse.ok) {
            return new Response(JSON.stringify({ error: "Falha ao resolver localização geográfica", stage, status: geocodeResponse.status }), { status: 502 });
          }
          
          const geocodeData = await geocodeResponse.json();
          const locationResult = geocodeData.results?.[0];
          
          if (!locationResult) {
            return new Response(JSON.stringify({ error: `Localização não encontrada: ${locationText}`, stage }), { status: 404 });
          }

          const areaPlaceId = locationResult.place_id;
          console.log(`[Search][${requestId}] Local resolvido. Area Place ID: ${areaPlaceId}`);

          // 5. Chamar Geoapify Places API v2
          stage = "geoapify_call";
          const { categories, log: catLog } = getGeoapifyCategories(niche, requestId);
          console.log(catLog);
          
          const strategy = validateSearchStrategy(niche, categories);
          if (!strategy.valid) {
            return new Response(JSON.stringify({ error: strategy.error, stage }), { 
              status: 400, 
              headers: { "Content-Type": "application/json" } 
            });
          }
          
          // Construindo URL da v2
          const geoUrl = new URL("https://api.geoapify.com/v2/places");
          
          if (strategy.strategy === "categories") {
            geoUrl.searchParams.set("categories", categories!);
          } else {
            // Busca textual combinada com filtro geográfico e âncora estrutural 'type'
            geoUrl.searchParams.set("type", "commercial");
            geoUrl.searchParams.set("text", niche);
          }
          
          geoUrl.searchParams.set("filter", `place:${areaPlaceId}`);
          geoUrl.searchParams.set("limit", "30");
          geoUrl.searchParams.set("lang", "pt");
          geoUrl.searchParams.set("apiKey", apiKey);
          
          console.log(`[Search][${requestId}] Strategy: ${strategy.strategy} | Niche: ${niche}`);
          console.log(`[Search][${requestId}] Request URL: ${geoUrl.origin}${geoUrl.pathname}?${geoUrl.searchParams.toString().replace(apiKey, "HIDDEN")}`);

          
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 15000);
          
          let response;
          try {
            response = await fetch(geoUrl.toString(), { signal: controller.signal });
          } finally {
            clearTimeout(timeoutId);
          }
          
          if (!response.ok) {
            const rawBody = await response.text();
            let errorData;
            try { errorData = JSON.parse(rawBody); } catch { errorData = { message: rawBody.substring(0, 100) }; }
            
            return new Response(JSON.stringify({ 
              error: `Erro no provedor (Geoapify v2 ${response.status}): ${errorData.message || 'Erro desconhecido'}`,
              stage,
              status: response.status,
              requestId
            }), { status: 502, headers: { "Content-Type": "application/json" } });
          }

          stage = "geoapify_parse";
          const data = await response.json();

          // 6. Mapear e Filtrar resultados por Relevância
          stage = "mapping";
          const scoredOpportunities = (data.features || []).map((f: any) => {
            const props = f.properties;
            if (!props || !props.name) return null;
            
            const relevanceScore = calculateRelevance(props, niche, niche);
            
            // Se o score for muito baixo ou negativo, descarta
            const minAllowedScore = RELEVANCE_CONFIGS[niche]?.minScore ?? 10;
            if (relevanceScore < minAllowedScore) {
              console.log(`[Search][${requestId}] Descartado por baixa relevância (${relevanceScore}): ${props.name}`);
              return null;
            }

            const website = props.website || null;
            let level = "alta";
            if (website) {
              level = "baixa";
            } else if (props.contact?.social_media || props.datasource?.sourcename?.includes("facebook") || props.datasource?.sourcename?.includes("instagram")) {
              level = "media";
            }

            const fallbackId = generateDeterministicId(`${props.name}-${props.lat}-${props.lon}`);

            return {
              data: {
                business_name: props.name,
                category: niche,
                phone: props.contact?.phone || null,
                email: props.contact?.email || null,
                address: props.address_line1 || props.formatted || "Endereço não disponível",
                city: props.city || city || null,
                state: state,
                website: website,
                instagram: props.contact?.instagram || null,
                facebook: props.contact?.facebook || null,
                google_maps_url: null,
                lat: props.lat || null,
                lon: props.lon || null,
                place_id: props.place_id || fallbackId,
                rating: props.rating || null,
                review_count: props.review_count || 0,
                opportunity_level: level,
                source: "Geoapify",
                status: "nova"
              },
              score: relevanceScore
            };
          }).filter(Boolean);

          // Ordenar por score descendente e pegar no máximo 30
          const opportunities = scoredOpportunities
            .sort((a: any, b: any) => b.score - a.score)
            .slice(0, 30)
            .map((item: any) => item.data);

          stage = "response";
          const diagnostic = "prospecting-search-v7.0-relevance-engine";
          
          return new Response(JSON.stringify({ 
            opportunities, 
            diagnostic, 
            requestId,
            stage: "success",
            status: 200,
            meta: {
              endpoint: "/v2/places",
              categories,
              strategy: strategy.strategy,
              fallbackLog: catLog || null,
              filter: `place:${areaPlaceId}`,
              resolvedLocation: locationText
            }
          }), {
            status: 200,
            headers: { 
              "Content-Type": "application/json",
              "X-Diagnostic": diagnostic,
              "X-Request-ID": requestId
            }
          });

        } catch (error: any) {
          console.error(`[Search][${requestId}] CRASH no stage: ${stage}:`, error);
          return new Response(
            JSON.stringify({ 
              error: "Falha ao processar solicitação de prospecção.", 
              stage,
              detail: error.message || "Unknown error",
              requestId
            }),
            { status: 500, headers: { "Content-Type": "application/json" } }
          );
        }
      }
    }
  }
});
