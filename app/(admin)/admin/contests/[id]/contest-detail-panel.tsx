'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface EntryItem {
  id: string
  winner: boolean
  createdAt: string
  track: { id: string; slug: string; title: string; coverUrl: string | null; genre: string | null }
  user: { id: string; handle: string | null; name: string | null }
}

export function ContestDetailPanel({
  contestId,
  entries,
}: {
  contestId: string
  entries: EntryItem[]
}) {
  const router = useRouter()
  const [busyId, setBusyId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function markWinner(entry: EntryItem) {
    if (entry.winner) return
    if (!window.confirm(`Marcar "${entry.user.name ?? entry.user.handle ?? 'usuário'}" como vencedor(a)? Isso credita os pontos do prêmio e destaca a faixa por 7 dias.`)) {
      return
    }
    setBusyId(entry.id)
    setError(null)
    try {
      const res = await fetch(`/api/admin/contests/entries/${entry.id}/winner`, { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erro ao marcar vencedor')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao marcar vencedor')
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="space-y-4">
      {error && <p className="text-xs text-rose-400">{error}</p>}

      <div className="rounded-xl border border-neutral-800 bg-neutral-900 divide-y divide-neutral-800">
        {entries.length === 0 && (
          <p className="p-4 text-sm text-neutral-500">Nenhuma submissão ainda.</p>
        )}
        {entries.map((entry) => (
          <div key={entry.id} className="flex items-center justify-between gap-3 p-4">
            <div className="min-w-0">
              <Link
                href={`/musicas/${entry.track.slug}`}
                target="_blank"
                className="text-sm font-medium text-neutral-200 hover:text-gate-pink truncate"
              >
                {entry.track.title}
              </Link>
              <p className="text-xs text-neutral-500">
                {entry.user.name ?? entry.user.handle ?? 'usuário'}
                {' · '}
                {new Date(entry.createdAt).toLocaleDateString('pt-BR')}
                {entry.track.genre && ` · ${entry.track.genre}`}
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {entry.winner ? (
                <span className="inline-flex items-center gap-1 rounded-full border border-amber-800/60 bg-amber-950/40 px-2.5 py-1 text-xs font-medium text-amber-400">
                  🏆 Vencedor
                </span>
              ) : (
                <button
                  onClick={() => markWinner(entry)}
                  disabled={busyId === entry.id}
                  className="rounded-lg border border-neutral-700 px-3 py-1.5 text-xs font-medium text-neutral-300 transition hover:border-gate-pink hover:text-gate-pink disabled:opacity-50"
                >
                  {busyId === entry.id ? 'Marcando…' : 'Marcar vencedor'}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
