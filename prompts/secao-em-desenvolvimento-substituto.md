# Substituição de executor: finalizar seção “Em desenvolvimento”

Trabalhe somente no sandbox recebido. Não leia `.env`, não faça commit, push ou deploy. Esta é uma correção pontual de trabalho anterior; preserve o que já está correto.

## Especificação original

A home deve ter, abaixo do carrossel de quatro projetos concluídos, uma seção visualmente secundária chamada `Em desenvolvimento`. Ela usa grid responsivo, desaparece quando a lista está vazia e começa com Ian Raposo. O Ian mostra captura real da própria home, nome, descrição e selo `Em desenvolvimento`, sem link por enquanto. Dados futuros podem receber `href` opcional; nesse caso o cartão mantém o selo e acrescenta `Ver prévia`, usando `next/link` para rota interna e link externo seguro para URL externa.

## Estado correto que deve ser preservado

- `app/page.tsx` renderiza `DevelopmentProjects` diretamente depois do carrossel.
- `app/data/development.ts` tem Ian Raposo sem `href` vazio.
- `components/portfolio/DevelopmentProjects.tsx` usa grid e retorna `null` quando vazio.
- `public/portfolio/ian-raposo.png` é uma captura real de 487.476 bytes. Não a altere.
- TypeScript já passou.

## Histórico das reprovações

1. O primeiro executor criou imagem PNG 1×1 e duplicou o carrossel principal.
2. Depois corrigiu a imagem e o grid, mas corrompeu texto UTF-8, deixou arquivo órfão e não exibiu `Ver prévia` no estado futuro.
3. Depois corrigiu isso, mas deixou formatação ruim e tornou o cartão sem link focável como se fosse clicável.
4. Na última tentativa removeu o foco do cartão sem link, mas também removeu indevidamente o foco visível dos links internos e externos e voltou a quebrar a formatação.

## Trabalho agora

Edite somente `components/portfolio/DevelopmentCard.tsx`:

- Reescreva o arquivo de maneira limpa, com indentação consistente e sem ponto e vírgula, conforme os componentes vizinhos.
- Preserve o texto UTF-8 `captura da página`.
- O conteúdo sempre mostra o selo `Em desenvolvimento`.
- Quando `href` existir, também mostra `Ver prévia`; link interno usa `next/link`, link externo usa `target="_blank"` e `rel="noopener noreferrer"`.
- Links internos e externos mantêm foco visível completo.
- Sem `href`, retorne um `<div>` comum, sem `tabIndex`, sem classes de foco, sem efeito de clique e sem `Ver prévia`.
- Não altere nenhum outro arquivo de produto.

Rode `node_modules/.bin/tsc --noEmit`. Antes de encerrar, remova do sandbox `TAREFA-DELEGADA.md`, este arquivo de prompt e qualquer prompt de correção não rastreado. O `git status --short` final deve listar somente os cinco arquivos da implementação: `app/page.tsx`, `app/data/development.ts`, `components/portfolio/DevelopmentCard.tsx`, `components/portfolio/DevelopmentProjects.tsx` e `public/portfolio/ian-raposo.png`.
