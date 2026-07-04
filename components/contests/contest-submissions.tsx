'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePlayer, type PlayerTrack } from '@/components/player/player-provider'

// ============================================================
// V3 Plano 6 — aba "Submissões": lista de faixas participantes (mais
// recente primeiro), com play na fila (clicar toca a faixa e enfileira
// as demais submissões) e badge "🏆 Vencedor" quando aplicável.
// ============================================================

export interface ContestSubmissionCard {
  id: string
  winner: boolean
  track: {
    id: string
    slug: string
    title: string
    coverUrl: string | null
  }
  user: { handle: string | null; name: string | null }
}

export function ContestSubmissions({ submissions }: { submissions: ContestSubmissionCard[] }) {
  const { playTrack } = usePlayer()

  if (submissions.length === 0) {
    return <p className="text-sm text-gate-blue">Nenhuma submissão ainda. Seja o primeiro a participar!</p>
  }

  const queue: PlayerTrack[] = submissions.map((s) => ({
    id: s.track.id,
    slug: s.track.slug,
    title: s.track.title,
    artistName: s.user.name ?? s.user.handle ?? 'Artista',
    coverUrl: s.track.coverUrl,
  }))

  return (
    <div className="flex flex-col divide-y divide-gate-azure/30 rounded-xl border border-gate-azure overflow-hidden">
      {submissions.map((submission, index) => (
        <div
          key={submission.id}
          className="flex items-center gap-3 px-4 py-3 transition hover:bg-white/5"
        >
          <button
            type="button"
            onClick={() => playTrack(queue[index], queue)}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/5 border border-gate-azure text-gate-blue transition hover:border-gate-pink hover:text-gate-pink"
            aria-label={`Tocar ${submission.track.title}`}
          >
            {submission.track.coverUrl ? (
              <Image
                src={submission.track.coverUrl}
                alt={submission.track.title}
                width={40}
                height={40}
                className="h-full w-full rounded-lg object-cover"
              />
            ) : (
              <svg className="h-4 w-4" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
                <path d="M4 2.5v11a1 1 0 0 0 1.53.848l8-5.5a1 1 0 0 0 0-1.696l-8-5.5A1 1 0 0 0 4 2.5z" />
              </svg>
            )}
          </button>

          <div className="min-w-0 flex-1">
            <Link
              href={`/musicas/${submission.track.slug}`}
              className="block text-sm font-medium text-white truncate hover:text-gate-pink transition"
            >
              {submission.track.title}
            </Link>
            <p className="text-xs text-gate-blue truncate">
              {submission.user.name ?? submission.user.handle ?? 'Artista'}
            </p>
          </div>

          {submission.winner && (
            <span className="shrink-0 inline-flex items-center gap-1 rounded-full border border-amber-800/60 bg-amber-950/40 px-2.5 py-1 text-xs font-medium text-amber-400">
              🏆 Vencedor
            </span>
          )}
        </div>
      ))}
    </div>
  )
}
