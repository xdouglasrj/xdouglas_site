'use client'

import { useState } from 'react'

interface PostComposerProps {
  onPosted: () => void
}

export function PostComposer({ onPosted }: PostComposerProps) {
  const [content, setContent] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (busy || !content.trim()) return
    setBusy(true)
    setError(null)
    try {
      const res = await fetch('/api/social/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: content.trim() }),
      })
      if (!res.ok) {
        setError('Não foi possível publicar.')
        return
      }
      setContent('')
      onPosted()
    } catch {
      setError('Erro de conexão.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={submit} className="rounded-lg border border-gate-azure bg-white/5 p-4">
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={3}
        maxLength={2000}
        placeholder="Compartilhe algo com a comunidade…"
        className="w-full resize-none rounded-md border border-gate-azure bg-white/5 px-3 py-2.5 text-sm text-white placeholder-white/30 outline-none transition focus:border-gate-pink focus:ring-1 focus:ring-gate-pink/40"
      />
      <div className="mt-3 flex items-center justify-between">
        {error ? <span className="text-xs text-red-400">{error}</span> : <span />}
        <button
          type="submit"
          disabled={busy || !content.trim()}
          className="rounded-md bg-gate-pink px-5 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
        >
          {busy ? 'Publicando…' : 'Publicar'}
        </button>
      </div>
    </form>
  )
}
