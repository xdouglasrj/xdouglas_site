# Correção 4: cartão sem link não recebe foco

Corrija somente `components/portfolio/DevelopmentCard.tsx` no mesmo sandbox.

Você interpretou ao contrário o item 3 da correção anterior. Quando `href` não existir, o wrapper deve ser um `<div>` comum, **sem `tabIndex`, sem ring de foco e sem affordance de grupo clicável**. Remova esses atributos e classes interativas somente do retorno sem link. Não altere os retornos com link nem qualquer outro arquivo.

Depois rode `node_modules/.bin/tsc --noEmit`. Remova `TAREFA-DELEGADA.md` e `prompts/secao-em-desenvolvimento-correcao-4.md` do sandbox antes de encerrar, para o status continuar limitado aos cinco arquivos autorizados.
