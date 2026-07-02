# Métricas de ads para acompanhar

> Referência: seção 7 de `ads-monetizacao.md`. Nada aqui está implementado —
> é a lista do que monitorar quando o slot `forum-sidebar` for ativado em
> produção (rollout gradual, seção 8 do plano original).

## Financeiras

- **RPM (receita por 1.000 pageviews)** — métrica principal. Vem do painel
  do provedor (AdSense/GAM); não precisa de instrumentação própria no início.
- **CTR** — acompanhar, mas não otimizar para ele (o modelo é CPM/impressão,
  não clique — ver princípio 1 do plano).

## Qualidade do anúncio

- **Viewability rate** — % de impressões que de fato ficaram visíveis na
  tela pelo tempo mínimo exigido pelo provedor. Reportado pelo próprio
  AdSense/GAM.

## Impacto na experiência (Core Web Vitals)

- **CLS (Cumulative Layout Shift)** — comparar antes/depois de ativar o
  slot. Deve permanecer ~0 porque o `AdSlot` reserva o espaço fixo
  (300x250) antes de qualquer script carregar. Qualquer regressão aqui é
  motivo para revisar a posição ou o CSS do slot.
- **LCP (Largest Contentful Paint)** — o script do provedor usa
  `next/script strategy="lazyOnload"`, então não deveria competir com o
  LCP. Confirmar com Lighthouse/PageSpeed Insights e com dados reais (CrUX
  ou RUM) depois do rollout.
- **INP (Interaction to Next Paint)** — verificar se o carregamento lazy do
  anúncio (via `IntersectionObserver`) não introduz jank ao rolar a página
  do fórum.

## Sinais indiretos de incômodo

- **Bounce rate / tempo de sessão** no fórum, antes e depois — comparar com
  o `AnalyticsProvider` já existente (eventos `page_view`).
- **Taxa de recusa do consentimento de publicidade** (`xd_consent_ads` no
  banner) — se cair muito em relação ao consentimento de analytics, é sinal
  de rejeição específica a ads.
- **Pesquisa de satisfação** planejada separadamente — perguntar
  especificamente sobre o slot `forum-sidebar`.

## Quando revisar

Seguindo o plano de rollout (seção 8): rodar com tráfego reduzido por 1–2
semanas, medir os itens acima, e só então decidir entre expandir para mais
slots, manter como está, ou trocar de provedor (Carbon/EthicalAds) se o
feedback for negativo.
