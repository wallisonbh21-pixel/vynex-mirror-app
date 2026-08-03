import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { createHmac } from "crypto";

// Schema para a busca via Geoapify
const searchSchema = z.object({
  niche: z.string(),
  state: z.string(),
  city: z.string(),
});

export const Route = createFileRoute("/api/prospecting/search")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let stage = "init";
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
            console.error("Erro auth:", authError);
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
            console.error("Erro ao buscar papéis:", rolesError);
            return new Response(JSON.stringify({ error: "Erro ao verificar permissões", stage }), { 
              status: 500,
              headers: { "Content-Type": "application/json" }
            });
          }

          const userRoles = (roles ?? []).map(r => String(r.role).toLowerCase());
          console.log(`User ${user.id} (${user.email}) has roles:`, userRoles);

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
          const body = await request.json();
          const { niche, state, city } = searchSchema.parse(body);

          // 3. Obter API Key (Secret)
          stage = "secrets";
          const apiKey = process.env["GEOAPIFY_API_KEY"];
          if (!apiKey) {
            console.error("GEOAPIFY_API_KEY não configurada.");
            return new Response(
              JSON.stringify({ error: "Serviço de prospecção não configurado (API Key ausente).", stage }),
              { status: 500, headers: { "Content-Type": "application/json" } }
            );
          }

          // 4. Registrar a pesquisa no log
          console.log(`Pesquisa: ${userId} - ${niche}, ${city}/${state}`);

          // 5. Chamar Geoapify Places API
          stage = "geoapify_call";
          const text = `${niche} in ${city}, ${state}, Brazil`;
          const geoUrl = `https://api.geoapify.com/v1/places?text=${encodeURIComponent(text)}&apiKey=${apiKey}&limit=20&lang=pt`;
          
          console.log("Chamando Geoapify URL (apiKey oculta)");
          
          const response = await fetch(geoUrl);
          console.log(`Geoapify status: ${response.status} ${response.statusText}`);

          if (!response.ok) {
            let errorData;
            try {
              errorData = await response.json();
            } catch (e) {
              errorData = "Resposta não-JSON da Geoapify";
            }
            console.error("Erro Geoapify response:", errorData);
            
            if (response.status === 429) {
              return new Response(JSON.stringify({ error: "Limite de consultas da API atingido.", stage }), { status: 429 });
            }
            return new Response(JSON.stringify({ error: "Erro ao consultar provedor de dados externo.", stage, status: response.status }), { status: 502 });
          }

          stage = "geoapify_parse";
          const data = await response.json();

          // 6. Mapear resultados
          stage = "mapping";
          const opportunities = data.features?.map((f: any) => {
            const props = f.properties;
            if (!props) return null;

            const website = props.website || null;
            
            let level = "alta";
            if (website) {
              level = "baixa";
            } else if (props.contact?.social_media || props.datasource?.sourcename?.includes("facebook") || props.datasource?.sourcename?.includes("instagram")) {
              level = "media";
            }

            // Gerar um place_id único se a API não fornecer (necessário para o frontend)
            const fallbackId = createHmac("sha256", "vynexa-salt")
              .update(`${props.name}-${props.lat}-${props.lon}`)
              .digest("hex")
              .substring(0, 16);

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
          }).filter(Boolean) || [];

          // 7. Retornar resultados
          return new Response(JSON.stringify({ opportunities }), {
            status: 200,
            headers: { "Content-Type": "application/json" }
          });

        } catch (error: any) {
          console.error(`Erro na busca de prospecção (stage: ${stage}):`, error);
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