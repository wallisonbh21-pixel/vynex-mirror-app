
## NexusBuild AI na Vercel ("O modelo de IA não está configurado")

Causa: a função de servidor `/api/nexus/chat` lê `LOVABLE_API_KEY` em `process.env`. Na Vercel essa variável não estava cadastrada, então a IA recusava toda conversa — inclusive a escolha de modelo, que antes passava pela IA.

- Cadastre `LOVABLE_API_KEY` (Settings → Environment Variables, ambiente Production) e faça novo deploy. Nunca use prefixo `VITE_` nela.
- Opcional: `NEXUS_AI_MODEL`.

Os modelos não dependem mais da IA: em Modelos, "Editar site" cria/reabre o projeto do Criador no Studio e "Publicar site" abre o Studio já com a publicação. Sites publicados ficam em `/s/<endereço>` no próprio domínio.

## Atualização — Studio: imagens e efeitos visuais (16/10/2026)

- Imagens enviadas ficam no espaço privado `site-images` (limite 5 MB; JPG, PNG, WebP, GIF) e são entregues pelo endereço `/api/public/site-image/<projeto>/<hash>.<ext>`, que precisa da função de servidor ativa (preset Vercel, não estático).
- Validação real do arquivo no servidor: função `verifySiteImage`.
- Efeitos visuais: salvos junto com o projeto; nada muda nos sites existentes sem ativação.
- Migrações do banco: 0000–0008 **já aplicadas** no banco atual (0007 e 0008 = regras de acesso às imagens). Só rode se migrar para outro banco; o espaço `site-images` também precisa ser criado lá (privado, 5 MB).
- Nenhuma variável nova.
