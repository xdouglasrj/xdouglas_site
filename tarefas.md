# Tarefas

- [ ] Especificar e publicar a prévia direta do projeto Ian Raposo, caso a versão atual esteja pronta para apresentação.
  - TAREFA: prévia pública do Ian Raposo.
  - OBJETIVO: disponibilizar uma versão segura do projeto em `xdouglas.com.br/ian-raposo` e então ativar “Ver prévia” no cartão de “Em desenvolvimento”.
  - ARQUIVOS: rota `app/ian-raposo/page.tsx`, componentes e recursos exclusivos da landing page, além do registro estático do cartão. A lista exata será fechada depois da auditoria do projeto de origem em `D:\Dev\Projetos\landing-pages\Ian-raposo`.
  - REGRAS APLICÁVEIS: esta tarefa permanece em planejamento até o conteúdo e o estado aproveitável da landing page serem auditados; a rota será pública e sem senha; nenhuma dependência de banco ou autenticação; o cartão só recebe link após a rota passar pelos testes; captura real da própria landing page; nenhum conteúdo inventado para substituir informação ausente.
  - CASOS DE BORDA: projeto de origem incompleto ou com informação provisória; recursos externos ausentes; rota direta funcionando mas navegação interna quebrada; preview inadequado para exposição pública; remoção futura da prévia não pode quebrar a home.
  - PRONTO QUANDO: a especificação visual e de conteúdo for aprovada, `/ian-raposo` abrir diretamente e funcionar de forma responsiva, seus caminhos reais forem clicados e o cartão da home ativar “Ver prévia” sem misturar o projeto aos concluídos.
  - FORA DE ESCOPO: decidir agora conteúdo que ainda não foi auditado, inventar textos, concluir o projeto comercial, comprar domínio, publicar no domínio definitivo e automatizar publicação.

- [>] Transformar a página inicial do xDouglas em uma exposição dos sites e projetos já produzidos, com miniaturas em quadros, preservando a plataforma musical em `/musica`. Cada projeto terá visibilidade pública ou oculta. Trabalhos finalizados e pagos aparecerão na exposição pública como portfólio e, quando tiverem domínio próprio, abrirão diretamente esse endereço externo. Pilotos e propostas ainda não fechados poderão ficar fora da exposição, mas acessíveis sem senha pelo endereço direto temporário no domínio xDouglas, como `xdouglas.com.br/ian-raposo`; “oculto” significa somente não aparecer na exposição. Inclusão, remoção, visibilidade e troca do endereço serão atualizações manuais simples, sem painel administrativo nem automação de publicação ou redirecionamento.
  - Referência visual aprovada para a exposição: `https://21st.dev/@shadcnspace/components/carousel-08` — carrossel horizontal inspirado na galeria da Apple, com cartões grandes de imagem, cantos arredondados, texto sobreposto, parte do próximo cartão visível e controles circulares de navegação.
  - As capas dos cartões serão capturas reais da home page ou landing page de cada projeto. Imagem gerada por IA é proibida para todos os cartões. As capturas ficarão como arquivos simples e substituíveis para atualização manual.
  - Primeiros cartões públicos, nesta ordem: Agenda Ella (`https://www.agendaella.com.br/`), WL Tour (`https://www.wlfavelatour.com.br/`), Martins Tuor (`https://www.martinstour.com.br/`) e xDouglas Música (`https://www.xdouglas.com.br/musica`). Cada captura deve mostrar a identidade real do respectivo site.
  - A exposição será responsiva em celular, tablet e computador. O carrossel deve manter cartões legíveis, parte do próximo cartão visível quando houver espaço e navegação funcional por toque, arraste, teclado e botões.
  - A raiz `xdouglas.com.br` sempre exibirá a exposição. A plataforma musical não está ativa nem tem usuários atuais; será preservada apenas como um projeto do portfólio em `/musica`, sem redirecionamento especial para sessões antigas.
  - TAREFA: vitrine pública responsiva do xDouglas.
  - OBJETIVO: substituir o redirecionamento da raiz por uma exposição pública dos quatro projetos e manter a plataforma musical acessível em `/musica`.
  - ARQUIVOS: `app/page.tsx`, componentes e dados de portfólio estritamente necessários, `app/musica/page.tsx` ou uma composição compartilhada equivalente, `app/globals.css`, imagens em `public/portfolio/`, metadados e testes pertinentes. Não alterar backend, banco, autenticação, APIs ou migrations.
  - REGRAS APLICÁVEIS: seguir integralmente `DESIGN.md`; usar lista estática simples; renderizar só `visibility: public`; links externos em nova aba segura; `/musica` no mesmo domínio; usar somente capturas reais das páginas, sem imagens de IA; imagens com dimensões explícitas e peso inicial total inferior a 3 MB; acessibilidade por teclado, toque, arraste, foco visível e movimento reduzido.
  - CASOS DE BORDA: sem projetos públicos mostrar estado vazio curto; um projeto não exibir controles inúteis; botões desabilitados nos limites; links ocultos não aparecem na raiz; falha de imagem mantém título legível; mobile não cria rolagem horizontal na página inteira.
  - PRONTO QUANDO: `/` mostra os quatro cartões na ordem Agenda Ella, WL Tour, Martins Tuor e xDouglas Música, todos com captura real da respectiva página; os três primeiros abrem os domínios informados e o quarto abre `/musica`; `/musica` renderiza a experiência musical existente; desktop, tablet e celular preservam legibilidade e navegação; `node_modules/.bin/tsc --noEmit` passa; `node_modules/.bin/next build` passa quando o ambiente permitir; o fluxo real é clicado no navegador.
  - FORA DE ESCOPO: painel administrativo, CMS, captura automática, senha para piloto, subdomínios, publicação automática, modificação das landing pages externas, mudança de backend ou ativação comercial da plataforma musical.

- [ ] Publicar pilotos e propostas não finalizados por rotas diretas e ocultas da vitrine.
  - TAREFA: padrão mínimo para páginas piloto.
  - OBJETIVO: permitir que trabalhos em negociação sejam mostrados por endereços como `xdouglas.com.br/ian-raposo`, sem aparecer na página inicial.
  - ARQUIVOS: somente a rota estática do piloto e os recursos próprios daquela landing page; cada piloto deve ser especificado separadamente antes da implementação.
  - REGRAS APLICÁVEIS: acesso sem senha; ausência total na lista pública; atualização manual simples; nenhuma imagem de IA usada como representação do projeto; conteúdo de um piloto não interfere nos demais nem na plataforma musical.
  - CASOS DE BORDA: acessar a URL diretamente funciona; o piloto não aparece na vitrine, busca ou navegação pública; remover um piloto não afeta a raiz nem `/musica`.
  - PRONTO QUANDO: o primeiro piloto aprovado abrir por URL direta, permanecer ausente da vitrine e funcionar de forma responsiva.
  - FORA DE ESCOPO: painel, CMS, autenticação, geração automática de rotas, publicação automática e definição agora do conteúdo de pilotos futuros.

- [ ] Definir e executar a publicação final do novo xDouglas após aprovação visual.
  - TAREFA: validação e publicação.
  - OBJETIVO: colocar a vitrine aprovada em `xdouglas.com.br` sem quebrar os destinos externos nem `/musica`.
  - ARQUIVOS: configuração de publicação estritamente necessária, sem mudança de produto.
  - REGRAS APLICÁVEIS: publicar somente depois da validação local completa; conferir a URL pública exata; preservar variáveis e dados existentes; push ou alteração externa somente com autorização explícita do Douglas.
  - CASOS DE BORDA: domínio ainda apontando para versão anterior; cache servindo página antiga; link externo indisponível; `/musica` inacessível após a troca da raiz.
  - PRONTO QUANDO: a URL pública mostrar a vitrine aprovada, os quatro cartões abrirem os destinos corretos e `/musica` funcionar no domínio público.
  - FORA DE ESCOPO: redesenhar projetos externos, publicar pilotos não aprovados e alterar infraestrutura sem necessidade.
