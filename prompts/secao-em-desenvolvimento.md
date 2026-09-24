# Delegação: seção “Em desenvolvimento”

Trabalhe somente no diretório recebido em `--dir`. Não leia `.env`, `.env.*`, credenciais nem dados reais. Não use arquivos fora desse diretório. Não faça commit, push, deploy, migration, seed ou alteração de banco.

## Objetivo

Implementar a primeira tarefa de `tarefas.md`: criar na página inicial uma seção pública e visualmente secundária chamada exatamente **Em desenvolvimento**, abaixo do carrossel principal, começando pelo projeto **Ian Raposo**.

## Contexto obrigatório

Leia antes de editar:

- `tarefas.md`, somente o primeiro bloco, “Criar na página inicial a seção pública ‘Em desenvolvimento’”.
- `DESIGN.md`, integralmente.
- `docs/PRODUTO.md`, integralmente.
- `app/page.tsx`.
- `app/data/portfolio.ts`.
- `components/portfolio/PortfolioCarousel.tsx` e `components/portfolio/PortfolioCard.tsx` para manter a linguagem visual existente.
- `_reference/ian-raposo/index.html`, cópia local da home atual do projeto, apenas como fonte para uma captura real.

## Implementação

- Preserve integralmente o carrossel principal e sua ordem atual.
- Crie uma lista estática separada para projetos em desenvolvimento; não reaproveite `visibility: public` para confundir estados.
- Ian Raposo é o primeiro registro, com nome `Ian Raposo`, categoria factual ligada a artes visuais, descrição curta e status de desenvolvimento.
- O Ian ainda não terá link. O cartão precisa ser informativo e não pode renderizar link, botão ou texto “Ver prévia”. Modele os dados para que um `href` opcional possa ser ativado futuramente.
- Gere uma captura real da home `_reference/ian-raposo/index.html` em viewport de desktop, mostrando a identidade real da página. Salve otimizada em `public/portfolio/ian-raposo.png` ou `.webp`; não use geração de imagem, ilustração inventada ou uma obra isolada como se fosse a home.
- A seção deve sumir completamente quando a lista estiver vazia.
- Use um componente pequeno e específico para a seção/cartão se isso mantiver `app/page.tsx` claro. Não generalize o carrossel nem faça refatoração fora da tarefa.
- O cartão deve ter selo exato `Em desenvolvimento`, nome, descrição e captura; deve ser menor e mais discreto que os cartões concluídos.
- Garanta leitura no celular, tablet e computador, foco visível se futuramente houver link, texto legível mesmo se a imagem falhar e nenhuma rolagem horizontal na página.
- Use apenas as classes e tokens já adotados pelo projeto. Não adicione dependências.

## Fora de escopo

Não criar `/ian-raposo`, não copiar a landing page para dentro do xDouglas, não terminar nem redesenhar o projeto Ian Raposo, não tocar na experiência musical, backend, banco, autenticação, APIs, migrations, configuração de deploy ou projetos externos.

## Verificação obrigatória

1. Confirme no diff que só foram tocados arquivos necessários à tarefa.
2. Rode `node_modules/.bin/tsc --noEmit`.
3. Se houver ambiente suficiente, rode o build; não rode o script `npm run build`, porque ele executa migration e seed. Use `node_modules/.bin/next build` somente se a configuração disponível permitir.
4. Informe exatamente os arquivos alterados, os comandos executados e qualquer verificação que não pôde ser feita.

A baseline atual é TypeScript aprovado após geração do Prisma; o build completo pode depender de `DATABASE_URL`. Não reduza nem contorne verificações existentes.
