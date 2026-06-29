'use client'

import { useState } from 'react'
import { EXTRA_STORAGE_PRICE_CENTS } from '@/lib/payments/storage-product'
import { STORAGE_PIX_KEY, STORAGE_PIX_NAME, STORAGE_PIX_BANK, STORAGE_WHATSAPP_URL } from '@/lib/payments/storage-manual-payment'

const priceLabel = (EXTRA_STORAGE_PRICE_CENTS / 100).toLocaleString('pt-BR', {
  style: 'currency',
  currency: 'BRL',
})

// Pagamento manual via Pix — enquanto não existe um gateway com API de
// assinatura recorrente, a confirmação e liberação do +1GB são feitas à
// mão pelo admin após o usuário enviar o comprovante pelo WhatsApp.
export function StorageSubscriptionCard() {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(STORAGE_PIX_KEY)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Clipboard pode estar indisponível (ex: contexto não seguro) — sem efeito visual além do botão
    }
  }

  return (
    <div className="rounded-lg border border-gate-pink/40 bg-gate-pink/5 p-4 space-y-3">
      <div>
        <p className="text-sm font-semibold text-white">+1GB de armazenamento / mês</p>
        <p className="text-xs text-white/50 mt-0.5">
          Pra quem precisa de mais espaço pra publicar música. Pague via Pix e envie o comprovante pelo WhatsApp — a liberação é manual por enquanto.
        </p>
      </div>

      <div className="rounded-md border border-white/10 bg-black/20 p-3 text-xs text-white/70 space-y-1">
        <p><span className="text-white/40">Valor:</span> <span className="text-gate-pink font-bold">{priceLabel}</span></p>
        <p><span className="text-white/40">Nome:</span> {STORAGE_PIX_NAME}</p>
        <p><span className="text-white/40">Banco:</span> {STORAGE_PIX_BANK}</p>
        <div className="flex items-center gap-2 pt-1">
          <span className="text-white/40">Chave Pix:</span>
          <code className="text-white/90 break-all">{STORAGE_PIX_KEY}</code>
          <button
            onClick={handleCopy}
            className="ml-auto shrink-0 rounded border border-white/20 px-2 py-0.5 text-[11px] text-white/70 hover:bg-white/10"
          >
            {copied ? 'Copiado!' : 'Copiar'}
          </button>
        </div>
      </div>

      <a
        href={STORAGE_WHATSAPP_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="block w-full rounded-md bg-gate-pink px-3 py-2 text-center text-xs font-semibold text-white hover:bg-gate-pink/90"
      >
        Enviar comprovante no WhatsApp
      </a>
    </div>
  )
}
