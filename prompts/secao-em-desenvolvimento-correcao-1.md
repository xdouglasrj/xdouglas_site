# Correção 1: seção “Em desenvolvimento”

Esta é a correção da mesma tarefa. Trabalhe somente no diretório recebido. Não leia `.env` nem use arquivo externo ao sandbox. Não faça commit, push ou deploy.

## Motivos da reprovação

1. `public/portfolio/ian-raposo.png` tem 70 bytes e é um PNG de 1×1 criado de Base64. Isso viola a exigência principal: a imagem precisa ser uma captura real da home do Ian.
2. A seção foi implementada como uma cópia integral do carrossel principal, com cartão do mesmo tamanho e controles duplicados, contrariando `DESIGN.md`, que exige uma área menor e visualmente secundária.
3. O registro do Ian usa `href: ''`; ausência de destino deve ser representada pela ausência da propriedade, não por uma URL vazia.
4. O componente do cartão recebe `href` e `external`, mas ignora ambos. Ele precisa aceitar o estado futuro com link sem oferecer link agora, mantendo tipagem coerente.

## Correção exigida

- Releia o primeiro bloco de `tarefas.md`, `DESIGN.md` e `docs/PRODUTO.md`.
- Gere uma captura real de `_reference/ian-raposo/index.html` usando o navegador já instalado em `C:\Program Files\Google\Chrome\Application\chrome.exe`, em modo headless, com viewport de desktop. Aguarde o carregamento antes da captura. O arquivo final deve mostrar a home real do Ian, ter dimensões adequadas ao cartão e ser otimizado para web. É proibido manter o PNG 1×1, gerar imagem por IA ou usar somente uma obra isolada.
- Substitua o carrossel duplicado por uma seção simples e secundária, sem controles de anterior/próximo quando houver somente um item. Prefira um grid responsivo ou uma lista de cartões menores. A seção inteira retorna `null` quando a lista fica vazia.
- Nomeie o componente de seção conforme sua função (`DevelopmentProjects`), não como carrossel se ele não for um carrossel.
- Remova `href: ''` do Ian. Modele `href` como opcional.
- Se `href` existir futuramente, o cartão deve renderizar a ação exata `Ver prévia` e usar navegação interna ou externa corretamente, com atributos seguros para URL externa. Sem `href`, ele deve renderizar somente o conteúdo e o selo `Em desenvolvimento`, sem botão, link ou affordance enganosa.
- Preserve os quatro projetos finalizados e não toque em backend, banco, autenticação, APIs, migrations ou música.
- Remova `TAREFA-DELEGADA.md` e não inclua `_reference/` na entrega final. `_reference/` é somente insumo temporário do sandbox.

## Verificação

- Confirme as dimensões e o tamanho em bytes da captura real.
- Rode `node_modules/.bin/tsc --noEmit`.
- Não repita o build: ele já foi tentado e falhou em `next/font` no ambiente da worktree, não no código desta tarefa.
- Informe arquivos alterados e resultados reais.
