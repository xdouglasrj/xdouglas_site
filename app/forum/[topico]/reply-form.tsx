'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export function ReplyForm({ threadId }: { threadId: string }) {
  const router = useRouter()
  const [body, setBody] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (busy || !body.trim()) return
    setBusy(true)
    setError(null)
    try {
      const res = await fetch(`/api/forum/threads/${threadId}/replies`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body: body.trim() }),
      })
      if (!res.ok) {
        setError('Não foi possível enviar a resposta.')
        return
      }
      setBody('')
      router.refresh()
    } catch {
      setError('Erro de conexão.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={submit} className="mt-6 rounded-lg border border-gate-azure bg-white/5 p-4">
      <label className="block text-xs font-medium uppercase tracking-wider text-gate-blue mb-1.5">
        Responder
      </label>
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        rows={3}
        maxLength={5000}
        placeholder="Escreva sua resposta…"
        className="w-full resize-y rounded-md border border-gate-azure bg-white/5 px-3 py-2.5 text-sm text-white placeholder-white/30 outline-none transition focus:border-gate-pink focus:ring-1 focus:ring-gate-pink/40"
      />
      <div className="mt-3 flex items-center justify-between">
        {error ? <span className="text-xs text-red-400">{error}</span> : <span />}
        <button
          type="submit"
          disabled={busy || !body.trim()}
          className="rounded-md bg-gate-pink px-5 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
        >
          {busy ? 'Enviando…' : 'Responder'}
        </button>
      </div>
    </form>
  )
}
