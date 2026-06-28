'use client'

// Oferta de armazenamento pago em dinheiro (não em pontos) — separado do
// item "Armazenamento extra" da loja de pontos. Aguardando decisão do
// gateway de pagamento (Mercado Pago, Stripe etc.); o botão fica
// preparado, mas ainda não processa cobrança de verdade.
export function StorageSubscriptionCard() {
  return (
    <div className="rounded-lg border border-gate-pink/40 bg-gate-pink/5 p-4 flex items-center justify-between gap-4">
      <div>
        <p className="text-sm font-semibold text-white">+1GB de armazenamento</p>
        <p className="text-xs text-white/50 mt-0.5">
          Pra quem precisa de mais espaço pra publicar música. Cobrança mensal recorrente.
        </p>
      </div>
      <div className="text-right shrink-0">
        <p className="text-lg font-bold text-gate-pink">R$ 9,99<span className="text-xs text-white/40">/mês</span></p>
        <button
          onClick={() => alert('Pagamento ainda não está disponível — assinatura chega em breve.')}
          className="mt-1 rounded-md border border-gate-pink px-3 py-1.5 text-xs font-semibold text-gate-pink hover:bg-gate-pink/10"
        >
          Assinar
        </button>
      </div>
    </div>
  )
}
