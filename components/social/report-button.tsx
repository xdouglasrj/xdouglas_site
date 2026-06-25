'use client'

import { useState } from 'react'

type ReportTargetType = 'POST' | 'COMMENT' | 'FORUM_THREAD' | 'FORUM_REPLY' | 'TRACK' | 'USER'

interface ReportButtonProps {
  targetType: ReportTargetType
  targetId: string
}

export function ReportButton({ targetType, targetId }: ReportButtonProps) {
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState('')
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (busy || reason.trim().length < 3) return
    setBusy(true)
    setError(null)
    try {
      const res = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetType, targetId, reason: reason.trim() }),
      })
      if (!res.ok) {
        setError('Não foi possível enviar a denúncia.')
        return
      }
      setDone(true)
      setOpen(false)
    } catch {
      setError('Erro de conexão.')
    } finally {
      setBusy(false)
    }
  }

  if (done) {
    return <span className="text-xs text-neutral-500">Denúncia enviada</span>
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-xs text-white/30 hover:text-red-400 transition"
      >
        Denunciar
      </button>
    )
  }

  return (
    <form onSubmit={submit} className="mt-2 flex flex-col gap-2 rounded-md border border-gate-azure bg-white/5 p-3">
      <label className="text-xs text-gate-blue">Por que você está denunciando isso?</label>
      <textarea
        autoFocus
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        rows={2}
        maxLength={500}
        className="w-full rounded-md border border-gate-azure bg-white/5 px-2 py-1.5 text-xs text-white placeholder-white/30 outline-none focus:border-gate-pink"
        placeholder="Conte um pouco mais…"
      />
      <div className="flex items-center gap-2">
        <button
          type="submit"
          disabled={busy || reason.trim().length < 3}
          className="rounded-md bg-red-900/60 px-3 py-1.5 text-xs font-semibold text-red-300 transition hover:bg-red-900 disabled:opacity-50"
        >
          {busy ? 'Enviando…' : 'Enviar denúncia'}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-xs text-white/40 hover:text-white"
        >
          Cancelar
        </button>
      </div>
      {error && <p className="text-xs text-red-400">{error}</p>}
    </form>
  )
}
