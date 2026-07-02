// ============================================================
// Definição estática dos slots de anúncio disponíveis.
// Os IDs reais (data-ad-slot do provedor) ficam no banco —
// ver lib/settings/ads.ts — e são editáveis pelo admin sem deploy.
// ============================================================

export const AD_SLOTS = {
  'forum-sidebar': {
    label: 'Fórum — sidebar (desktop)',
    description: 'Lateral direita da lista de tópicos do fórum. Só aparece em telas md+.',
    pages: ['/forum'],
    width: 300,
    height: 250,
  },
} as const

export type AdSlotKey = keyof typeof AD_SLOTS
