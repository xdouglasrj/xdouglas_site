# Correção 3: acabamento do cartão em desenvolvimento

Corrija somente `components/portfolio/DevelopmentCard.tsx` no mesmo sandbox. Não toque nos outros arquivos, não leia `.env`, não faça commit, push ou deploy.

## Defeitos

1. A formatação do arquivo ficou inconsistente: indentação quebrada, `let wrapper = null`, ponto e vírgula que não segue o projeto e linhas fora do nível correto. Reescreva o componente de modo simples e legível, seguindo o estilo sem ponto e vírgula dos componentes vizinhos.
2. O selo `Em desenvolvimento` deve existir em todos os cartões. Quando `href` existir, `Ver prévia` é uma ação adicional, não substitui o selo.
3. O cartão sem `href` é um `<div>` sem `tabIndex`, ring de foco ou comportamento de grupo clicável. O cartão com link recebe foco visível e efeitos de interação.
4. Mantenha `next/link` para URL interna e `<a target="_blank" rel="noopener noreferrer">` para URL externa.

## Critério de pronto

- Ian sem `href` mostra o selo `Em desenvolvimento` e nenhum `Ver prévia`.
- Um registro futuro com `href` mostrará selo e `Ver prévia` e terá o link correto.
- O arquivo fica formatado de maneira coerente, sem texto corrompido.
- `node_modules/.bin/tsc --noEmit` passa.
- `git status --short` continua limitado aos cinco arquivos já autorizados.
