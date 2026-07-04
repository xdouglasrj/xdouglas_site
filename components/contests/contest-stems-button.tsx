'use client'

import { useState } from 'react'
import { useAuthPopup } from '@/components/auth/AuthPopupProvider'

// ============================================================
// V3 Plano 6 — botão de download dos stems do contest. Mesma regra de
// download da leva anterior: exige conta (MEMBER+); anônimo/GUEST cai no
// popup de login em vez de bater direto na API (a API também valida —
// isto só evita um round-trip com erro visível).
// ============================================================

interface ContestStemsButtonProps {
  contestId: string
  isLoggedIn: boolean
}

export function ContestStemsButton({ contestId, isLoggedIn }: ContestStemsButtonProps) {
  const { openLogin } = useAuthPopup()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleClick() {
    if (!isLoggedIn) {
      openLogin()
      return
    }

    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/contests/${contestId}/stems`, { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erro ao gerar link de download')
      window.location.href = data.downloadUrl
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao baixar stems')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={handleClick}
        disabled={loading}
        className="rounded-lg border border-gate-azure px-4 py-2.5 text-sm font-semibold text-white transition hover:border-gate-pink hover:text-gate-pink disabled:opacity-50"
      >
        {loading ? 'Gerando link…' : '⬇ Baixar stems'}
      </button>
      {error && <p className="mt-1.5 text-xs text-rose-400">{error}</p>}
    </div>
  )
}
