'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

// ============================================================
// V3 Plano 20 — badge de aviso de copyright (AcoustID) na
// moderação do admin. Puramente informativo: NUNCA muda o fluxo
// de aprovar/rejeitar — a decisão é sempre do admin.
// ============================================================

interface CopyrightMatchResult {
  score: number
  recordingId: string
  title: string
  artist: string
}

interface CopyrightBadgeProps {
  trackId: string
  status: string
  result: CopyrightMatchResult | null
}

export function CopyrightBadge({ trackId, status, result }: CopyrightBadgeProps) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)

  async function handleRecheck() {
    setBusy(true)
    try {
      await fetch(`/api/admin/musicas/${trackId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'recheckCopyright' }),
      })
      router.refresh()
    } finally {
      setBusy(false)
    }
  }

  if (status === 'match' && result) {
    return (
      <div className="flex items-center gap-1.5" title="Indicativo, não é prova de infração — decisão é sempre do moderador">
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-950/60 text-amber-400 border border-amber-800/60">
          ⚠️ Possível música registrada: {result.artist} — {result.title} (confiança {Math.round(result.score * 100)}%)
        </span>
      </div>
    )
  }

  if (status === 'clear') {
    return (
      <span className="text-[10px] text-neutral-600" title="Sem match encontrado no banco do AcoustID">
        ✓ sem match no AcoustID
      </span>
    )
  }

  if (status === 'error' || status === 'pending') {
    return (
      <div className="flex items-center gap-1.5">
        <span className="text-[10px] text-neutral-600">
          {status === 'error' ? 'verificação de copyright falhou' : 'verificação de copyright pendente'}
        </span>
        <button
          type="button"
          onClick={handleRecheck}
          disabled={busy}
          className="text-[10px] text-violet-400 hover:text-violet-300 disabled:opacity-40 transition-colors"
        >
          verificar novamente
        </button>
      </div>
    )
  }

  // "skipped" — sem ACOUSTID_API_KEY configurada ou fpcalc indisponível no
  // ambiente. Discreto, não incomoda o admin.
  return <span className="text-[10px] text-neutral-700">verificação de copyright não disponível</span>
}
