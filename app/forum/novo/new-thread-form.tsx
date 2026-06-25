'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export function NewThreadForm() {
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (busy) return
    setError(null)

    if (title.trim().length < 3) { setError('Título muito curto.'); return }
    if (!body.trim()) { setError('Escreva o conteúdo do tópico.'); return }

    setBusy(true)
    try {
      const res = await fetch('/api/forum/threads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: title.trim(), body: body.trim() }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Erro ao criar tópico'); return }

      router.push(`/forum/${data.thread.id}`)
    } catch {
      setError('Erro de conexão.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={submit} className="mt-6 flex flex-col gap-4 max-w-xl">
      {error && (
        <p className="rounded-lg border border-gate-pink/40 bg-gate-pink/10 px-4 py-3 text-sm text-gate-pink">
          {error}
        </p>
      )}

      <div>
        <label className="block text-xs font-medium uppercase tracking-wider text-gate-blue mb-1.5">Título</label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={160}
          placeholder="Sobre o que você quer falar?"
          className="w-full rounded-lg border border-gate-azure bg-white/5 px-4 py-3 text-sm text-white placeholder-white/30 outline-none transition focus:border-gate-pink focus:ring-1 focus:ring-gate-pink/40"
        />
      </div>

      <div>
        <label className="block text-xs font-medium uppercase tracking-wider text-gate-blue mb-1.5">Conteúdo</label>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={6}
          maxLength={5000}
          placeholder="Detalhe sua pergunta, pedido ou discussão…"
          className="w-full resize-y rounded-lg border border-gate-azure bg-white/5 px-4 py-3 text-sm text-white placeholder-white/30 outline-none transition focus:border-gate-pink focus:ring-1 focus:ring-gate-pink/40"
        />
      </div>

      <button
        type="submit"
        disabled={busy}
        className="rounded-lg bg-gate-pink py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60 w-fit px-6"
      >
        {busy ? 'Publicando…' : 'Publicar tópico'}
      </button>
    </form>
  )
}
