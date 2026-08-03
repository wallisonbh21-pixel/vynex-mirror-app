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
          console.log(`[Search][${requestId}] Estágio: auth`);
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
            console.error(`[Search][${requestId}] Erro auth:`, authError);
            return new Response(JSON.stringify({ error: "Sessão inválida ou expirada", stage }), {
              status: 401,
              headers: { "Content-Type": "application/json" },
            });
          }

          // Verificar papel
          stage = "roles";
          console.log(`[Search][${requestId}] Estágio: roles para usuário`, user.id);
          const { data: roles, error: rolesError } = await supabaseAdmin
            .from("user_roles")
            .select("role")
            .eq("user_id", user.id);
          
          if (rolesError) {
            console.error(`[Search][${requestId}] Erro ao buscar papéis:`, rolesError);
            return new Response(JSON.stringify({ error: "Erro ao verificar permissões", stage }), { 
              status: 500,
              headers: { "Content-Type": "application/json" }
            });
          }

          const userRoles = (roles ?? []).map(r => String(r.role).toLowerCase());
          console.log(`[Search][${requestId}] Usuário ${user.id} possui roles:`, userRoles);

          const allowedRoles = ["admin", "vendedor", "diretor", "rh"];
          const hasAccess = userRoles.some(r => allowedRoles.includes(r));
          
          if (!hasAccess) {
            return new Response(JSON.stringify({ 
              error: "Acesso negado para o seu perfil",
              stage,
              debug_roles: userRoles
            }), {
              status: 403,
              headers: { "Content-Type": "application/json" },
            });
          }

          const userId = user.id;

          // 2. Validar input
          stage = "input";
          console.log(`[Search][${requestId}] Estágio: input`);
          const body = await request.json();
          const { niche, state, city } = searchSchema.parse(body);

          // 3. Obter API Key (Secret)
          stage = "secrets";
          console.log(`[Search][${requestId}] Estágio: secrets`);
          const apiKey = process.env["GEOAPIFY_API_KEY"];
          if (!apiKey) {
            console.error(`[Search][${requestId}] GEOAPIFY_API_KEY não configurada.`);
            return new Response(
              JSON.stringify({ error: "Serviço de prospecção não configurado (API Key ausente).", stage }),
              { status: 500, headers: { "Content-Type": "application/json" } }
            );
          }

          // 4. Registrar a pesquisa no log
          console.log(`[Search][${requestId}] Executando: ${userId} - ${niche}, ${city}/${state}`);

          // 5. Chamar Geoapify Places API
          stage = "geoapify_call";
          console.log(`[Search][${requestId}] Estágio: geoapify_call`);
          
          /**
           * REGRA DE NEGÓCIO: 
           * - O erro 400 anterior ocorreu pelo uso de "type=amenity", que não é aceito pela Geoapify no v1/places.
           * - A melhor estratégia para buscas por nome/nicho é a busca textual (v1/places) 
           *   com o termo completo "Nicho em Cidade, Estado".
           */
          
          const locationText = city && city.trim() ? `${city}, ${state}, Brasil` : `${state}, Brasil`;
          const textQuery = `${niche} em ${locationText}`;
          const geoUrl = `https://api.geoapify.com/v1/places?text=${encodeURIComponent(textQuery)}&limit=20&lang=pt&apiKey=${apiKey}`;
          
          console.log(`[Search][${requestId}] URL Geoapify: https://api.geoapify.com/v1/places?text=${encodeURIComponent(textQuery)}&apiKey=HIDDEN...`);
          
          // Usando um timeout explícito para o fetch externo
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 15000);
          
          let response;
          try {
            response = await fetch(geoUrl, { signal: controller.signal });
          } finally {
            clearTimeout(timeoutId);
          }
          
          console.log(`[Search][${requestId}] Geoapify status: ${response.status} ${response.statusText}`);

          if (!response.ok) {
            let errorData;
            let rawBody = "";
            try {
              rawBody = await response.text();
              errorData = JSON.parse(rawBody);
            } catch (e) {
              errorData = { error: "Resposta inválida (não-JSON) da Geoapify", raw: rawBody.substring(0, 100) };
            }
            
            console.error(`[Search][${requestId}] Erro Geoapify response (Status ${response.status}):`, errorData);
            
            if (response.status === 429) {
              return new Response(JSON.stringify({ error: "Limite de consultas da API atingido.", stage }), { status: 429 });
            }
            
            // Retornar erro detalhado para facilitar o debug
            return new Response(JSON.stringify({ 
              error: `Erro no provedor (Geoapify ${response.status}): ${typeof errorData === 'object' ? errorData.message || errorData.error || 'Erro desconhecido' : errorData}`,
              stage,
              status: response.status,
              requestId
            }), { 
              status: 502,
              headers: { "Content-Type": "application/json" }
            });
          }

          stage = "geoapify_parse";
          console.log(`[Search][${requestId}] Estágio: geoapify_parse`);
          const data = await response.json();
          console.log(`[Search][${requestId}] Dados Geoapify parseados. Status: ${data.status || 'OK'}`);

          // 6. Mapear resultados
          stage = "mapping";
          console.log(`[Search][${requestId}] Estágio: mapping. Resultados brutos:`, data.features?.length || 0);
          
          if (!data.features || !Array.isArray(data.features)) {
             console.warn(`[Search][${requestId}] Geoapify retornou features inválido ou vazio.`);
          }

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

            // Gerar um ID determinístico seguro para Web/Edge
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
              google_maps_url: props.datasource?.raw?.osm_id ? `https://www.openstreetmap.org/node/${props.datasource.raw.osm_id}` : null,
              place_id: props.place_id || fallbackId,
              rating: props.rating || null,
              review_count: props.review_count || 0,
              opportunity_level: level,
              source: "Geoapify",
              status: "nova"
            };
          }).filter(Boolean);

          console.log(`[Search][${requestId}] Estágio mapping finalizado. Oportunidades processadas: ${opportunities.length}`);

          // 7. Retornar resultados (Serialization stage)
          stage = "serialization";
          console.log(`[Search][${requestId}] Estágio: serialization`);
          
          stage = "response";
          const diagnostic = "prospecting-search-v2.2";
          console.log(`[Search][${requestId}] Finalizando com sucesso. Diagnostic: ${diagnostic}`);
          
          return new Response(JSON.stringify({ 
            opportunities, 
            diagnostic, 
            requestId,
            stage: "success",
            status: 200
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
