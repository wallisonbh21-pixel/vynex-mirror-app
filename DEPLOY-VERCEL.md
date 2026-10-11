# Publicar o ScaleNexus na Vercel (sem GitHub)

A aplicação completa (páginas, SSR, server functions, `/api/*`) vira **uma função Node 22 da Vercel**
mais arquivos estáticos. Nenhuma alteração de código é necessária: ao compilar dentro da Vercel,
o build detecta o ambiente e gera `.vercel/output` (Build Output API v3). Recarregar qualquer rota
funciona porque toda rota não estática cai na função do servidor.

## Passo a passo
1. Descompacte o ZIP numa pasta.
2. Instale a CLI: `npm i -g vercel` e faça `vercel login`.
3. Na pasta: `vercel link` (crie um projeto novo; framework: "Other").
4. Cadastre as variáveis de `.env.example` (em Production e Preview):
   `vercel env add NOME_DA_VARIAVEL` — ou pelo painel da Vercel.
5. Versão de teste: `vercel deploy` → abra a URL e faça os testes abaixo.
6. Produção (só depois dos testes): `vercel deploy --prod`.

## Depois do primeiro deploy
- Defina `SITE_URL` com o domínio final.
- No backend, adicione o domínio da Vercel às URLs de redirecionamento de login.
- Login com Google usa o serviço da Lovable; em domínio próprio precisa de credenciais Google próprias.

## Testes manuais na URL de teste
Login/cadastro/recuperação de senha; painéis admin, Criador, Vendedor e Cliente; Studio (aplicar
modelo, salvar, recarregar); NexusBuild (chat, pesquisa web, imagem); Documentos (envio e leitura);
publicação e `/s/<slug>`; recarregar rotas internas.

## Serviços que continuam externos
- Banco, login e arquivos: Lovable Cloud (conecta pelas variáveis `SUPABASE_*`).
- IA, imagens, e-mail e pesquisa web: gateway Lovable (`LOVABLE_API_KEY`).
- Prospecção: Geoapify.
