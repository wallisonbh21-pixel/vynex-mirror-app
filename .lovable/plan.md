# Etapa 3 — Pesquisa web da NEXUSBUILD AI

## Objetivo
Adicionar pesquisa web real e análise segura de URLs à NEXUSBUILD AI, com fontes verificáveis, decisão automática pelo modelo e atalho manual no campo de mensagem.

## Implementação
- Integrar o provedor Firecrawl já conectado, exclusivamente no servidor.
- Registrar `web_research` como ferramenta READ com consulta, objetivo, limite controlado e preferência opcional por fontes oficiais.
- Reforçar `website_research` para validar URLs públicas, bloquear destinos locais/privados, limitar conteúdo e tratar páginas externas como dados não confiáveis.
- Armazenar consulta, objetivo, projeto opcional, fontes usadas, duração e resultado resumido no histórico de ferramentas, associados à conversa e ao usuário.
- Incluir as fontes realmente retornadas nos metadados da resposta para uso futuro pela interface.
- Atualizar o prompt central para decidir quando pesquisar, priorizar fontes oficiais, comparar fontes importantes e resistir a prompt injection.
- Adicionar “Pesquisar na web” ao menu “+” do campo de mensagem; o atalho marcará explicitamente a próxima solicitação como pesquisa, sem impedir a decisão automática da IA.

## Segurança e limites
- Preservar acesso exclusivo de admin e criador e todas as regras existentes.
- Limitar resultados, tamanho de conteúdo, tempo e rodadas; sem navegação indefinida.
- Não expor credenciais no navegador, não seguir instruções encontradas em páginas e não inventar fontes.
- Não implementar construtores, publicação, lojas, criação automática de projetos ou geração de arquivos.

## Validação
- Testar pesquisa simples, atual, documentação/política oficial, múltiplas fontes, URL válida/inválida, prompt injection, conversa existente e atalho manual.
- Validar combinação com contexto de projeto/arquivo por tool calling, recusa de usuário sem permissão, streaming, desktop e mobile de 390 px.
- Confirmar compilação, logs e ausência de regressões no chat existente.
