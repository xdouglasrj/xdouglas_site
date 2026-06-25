'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export function SeedFictionalContentCard() {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<{ tracks: number; users: number; posts: number; comments: number } | null>(null)

  async function handleClick() {
    if (busy) return
    setBusy(true)
    setError(null)
    setResult(null)
    try {
      const res = await fetch('/api/admin/seed-fictional-content', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) {
        setError('Não foi possível adicionar o conteúdo fictício.')
        return
      }
      setResult(data)
      router.refresh()
    } catch {
      setError('Erro de conexão.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mt-6 rounded-xl border border-amber-800/60 bg-amber-950/20 p-5">
      <h2 className="text-sm font-semibold text-white">Conteúdo fictício de lançamento</h2>
      <p className="mt-1 text-xs text-neutral-400 max-w-md">
        Adiciona 20 músicas, 3 artistas e alguns posts/comentários inventados —
        só para o catálogo e o feed não ficarem vazios antes de existir
        conteúdo real. Tudo fica claramente identificável no banco (slugs
        começando com <code>seed-ficticia-</code>, e-mails terminando em{' '}
        <code>@exemplo.com</code>) para você apagar quando quiser. Pode clicar
        de novo sem duplicar nada.
      </p>

      <button
        type="button"
        onClick={handleClick}
        disabled={busy}
        className="mt-4 rounded-lg border border-amber-700 bg-amber-900/40 px-4 py-2.5 text-sm font-medium text-amber-200 transition hover:bg-amber-900/60 disabled:opacity-50"
      >
        {busy ? 'Adicionando…' : 'Adicionar conteúdo fictício'}
      </button>

      {error && <p className="mt-3 text-xs text-rose-400">{error}</p>}
      {result && !error && (
        <p className="mt-3 text-xs text-emerald-400">
          OK — {result.tracks} músicas, {result.users} usuários, {result.posts} posts, {result.comments} comentários.
        </p>
      )}
    </div>
  )
}
