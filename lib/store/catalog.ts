import { StoreAudience, StoreItemKey } from '@prisma/client'

export interface StoreItemDefinition {
  key: StoreItemKey
  label: string
  audience: StoreAudience
  price: number
  maxConcurrent?: number
  saleWindowHours?: number
  saleWindowLimit?: number
  durationHours?: number
  maxPurchasesPerUser?: number
}

// Catálogo de partida — preço é o único campo que o mercado de preço
// dinâmico reajusta depois (StoreItem.price no banco é a fonte da
// verdade; isto aqui é só o valor inicial usado no seed).
export const STORE_CATALOG: StoreItemDefinition[] = [
  {
    key: 'PRIORITY_INVITE',
    label: 'Convite prioritário',
    audience: 'BOTH',
    price: 5_000,
  },
  {
    key: 'PIN_TRACK_COMMENT',
    label: 'Destacar comentário na própria música',
    audience: 'ARTIST',
    price: 7_000,
    maxConcurrent: 3,
    saleWindowHours: 36,
    saleWindowLimit: 3,
    durationHours: 24,
  },
  {
    key: 'FEATURE_TRACK',
    label: 'Destaque de faixa',
    audience: 'ARTIST',
    price: 10_000,
    maxConcurrent: 3,
    saleWindowHours: 36,
    saleWindowLimit: 3,
    durationHours: 24,
  },
  {
    key: 'EXTRA_STORAGE',
    label: 'Armazenamento extra (+200MB)',
    audience: 'ARTIST',
    price: 15_000,
    maxPurchasesPerUser: 5,
  },
  {
    key: 'MAPPING_ACCESS',
    label: 'Mapeamento ativado (30 dias)',
    audience: 'ARTIST',
    price: 35_000,
    durationHours: 24 * 30,
  },
  {
    key: 'APP_PREMIUM',
    label: 'Conta premium no app (30 dias)',
    audience: 'BOTH',
    price: 35_000,
    durationHours: 24 * 30,
  },
  {
    key: 'PIN_FEED_POST',
    label: 'Fixar comentário no feed',
    audience: 'LISTENER',
    price: 8_000,
    maxConcurrent: 3,
    saleWindowHours: 36,
    saleWindowLimit: 3,
    durationHours: 24,
  },
]
