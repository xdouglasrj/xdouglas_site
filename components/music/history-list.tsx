'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import type { ListeningHistoryEntry } from '@/lib/social/listening-history'

// ============================================================
// Lista da página /biblioteca/historico (V3 Plano 17) — últimas faixas
// ouvidas + botão "limpar histórico". Histórico é PRIVADO.
// ============================================================

function formatRelativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime()
  const diffMin = Math.floor(diffMs / 60_000)

  if (diffMin < 1) return 'agora há pouco'
  if (diffMin < 60) return `ouvido há ${diffMin} minuto${diffMin !== 1 ? 's' : ''}`

  const diffHours = Math.floor(diffMin / 60)
  if (diffHours < 24) return `ouvido há ${diffHours} hora${diffHours !== 1 ? 's' : ''}`

  const diffDays = Math.floor(diffHours / 24)
  if (diffDays < 30) return `ouvido há ${diffDays} dia${diffDays !== 1 ? 's' : ''}`

  const diffMonths = Math.floor(diffDays / 30)
  return `ouvido há ${diffMonths} mês${diffMonths !== 1 ? 'es' : ''}`
}

interface HistoryListProps {
  entries: ListeningHistoryEntry[]
}

export function HistoryList({ entries }: HistoryListProps) {
  const router = useRouter()
  const [clearing, setClearing] = useState(false)
  const [cleared, setCleared] = useState(false)

  async function handleClear() {
    if (clearing) return
    const confirmed = window.confirm('Limpar todo o histórico de escuta? Essa ação não pode ser desfeita.')
    if (!confirmed) return

    setClearing(true)
    try {
      const res = await fetch('/api/social/history', { method: 'DELETE' })
      if (res.ok) {
        setCleared(true)
        router.refresh()
      }
    } catch {
      // Silencioso — usuário pode tentar de novo
    } finally {
      setClearing(false)
    }
  }

  const visible = cleared ? [] : entries

  return (
    <div>
      {visible.length > 0 && (
        <div className="flex justify-end mb-4">
          <button
            onClick={handleClear}
            disabled={clearing}
            className="text-xs font-medium text-white/50 hover:text-gate-pink transition disabled:opacity-50"
          >
            {clearing ? 'Limpando…' : 'Limpar histórico'}
          </button>
        </div>
      )}

      {visible.length === 0 ? (
        <p className="text-sm text-white/40 py-12 text-center">
          Você ainda não ouviu nenhuma música.
        </p>
      ) : (
        <ul className="divide-y divide-gate-azure/40 rounded-lg border border-gate-azure bg-white/5">
          {visible.map(({ track, playedAt }) => (
            <li key={track.id}>
              <Link
                href={`/musicas/${track.slug}`}
                className="flex items-center gap-3 p-4 transition hover:bg-white/5"
              >
                {track.coverUrl ? (
                  <Image
                    src={track.coverUrl}
                    alt={track.title}
                    width={40}
                    height={40}
                    className="rounded-md object-cover shrink-0"
                  />
                ) : (
                  <div className="w-10 h-10 shrink-0 rounded-md bg-white/10 flex items-center justify-center">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gate-blue">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 18V5l12-2v13" />
                      <circle cx="6" cy="18" r="3" />
                      <circle cx="18" cy="16" r="3" />
                    </svg>
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-white truncate">{track.title}</p>
                  <p className="text-xs text-white/40 truncate">{track.artist.name}</p>
                </div>
                <span className="text-[11px] text-white/30 shrink-0">{formatRelativeTime(playedAt)}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
