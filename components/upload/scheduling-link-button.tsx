'use client'

import { useState } from 'react'

export function SchedulingLinkButton() {
  const [url, setUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleClick() {
    if (url) {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
      return
    }

    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/musicas/agendamentos/link', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'Erro ao gerar link')
        return
      }
      setUrl(data.url)
      await navigator.clipboard.writeText(data.url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      setError('Erro de conexão. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={handleClick}
        disabled={loading}
        className="self-start rounded-lg border border-gate-azure px-4 py-2 text-sm font-medium text-gate-blue transition hover:border-gate-pink hover:text-gate-pink disabled:opacity-60"
      >
        {loading ? 'Gerando link...' : copied ? 'Link copiado!' : 'Copiar meu link de agendamentos'}
      </button>
      {error && <p className="text-xs text-gate-pink">{error}</p>}
    </div>
  )
}
