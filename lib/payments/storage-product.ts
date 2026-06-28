// Constantes do produto "+1GB pago em dinheiro" — sem imports server-only
// (Prisma etc), pra poder ser usado também em componentes client.

// TODO: TESTE TEMPORÁRIO — volte para 999 (R$ 9,99) antes do deploy final
export const EXTRA_STORAGE_PRICE_CENTS = 100 // R$ 1,00 (teste de pagamento real)
export const EXTRA_STORAGE_BONUS_MB = 1024 // +1GB
export const EXTRA_STORAGE_PRODUCT_KEY = 'EXTRA_STORAGE_1GB'
