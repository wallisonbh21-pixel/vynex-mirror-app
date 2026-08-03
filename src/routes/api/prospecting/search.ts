import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { requireVendedor } from "@/lib/guard";

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
        try {
          // 1. Validar autenticação e autorização
          const authHeader = request.headers.get("Authorization");
          if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return new Response(JSON.stringify({ error: "Não autorizado" }), {
              status: 401,
              headers: { "Content-Type": "application/json" },
            });
          }

          const token = authHeader.split(" ")[1];
          const { data: { user }, error: authError } = await supabase.auth.getUser(token);

          if (authError || !user) {
            return new Response(JSON.stringify({ error: "Sessão inválida ou expirada" }), {
              status: 401,
              headers: { "Content-Type": "application/json" },
            });
          }

          // Verificar papel
          const { data: roles } = await supabase
            .from("user_roles")
            .select("role")
            .eq("user_id", user.id);
          
          const userRoles = (roles ?? []).map(r => r.role);
          const hasAccess = userRoles.some(r => ["admin", "vendedor", "diretor", "rh"].includes(r));
          
          if (!hasAccess) {
            return new Response(JSON.stringify({ error: "Acesso negado para o seu perfil" }), {
              status: 403,
              headers: { "Content-Type": "application/json" },
            });
          }

          const userId = user.id;

          // 2. Validar input
          const body = await request.json();
          const { niche, state, city } = searchSchema.parse(body);

          // 3. Obter API Key (Secret)
          const apiKey = process.env["GEOAPIFY_API_KEY"];
          if (!apiKey) {
            console.error("GEOAPIFY_API_KEY não configurada.");
            return new Response(
              JSON.stringify({ error: "Serviço de prospecção ainda não configurado. Entre em contato com o administrador." }),
              { status: 500, headers: { "Content-Type": "application/json" } }
            );
          }

          // 4. Registrar a pesquisa no log (Auditoria/Controle)
          // Vamos criar essa tabela se não existir na próxima migração, por enquanto apenas logamos no console ou simulamos
          console.log(`Pesquisa: ${userId} - ${niche}, ${city}/${state}`);

          // 5. Chamar Geoapify Places API
          // Primeiro, precisamos do Geocoding da cidade para obter as coordenadas se a API de lugares não aceitar string pura de local
          // Mas o Geoapify Places permite busca por texto ou por geocode.
          // Vamos usar o Geocoding para ter precisão.
          const text = `${niche} in ${city}, ${state}, Brazil`;
          const geoUrl = `https://api.geoapify.com/v1/places?text=${encodeURIComponent(text)}&apiKey=${apiKey}&limit=20&lang=pt`;
          
          const response = await fetch(geoUrl);
          if (!response.ok) {
            const errorData = await response.json();
            console.error("Erro Geoapify:", errorData);
            if (response.status === 429) {
              return new Response(JSON.stringify({ error: "Limite de consultas da API atingido." }), { status: 429 });
            }
            return new Response(JSON.stringify({ error: "Erro ao consultar provedor de dados." }), { status: 502 });
          }

          const data = await response.json();

          // 6. Mapear resultados para o formato da VYNEXA
          const opportunities = data.features?.map((f: any) => {
            const props = f.properties;
            const website = props.website || null;
            
            // Lógica de classificação
            let level = "alta"; // Padrão: sem site
            if (website) {
              level = "baixa";
            } else if (props.contact?.social_media || props.datasource?.sourcename?.includes("facebook") || props.datasource?.sourcename?.includes("instagram")) {
              level = "media";
            }

            return {
              business_name: props.name || props.address_line1,
              category: niche,
              phone: props.contact?.phone || null,
              email: props.contact?.email || null,
              address: props.address_line1 || props.formatted,
              city: city,
              state: state,
              website: website,
              instagram: props.contact?.instagram || null,
              facebook: props.contact?.facebook || null,
              google_maps_url: props.datasource?.raw?.osm_id ? `https://www.openstreetmap.org/node/${props.datasource.raw.osm_id}` : null,
              place_id: props.place_id,
              rating: props.rating || null,
              review_count: props.review_count || 0,
              opportunity_level: level,
              source: "Geoapify",
              status: "nova"
            };
          }) || [];

          // 7. Retornar resultados
          return new Response(JSON.stringify({ opportunities }), {
            status: 200,
            headers: { "Content-Type": "application/json" }
          });

        } catch (error: any) {
          console.error("Erro na busca de prospecção:", error);
          return new Response(
            JSON.stringify({ error: error.message || "Erro interno no servidor." }),
            { status: 500, headers: { "Content-Type": "application/json" } }
          );
        }
      }
    }
  }
});
