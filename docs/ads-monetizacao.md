# Monetização com Ads — proposta para decisão

> Status: rascunho para discussão. Nada aqui foi implementado ainda.
> Objetivo: monetizar por **visualização (impressão)**, não por clique, sem prejudicar a experiência de navegação. Validar depois com pesquisa de satisfação.

## 1. Princípios que guiam a escolha

1. **Impressão > clique.** O modelo de receita é CPM (custo por mil impressões viáveis), não CPC. Isso remove o incentivo de desenhar anúncios "clicáveis" ou manipular o usuário.
2. **Não intrusivo por padrão.** Sem pop-up, sem interstitial full-screen, sem autoplay de vídeo/áudio com som, sem anúncio que empurre o conteúdo (layout shift).
3. **Poucos slots, fixos e previsíveis.** Em vez de "auto ads" (que o Google insere sozinho em qualquer lugar da página), usar slots manuais, escolhidos a dedo, num número pequeno (1–3 por página).
4. **Não pode competir com o produto.** xDouglas é uma plataforma de música/fórum — o player e a leitura não podem ser interrompidos ou re-layoutados por causa de anúncio.
5. **Mensurável e reversível.** Tudo deve ter métrica (CTR, viewability, receita por sessão) e um *kill switch* fácil (feature flag / env var) para desligar rápido se a pesquisa de satisfação indicar incômodo.

## 2. Onde colocar (slots candidatos)

| Local | Por que funciona | Risco |
|---|---|---|
| Sidebar do fórum (desktop) | Espaço já existe, não compete com conteúdo de leitura | Em mobile não há sidebar — precisa de slot alternativo |
| Entre posts do feed/fórum (in-feed, a cada N posts) | Alto volume de impressões, comportamento já comum em redes sociais | Se mal espaçado, parece "spam" |
| Rodapé fixo discreto (abaixo do player de música) | Sempre visível sem ocupar área de leitura/escuta | Player é a feature mais usada — qualquer atrito aqui é mais sensível |
| Página de perfil / busca | Tráfego de navegação, baixo risco de interromper uma tarefa "ativa" | Volume de pageviews pode ser menor que o feed |

**Não recomendado:** anúncio dentro do player de música, anúncio em modal/overlay, anúncio que carrega antes do conteúdo principal (bloqueando LCP).

## 3. Comparação de provedores

| Provedor | Modelo | Esforço de integração | Observação |
|---|---|---|---|
| **Google AdSense** | CPM + CPC misto, mas dá pra priorizar formatos display/CPM | Baixo — script + `<ins>` por slot | Mais simples para começar; exige aprovação de conta e conteúdo "ad-friendly" (sem conteúdo adulto/pirata) |
| **Google Ad Manager (GAM) — conta pequena/"GAM 360 light"** | Mesma base do AdSense, mais controle de slots e frequência | Médio | Faz mais sentido só quando já há volume e quer vender direto também |
| **Ezoic / Mediavine** | Otimizam automaticamente posição e densidade por CPM | Baixo, mas perde controle fino de posicionamento | Mediavine exige ~50k sessões/mês; Ezoic aceita sites pequenos |
| **Carbon Ads / EthicalAds** | Anúncios estáticos, 1 por página, focado em developer/nicho | Muito baixo | Pague bem menos $, mas é o mais discreto possível — bom para validar a tese de "não incomodar" antes de escalar |

**Recomendação inicial:** AdSense com slots manuais (não "Auto ads") — equilíbrio entre receita e controle. Se a pesquisa de satisfação dali a uns meses mostrar rejeição, dá pra trocar facilmente para Carbon/EthicalAds (menos receita, quase zero incômodo).

## 4. Como evitar prejudicar a navegação (técnico)

- **Carregamento assíncrono e lazy.** Script do provedor com `next/script` em modo `strategy="lazyOnload"` ou `afterInteractive`; slots fora do viewport carregam via `IntersectionObserver` (lazy-load real do anúncio, não só do script).
- **Reservar espaço fixo (evitar CLS).** Todo slot tem altura/largura mínima definida em CSS *antes* do anúncio carregar, para não empurrar o layout quando o ad aparece.
- **Sem impacto no LCP/INP.** Nenhum script de ads bloqueia o `<head>`; nada de ads acima da dobra antes do conteúdo principal.
- **Componente único e centralizado.** Um `<AdSlot slot="forum-sidebar" />` reutilizável em `components/ads/`, que decide internamente se deve renderizar (ver seção 6 — consentimento e feature flag).
- **Sem ads para todo mundo sempre.** Cogitar não mostrar ads para usuários logados/pagantes (se houver plano premium futuro) ou reduzir densidade para usuários "power" — isso é negociável depois.

## 5. LGPD / Consentimento (o projeto já tem `consent-banner.tsx`)

- Ads personalizados (Google) dependem de cookies/IDs — isso **exige consentimento** sob a LGPD, igual ao que provavelmente já existe para analytics.
- Estender o `ConsentBanner` atual para incluir uma categoria "publicidade" separada de "analytics" (granularidade). Se o usuário recusar, servir só anúncios **não personalizados** (contextual) ou nenhum.
- Guardar a escolha do jeito que já é feito hoje pro consentimento de analytics, reaproveitando a mesma lib (`components/consent`).

## 6. Esboço de arquitetura (para quando for implementar)

```
components/ads/
  ad-slot.tsx         # client component, decide se renderiza com base em consentimento + feature flag
  ad-provider.tsx      # carrega o script do provedor 1x (igual ao analytics-provider.tsx)
  index.ts
lib/ads/
  config.ts            # ids de slot, flags de habilitação por página
```

- Seguir o mesmo padrão já usado em `components/analytics/analytics-provider.tsx` (provider único no layout root, hook `use-ads` análogo a `use-analytics`).
- Feature flag via env var (`ADS_ENABLED=true/false`) para desligar tudo num deploy sem mexer em código — útil pro "kill switch" da seção 1.

## 7. Métricas para acompanhar

- **Receita por 1.000 pageviews (RPM)** — a métrica financeira principal.
- **Viewability rate** — % de impressões que de fato ficaram visíveis (provedores como GAM/AdSense reportam isso).
- **CTR** — monitorar mas não otimizar para ele (lembrar do princípio 1).
- **Bounce rate / tempo de sessão antes e depois dos ads** — sinal indireto de incômodo, complementa a pesquisa de satisfação.
- **Core Web Vitals (LCP, CLS, INP)** — comparar antes/depois de ativar ads; qualquer regressão é motivo para revisar posicionamento.

## 8. Plano de rollout sugerido

1. Implementar com **1 único slot** discreto (ex.: sidebar do fórum, só desktop) atrás do feature flag, desligado em produção.
2. Ativar para uma fração pequena de tráfego (ex.: A/B simples por hash de usuário) e medir Web Vitals + bounce rate por 1–2 semanas.
3. Rodar a pesquisa de satisfação já planejada, perguntando especificamente sobre esse slot.
4. Se feedback for neutro/positivo, expandir para os demais slots candidatos (seção 2) e considerar GAM para mais controle.
5. Se feedback for negativo, reduzir densidade ou trocar provedor (Carbon/EthicalAds) antes de desistir da monetização por ads.

## 9. Perguntas abertas para decidir depois

- Vamos rodar AdSense desde o início ou validar primeiro com Carbon/EthicalAds (menos $, menos risco de reputação)?
- Ads ficam visíveis para usuários logados também, ou só para visitantes/não-cadastrados?
- Existe (ou vai existir) plano premium que remove ads — isso muda a arquitetura do `AdSlot` (precisa checar status de assinatura)?
- Qual a densidade máxima aceitável por página antes de incomodar (1 slot? 2? in-feed a cada quantos posts)?
