import { supabase } from "./src/integrations/supabase/client.server.js";
import fs from "fs";

async function runTests() {
  console.log("--- INICIANDO TESTES DE PROSPECÇÃO ---");
  
  // Como estamos rodando via CLI no sandbox, precisamos simular o que a rota faz
  // mas chamando diretamente a lógica ou a própria rota se possível via fetch interno
  
  // A rota está em http://localhost:8080/api/prospecting/search
  // Precisamos de um token de usuário válido (vendedor/admin)
  // Vamos buscar um usuário admin no banco
  
  const { data: userData, error: userError } = await supabase
    .from("user_roles")
    .select("user_id")
    .eq("role", "admin")
    .limit(1)
    .single();
    
  if (userError || !userData) {
    console.error("Erro ao buscar usuário para teste:", userError);
    return;
  }
  
  const userId = userData.user_id;
  console.log("Usando User ID para teste:", userId);

  // A rota usa supabase.auth.getUser(token) para validar.
  // No sandbox, não temos tokens JWT reais facilmente. 
  // MAS, como a rota /api/prospecting/search.ts é um arquivo TS,
  // poderíamos tentar rodar um script que importa e chama o handler.
  // No entanto, é mais fácil usar curl para o endpoint local se o servidor estiver rodando.
  
  const tests = [
    { niche: "Academia", state: "MG", city: "Contagem" },
    { niche: "Oficina", state: "MG", city: "Contagem" },
    { niche: "Imobiliária", state: "MG", city: "Contagem" },
    { niche: "Contabilidade", state: "MG", city: "Contagem" },
    { niche: "Hamburgueria", state: "MG", city: "Contagem" },
    { niche: "Pet shop", state: "MG", city: "Contagem" },
    { niche: "Loja de roupas", state: "MG", city: "Contagem" }
  ];

  for (const t of tests) {
    console.log(`\nTestando: ${t.niche} em ${t.city}, ${t.state}`);
    
    // Como não temos o token, vamos modificar temporariamente a rota para aceitar um header de teste
    // ou rodar um script que simula a requisição chamando o handler exportado se possível.
    // A forma mais robusta é usar o curl contra o localhost:8080 se ele estiver up.
  }
}

// runTests(); 
// Este arquivo é apenas um rascunho. Vamos usar uma abordagem diferente via Playwright se possível.
