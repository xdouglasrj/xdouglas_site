# Tarefa delegada: vitrine pública responsiva do xDouglas

Trabalhe somente no sandbox recebido. Não leia `.env`, não use pasta fora do projeto e não altere backend, banco, autenticação, APIs ou migrations.

## Objetivo

Substituir a raiz atual por uma vitrine pública dos trabalhos de Douglas e preservar integralmente a experiência musical existente em `/musica`.

## Leia antes de alterar

- `tarefas.md`, apenas a primeira tarefa `[>]`.
- `DESIGN.md` integralmente.
- `CLAUDE.md` integralmente.
- O código atual de `app/page.tsx` e apenas os componentes, layouts e estilos realmente ligados à raiz e à experiência musical.
- O histórico recente relevante para entender como a raiz e `/inicio` funcionam hoje.

## Requisitos funcionais

1. `/` mostra um carrossel horizontal inspirado visualmente em `https://21st.dev/@shadcnspace/components/carousel-08`: cartões grandes, cantos arredondados, texto sobreposto, parte do próximo cartão visível e controles circulares.
2. Ordem e destinos:
   - Agenda Ella → `https://www.agendaella.com.br/`
   - WL Tour → `https://www.wlfavelatour.com.br/`
   - Martins Tuor → `https://www.martinstour.com.br/`
   - xDouglas Música → `/musica`
3. Os três links externos abrem em nova aba com proteção adequada. `/musica` abre na mesma aba.
4. Os quatro cartões usam somente capturas reais da home page ou landing page correspondente. Não gere, desenhe nem substitua por imagem de IA. Capture as páginas reais em viewport representativo, recorte para leitura no cartão, otimize e salve em `public/portfolio/`. Para xDouglas Música, capture a experiência musical local existente.
5. A lista de projetos é estática, pequena e fácil de atualizar manualmente. Só itens públicos aparecem na raiz. Não crie CMS, painel, banco, API nem captura automática em runtime.
6. A plataforma musical existente deve continuar funcional e acessível em `/musica`. Reaproveite sua composição atual; não duplique o produto e não mude suas funções.
7. A raiz precisa permanecer independente de autenticação, banco e disponibilidade da plataforma musical.
8. Responsividade obrigatória em celular, tablet e computador. Navegação por toque, arraste nativo, teclado e botões. Não cause rolagem horizontal na página inteira.
9. Respeite movimento reduzido, foco visível, contraste, landmarks, um único H1, dimensões explícitas das imagens e peso inicial total das quatro capturas inferior a 3 MB.
10. Casos: estado vazio curto; um único item sem controles inúteis; controles desabilitados nos limites; falha de imagem mantém título legível; nenhum piloto oculto aparece na raiz.

## Restrições

- Não implemente páginas piloto nesta tarefa.
- Não publique, não faça push e não mexa em domínio ou Vercel.
- Não altere landing pages externas.
- Não invente novas seções, painel, filtros, autoplay, loop infinito ou paginação por pontos.
- Não copie o código da referência; reproduza apenas a composição e interação aprovadas dentro dos padrões existentes.
- Não renomeie `Martins Tuor` para outra grafia.
- Preserve mudanças já existentes no sandbox.

## Verificação obrigatória

- Rode `node_modules/.bin/tsc --noEmit`.
- Rode o build seguro que não execute migration, seed ou scripts contra banco. O `npm run build` deste projeto executa ações de banco e está proibido. Use diretamente o binário do Next somente se ele não exigir segredo ou serviço externo; caso contrário, reporte como não verificado.
- Inicie a aplicação local e percorra no navegador `/`, os quatro cartões e `/musica` em larguras de celular e computador. Registre exatamente o que conseguiu testar.
- Informe arquivos alterados, peso de cada captura, comandos executados e qualquer item não verificado.

Não encerre apenas com explicação: entregue o diff funcional no sandbox.
