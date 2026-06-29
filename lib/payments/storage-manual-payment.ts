// Dados do pagamento manual do +1GB de armazenamento — sem imports
// server-only, pra poder ser usado também em componentes client.

export const STORAGE_PIX_KEY = '916ff155-e055-4d81-af42-824d3e57181d'
export const STORAGE_PIX_NAME = 'Douglas Cavalcanti'
export const STORAGE_PIX_BANK = 'InfinitePay'

const WHATSAPP_NUMBER = '5521965883126'
const WHATSAPP_MESSAGE = 'Olá! Acabei de pagar o +1GB de armazenamento via Pix, segue o comprovante:'

export const STORAGE_WHATSAPP_URL = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(WHATSAPP_MESSAGE)}`
