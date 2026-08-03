import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

// Schema para a busca via Geoapify
const searchSchema = z.object({
  niche: z.string(),
  state: z.string(),
  city: z.string(),
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
        let stage = "init";
        try {
          // 1. Validar autenticação e autorização
          stage = "auth";
          console.log("[Search] Iniciando estágio: auth");
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
            console.error("[Search] Erro auth:", authError);
            return new Response(JSON.stringify({ error: "Sessão inválida ou expirada", stage }), {
              status: 401,
              headers: { "Content-Type": "application/json" },
            });
          }

          // Verificar papel
          stage = "roles";
          console.log("[Search] Iniciando estágio: roles para usuário", user.id);
          const { data: roles, error: rolesError } = await supabaseAdmin
            .from("user_roles")
            .select("role")
            .eq("user_id", user.id);
          
          if (rolesError) {
            console.error("[Search] Erro ao buscar papéis:", rolesError);
            return new Response(JSON.stringify({ error: "Erro ao verificar permissões", stage }), { 
              status: 500,
              headers: { "Content-Type": "application/json" }
            });
          }

          const userRoles = (roles ?? []).map(r => String(r.role).toLowerCase());
          console.log(`[Search] Usuário ${user.id} possui roles:`, userRoles);

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
          console.log("[Search] Iniciando estágio: input");
          const body = await request.json();
          const { niche, state, city } = searchSchema.parse(body);

          // 3. Obter API Key (Secret)
          stage = "secrets";
          console.log("[Search] Iniciando estágio: secrets");
          const apiKey = process.env["GEOAPIFY_API_KEY"];
          if (!apiKey) {
            console.error("[Search] GEOAPIFY_API_KEY não configurada.");
            return new Response(
              JSON.stringify({ error: "Serviço de prospecção não configurado (API Key ausente).", stage }),
              { status: 500, headers: { "Content-Type": "application/json" } }
            );
          }

          // 4. Registrar a pesquisa no log
          console.log(`[Search] Executando: ${userId} - ${niche}, ${city}/${state}`);

          // 5. Chamar Geoapify Places API
          stage = "geoapify_call";
          console.log("[Search] Iniciando estágio: geoapify_call");
          const text = `${niche} in ${city}, ${state}, Brazil`;
          const geoUrl = `https://api.geoapify.com/v1/places?text=${encodeURIComponent(text)}&apiKey=${apiKey}&limit=20&lang=pt`;
          
          const response = await fetch(geoUrl);
          console.log(`[Search] Geoapify status: ${response.status} ${response.statusText}`);

          if (!response.ok) {
            let errorData;
            try {
              errorData = await response.json();
            } catch (e) {
              errorData = "Resposta não-JSON da Geoapify";
            }
            console.error("[Search] Erro Geoapify response:", errorData);
            
            if (response.status === 429) {
              return new Response(JSON.stringify({ error: "Limite de consultas da API atingido.", stage }), { status: 429 });
            }
            return new Response(JSON.stringify({ error: "Erro ao consultar provedor de dados externo.", stage, status: response.status }), { status: 502 });
          }

          stage = "geoapify_parse";
          console.log("[Search] Iniciando estágio: geoapify_parse");
          const data = await response.json();

          // 6. Mapear resultados
          stage = "mapping";
          console.log("[Search] Iniciando estágio: mapping. Resultados brutos:", data.features?.length || 0);
          
          if (!data.features || !Array.isArray(data.features)) {
             console.warn("[Search] Geoapify retornou features inválido ou vazio.");
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
            const fallbackId = generateDeterministicId(`${props.name}-${props.lat}-${props.lon}-${i}`);

            return {
              business_name: props.name || props.address_line1 || "Empresa sem nome",
              category: niche,
              phone: props.contact?.phone || null,
              email: props.contact?.email || null,
              address: props.address_line1 || props.formatted || "Endereço não disponível",
              city: city,
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

          console.log(`[Search] Estágio mapping finalizado. Oportunidades processadas: ${opportunities.length}`);

          // 7. Retornar resultados (Serialization stage)
          stage = "serialization";
          console.log("[Search] Iniciando estágio: serialization");
          const jsonResponse = JSON.stringify({ opportunities });
          
          stage = "response";
          return new Response(jsonResponse, {
            status: 200,
            headers: { "Content-Type": "application/json" }
          });

        } catch (error: any) {
          console.error(`[Search] CRASH no stage: ${stage}:`, error);
          return new Response(
            JSON.stringify({ 
              error: "Falha ao processar solicitação de prospecção.", 
              stage,
              detail: error.message || "Unknown error"
            }),
            { status: 500, headers: { "Content-Type": "application/json" } }
          );
        }
      }
    }
  }
});
    }
  }
});