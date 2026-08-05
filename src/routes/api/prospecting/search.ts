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
 * Documentação: https://apidocs.geoapify.com/docs/places/categories/
 */
const NICHE_CATEGORY_MAP: Record<string, string> = {
  "Hamburgueria": "catering.restaurant.burger,catering.restaurant",
  "Restaurante": "catering.restaurant",
  "Pizzaria": "catering.restaurant.pizza,catering.restaurant",
  "Bar": "catering.bar,catering.pub",
  "Café": "catering.cafe",
  "Padaria": "commercial.food.bakery,catering.cafe",
  "Hotel": "accommodation.hotel,accommodation.hostel",
  "Pousada": "accommodation.guest_house,accommodation.hotel",
  "Farmácia": "healthcare.pharmacy",
  "Loja de roupas": "commercial.clothing",
  "Dentista": "healthcare.dentist",
  "Clínica": "healthcare.clinic_or_praxis,healthcare.hospital",
  "Pet Shop": "commercial.pet",
  "Academia": "leisure.fitness,leisure.sports_centre",
  "Salão de beleza": "service.beauty",
  "Barbearia": "service.beauty",
  "Oficina": "service.vehicle.repair",
  "Imobiliária": "commercial.estate_agent",
  "Contabilidade": "service.financial",
  "Advocacia": "service.legal",
  "Fotografia": "service.photography",
  "Eventos": "entertainment.event_venue",
};

/**
 * Categorias oficiais suportadas pela Geoapify Places API v2.
 * Documentação de referência: https://apidocs.geoapify.com/docs/places/categories/
 */
const OFFICIAL_CATEGORIES = new Set([
  "accommodation", "accommodation.hotel", "accommodation.hostel", "accommodation.guest_house", "accommodation.apartment",
  "activity", "activity.community_center", "activity.sport", "activity.sport.swimming_pool",
  "airport", "airport.international",
  "commercial", "commercial.clothing", "commercial.food", "commercial.food.bakery", "commercial.pet", "commercial.supermarket", "commercial.estate_agent",
  "catering", "catering.restaurant", "catering.restaurant.burger", "catering.restaurant.pizza", "catering.restaurant.thai",
  "catering.cafe", "catering.bar", "catering.pub", "catering.fast_food",
  "education", "education.school", "education.university",
  "entertainment", "entertainment.cinema", "entertainment.culture", "entertainment.event_venue",
  "healthcare", "healthcare.hospital", "healthcare.clinic_or_praxis", "healthcare.dentist", "healthcare.pharmacy",
  "heritage",
  "leisure", "leisure.fitness", "leisure.sports_centre", "leisure.park", "leisure.playground",
  "natural",
  "office", "office.government",
  "parking",
  "pet",
  "production",
  "public_transport",
  "religion",
  "rental",
  "service", "service.beauty", "service.financial", "service.legal", "service.real_estate", "service.photography", "service.event_planner", "service.vehicle", "service.vehicle.repair",
  "tourism",
  "camping"
]);

function getGeoapifyCategories(niche: string, requestId: string): { categories: string; fallbackUsed: boolean; log: string } {
  const mapped = NICHE_CATEGORY_MAP[niche] || "commercial,catering,service";
  const requestedCategories = mapped.split(",");
  const validatedCategories: string[] = [];
  let fallbackUsed = false;
  let log = "";

  for (const cat of requestedCategories) {
    if (OFFICIAL_CATEGORIES.has(cat)) {
      validatedCategories.push(cat);
    } else {
      fallbackUsed = true;
      const parts = cat.split(".");
      let fallback = "commercial"; // Default fallback
      
      // Tenta encontrar o pai mais próximo que seja oficial
      for (let i = parts.length - 1; i > 0; i--) {
        const parent = parts.slice(0, i).join(".");
        if (OFFICIAL_CATEGORIES.has(parent)) {
          fallback = parent;
          break;
        }
      }
      validatedCategories.push(fallback);
      log += `[Fallback][${requestId}] Niche: ${niche}, Invalid: ${cat} -> Used: ${fallback}; `;
    }
  }

  // Deduplicar e juntar
  const finalCategories = [...new Set(validatedCategories)].join(",");
  return { categories: finalCategories, fallbackUsed, log };
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
          const { categories, fallbackUsed, log: fallbackLog } = getGeoapifyCategories(niche, requestId);
          if (fallbackUsed) {
            console.log(fallbackLog);
          }
          
          // Construindo URL da v2
          const geoUrl = new URL("https://api.geoapify.com/v2/places");
          geoUrl.searchParams.set("categories", categories);
          geoUrl.searchParams.set("filter", `place:${areaPlaceId}`);
          geoUrl.searchParams.set("limit", "30"); // Aumentado para 30 conforme solicitado
          geoUrl.searchParams.set("lang", "pt");
          geoUrl.searchParams.set("apiKey", apiKey);
          
          console.log(`[Search][${requestId}] URL Geoapify v2: ${geoUrl.origin}${geoUrl.pathname}?categories=${categories}&filter=place:${areaPlaceId}&limit=30&apiKey=HIDDEN`);
          
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

          // 6. Mapear resultados
          stage = "mapping";
          const opportunities = (data.features || []).map((f: any) => {
            const props = f.properties;
            if (!props) return null;

            const website = props.website || null;
            let level = "alta";
            if (website) {
              level = "baixa";
            } else if (props.contact?.social_media || props.datasource?.sourcename?.includes("facebook") || props.datasource?.sourcename?.includes("instagram")) {
              level = "media";
            }

            const fallbackId = generateDeterministicId(`${props.name}-${props.lat}-${props.lon}`);

            return {
              business_name: props.name || props.address_line1 || "Empresa sem nome",
              category: niche,
              phone: props.contact?.phone || null,
              email: props.contact?.email || null,
              address: props.address_line1 || props.formatted || "Endereço não disponível",
              city: props.city || city || null,
              state: state,
              website: website,
              instagram: props.contact?.instagram || null,
              facebook: props.contact?.facebook || null,
              google_maps_url: null, // Será gerado dinamicamente no frontend com lat/lon
              lat: props.lat || null,
              lon: props.lon || null,
              place_id: props.place_id || fallbackId,
              rating: props.rating || null,
              review_count: props.review_count || 0,
              opportunity_level: level,
              source: "Geoapify",
              status: "nova"
            };
          }).filter(Boolean);

          stage = "response";
          const diagnostic = "prospecting-search-v3.1-v2api-catfixed";
          
          return new Response(JSON.stringify({ 
            opportunities, 
            diagnostic, 
            requestId,
            stage: "success",
            status: 200,
            meta: {
              endpoint: "/v2/places",
              categories,
              fallbackUsed,
              fallbackLog: fallbackLog || null,
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
