# Correção 2: seção “Em desenvolvimento”

Corrija a mesma tarefa no mesmo sandbox. Não leia `.env`, não faça commit, push ou deploy.

## O que já ficou certo

- A captura agora é real e tem 487.476 bytes.
- A seção deixou de ser um carrossel e passou a usar grid.
- O Ian não possui mais `href` vazio.
- TypeScript passou.

## Novos defeitos encontrados na auditoria

1. `components/portfolio/DevelopmentCard.tsx` contém texto corrompido: `captura da p�gina`. Restaure exatamente `captura da página` usando edição que preserve UTF-8. Não use `Set-Content` para arquivos com acentos.
2. O estado futuro com `href` não exibe a ação obrigatória `Ver prévia`. Quando `href` existir, o cartão precisa ser um link acessível e exibir exatamente esse texto. Sem `href`, não exiba ação nem affordance de clique.
3. `components/portfolio/DevelopmentCarousel.tsx` ficou órfão no sandbox. Remova esse arquivo; somente `DevelopmentProjects.tsx` deve permanecer.
4. `app/page.tsx` cria uma `<section>` externa e `DevelopmentProjects` cria outra `<section>` interna para o mesmo conteúdo. Remova a seção externa e renderize `<DevelopmentProjects />` diretamente depois do carrossel.
5. `prompts/secao-em-desenvolvimento-correcao-1.md` foi copiado ao sandbox apenas como instrução e não faz parte da implementação desta branch. Remova-o do sandbox para o diff final conter somente código e imagem da tarefa.
6. O componente precisa usar `next/link` para destino interno e `<a target="_blank" rel="noopener noreferrer">` para destino externo. Não use componente polimórfico por string se isso esconder semântica ou atributos.

## Verificação

- Rode `node_modules/.bin/tsc --noEmit`.
- Mostre `git status --short` e confirme que os únicos arquivos da entrega são: `app/page.tsx`, `app/data/development.ts`, `components/portfolio/DevelopmentCard.tsx`, `components/portfolio/DevelopmentProjects.tsx` e `public/portfolio/ian-raposo.png`.
- Não altere a captura real já aprovada nesta rodada.
