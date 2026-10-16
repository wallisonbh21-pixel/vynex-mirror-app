
## NexusBuild AI na Vercel ("O modelo de IA não está configurado")

Causa: a função de servidor `/api/nexus/chat` lê `LOVABLE_API_KEY` em `process.env`. Na Vercel essa variável não estava cadastrada, então a IA recusava toda conversa — inclusive a escolha de modelo, que antes passava pela IA.

- Cadastre `LOVABLE_API_KEY` (Settings → Environment Variables, ambiente Production) e faça novo deploy. Nunca use prefixo `VITE_` nela.
- Opcional: `NEXUS_AI_MODEL`.

Os modelos não dependem mais da IA: em Modelos, "Editar site" cria/reabre o projeto do Criador no Studio e "Publicar site" abre o Studio já com a publicação. Sites publicados ficam em `/s/<endereço>` no próprio domínio.
