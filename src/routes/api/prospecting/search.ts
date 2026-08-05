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
 * Expansão semântica dinâmica de nichos para termos de busca.
 * Transforma um nicho em um ecossistema de termos relacionados para busca textual.
 */
function expandNicheKeywords(niche: string): string[] {
  const normalized = niche.toLowerCase().trim();
  
  const expansions: Record<string, string[]> = {
    "academia": ["academia", "fitness", "musculação", "crossfit", "centro de treinamento", "treinamento funcional", "gym", "studio fitness", "personal trainer", "pilates", "suplementos", "artigos esportivos"],
    "oficina": ["oficina", "mecânica", "auto center", "reparos automotivos", "lanternagem", "pintura automotiva", "pneus", "centro automotivo", "car service", "freios"],
    "imobiliária": ["imobiliária", "imóveis", "corretor", "venda de imóveis", "aluguel de imóveis", "negócios imobiliários", "real estate", "consultoria imobiliária"],
    "contabilidade": ["contabilidade", "contador", "contábil", "assessoria contábil", "escritório contábil", "escritório de contabilidade", "auditoria"],
    "advocacia": ["advocacia", "advogado", "jurídico", "escritório de advocacia", "direito", "law office", "consultoria jurídica"],
    "pet shop": ["pet shop", "pet", "animais", "banho e tosa", "veterinária", "clínica veterinária", "rações", "acessórios para animais"],
    "loja de roupas": ["loja de roupas", "vestuário", "moda", "boutique", "confecção", "roupas femininas", "roupas masculinas", "outlet"],
  };

  return expansions[normalized] || [normalized];
}

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
    positiveTerms: ["academia", "fitness", "musculação", "crossfit", "centro de treinamento", "treinamento funcional", "gym", "studio fitness", "ct ", "personal trainer", "treinamento esportivo", "pilates", "suplemento", "esportivo"],
    positiveCategories: ["leisure.spa", "leisure.fitness_centre", "commercial.clothing", "commercial.food"],
    negativeTerms: ["supermercado", "carrefour", "clínica médica", "hospital", "farmácia", "parque", "praça", "banco", "escola", "igreja", "rua", "avenida", "bairro", "residência", "condomínio", "edifício"],
    negativeCategories: ["healthcare", "commercial.supermarket", "leisure.park", "education", "religion", "service.financial", "accommodation"],
    minScore: 5, // Reduzido para ser menos rígido
  },
  "Oficina": {
    positiveTerms: ["oficina", "mecânica", "auto center", "reparos automotivos", "lanternagem", "pintura automotiva", "freios", "suspensão", "pneus", "centro automotivo", "car service"],
    positiveCategories: ["service.vehicle.repair", "commercial.vehicle"],
    negativeTerms: ["supermercado", "clínica", "rua", "avenida", "banco", "escola", "igreja"],
    negativeCategories: ["commercial.supermarket", "healthcare", "parking", "education", "religion"],
    minScore: 5,
  },
  "Imobiliária": {
    positiveTerms: ["imobiliária", "imóveis", "corretor", "venda", "aluguel", "negócios imobiliários", "properties", "real estate"],
    positiveCategories: ["office", "commercial"],
    negativeTerms: ["condomínio", "edifício", "residencial", "rua", "avenida", "supermercado"],
    negativeCategories: ["accommodation", "commercial.supermarket"],
    minScore: 5,
  },
  "Contabilidade": {
    positiveTerms: ["contabilidade", "contador", "contábil", "assessoria contábil", "escritório contábil", "accounting"],
    positiveCategories: ["office"],
    negativeTerms: ["rua", "avenida", "supermercado", "clínica"],
    negativeCategories: ["healthcare", "accommodation", "commercial.supermarket"],
    minScore: 5,
  },
  "Pet Shop": {
    positiveTerms: ["pet shop", "pet", "animais", "banho e tosa", "veterinária", "rações", "grooming", "animal"],
    positiveCategories: ["commercial.pet", "healthcare.clinic_or_praxis"],
    negativeTerms: ["supermercado", "hospital humano", "clínica médica", "rua", "avenida"],
    negativeCategories: ["commercial.supermarket", "accommodation"],
    minScore: 5,
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

          // 5. Estratégia de Busca Inteligente com Expansão Semântica
          stage = "discovery";
          const expandedTerms = expandNicheKeywords(niche);
          const allFetchedFeatures: any[] = [];
          
          console.log(`[Search][${requestId}] Nicho: ${niche} | Termos expandidos: ${expandedTerms.join(", ")}`);

          // Para cada termo expandido, fazemos uma busca
          // Nota: Em produção, poderíamos paralelizar isso, mas vamos fazer sequencialmente com limite de termos para estabilidade
          const termsToSearch = expandedTerms.slice(0, 5); // Limitar a 5 termos principais para evitar rate limit ou timeout excessivo
          
          for (const term of termsToSearch) {
            const { categories, log: catLog } = getGeoapifyCategories(term, requestId);
            const strategy = validateSearchStrategy(term, categories);
            
            if (!strategy.valid) continue;

            const geoUrl = new URL("https://api.geoapify.com/v2/places");
            if (strategy.strategy === "categories") {
              geoUrl.searchParams.set("categories", categories!);
            } else {
              geoUrl.searchParams.set("type", "commercial");
              geoUrl.searchParams.set("text", term);
            }
            
            geoUrl.searchParams.set("filter", `place:${areaPlaceId}`);
            geoUrl.searchParams.set("limit", "20"); // Buscar 20 de cada termo para ter margem de deduplicação
            geoUrl.searchParams.set("lang", "pt");
            geoUrl.searchParams.set("apiKey", apiKey);

            try {
              const controller = new AbortController();
              const timeoutId = setTimeout(() => controller.abort(), 8000);
              const response = await fetch(geoUrl.toString(), { signal: controller.signal });
              clearTimeout(timeoutId);

              if (response.ok) {
                const data = await response.json();
                if (data.features) {
                  allFetchedFeatures.push(...data.features);
                }
              }
            } catch (e) {
              console.error(`[Search][${requestId}] Erro ao buscar termo "${term}":`, e);
              // Continuar para o próximo termo
            }
          }

          const countBeforeDeduplication = allFetchedFeatures.length;

          // 6. Deduplicação por Place ID ou Nome + Coordenadas
          stage = "deduplication";
          const uniqueFeatures = new Map();
          for (const f of allFetchedFeatures) {
            const props = f.properties;
            if (!props || !props.name) continue;
            
            const key = props.place_id || generateDeterministicId(`${props.name}-${props.lat}-${props.lon}`);
            if (!uniqueFeatures.has(key)) {
              uniqueFeatures.set(key, f);
            }
          }
          
          const countAfterDeduplication = uniqueFeatures.size;

          // 7. Mapear e Filtrar resultados por Relevância
          stage = "mapping";
          const scoredOpportunities = Array.from(uniqueFeatures.values()).map((f: any) => {
            const props = f.properties;
            const relevanceScore = calculateRelevance(props, niche, niche);
            
            // Se o score for muito negativo (bloqueio absoluto), descarta
            if (relevanceScore <= -50) {
              return null;
            }

            // Para nichos conhecidos, aplicamos o minScore, mas para "Outros" somos mais permissivos
            const minAllowedScore = RELEVANCE_CONFIGS[niche]?.minScore ?? 0;
            if (relevanceScore < minAllowedScore) {
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

          const countAfterRelevance = scoredOpportunities.length;

          // Ordenar por score descendente e pegar no máximo 30
          const opportunities = (scoredOpportunities as any[])
            .sort((a: any, b: any) => b.score - a.score)
            .slice(0, 30)
            .map((item: any) => item.data);

          stage = "response";
          const diagnostic = "v8.0-semantic-expansion";
          
          return new Response(JSON.stringify({ 
            opportunities, 
            diagnostic, 
            requestId,
            stage: "success",
            status: 200,
            meta: {
              nicheOriginal: niche,
              termosExpandidos: expandedTerms,
              countBeforeDeduplication,
              countAfterDeduplication,
              countAfterRelevance,
              countFinal: opportunities.length
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
