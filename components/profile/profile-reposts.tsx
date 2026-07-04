import Link from 'next/link'
import { WaveformPlayer } from '@/components/music/waveform-player'
import { TrackLikeButton } from '@/components/music/track-like-button'
import type { PlayerTrack } from '@/components/player/player-provider'

// ============================================================
// Seção "Reposts" do perfil (V3 Plano 3) — mesmo padrão visual
// de profile-tracks.tsx, com rótulo "repostado em <data>".
// ============================================================

interface RepostedTrack {
  id: string
  slug: string
  title: string
  genre: string | null
  coverUrl: string | null
  producerName: string | null
  artistName: string
  likeCount: number
}

interface ProfileRepost {
  repostedAt: string
  track: RepostedTrack
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  })
}

export function ProfileReposts({ reposts }: { reposts: ProfileRepost[] }) {
  if (reposts.length === 0) return null

  // Fila do player global — tocar um repost enfileira a lista de reposts
  const playerQueue: PlayerTrack[] = reposts.map(({ track }) => ({
    id: track.id,
    slug: track.slug,
    title: track.title,
    artistName: track.artistName,
    coverUrl: track.coverUrl,
  }))

  return (
    <section className="mt-6 rounded-lg border border-gate-azure bg-white/5 p-5">
      <h2 className="text-xs font-bold uppercase tracking-widest text-gate-blue">
        Reposts ({reposts.length})
      </h2>
      <ul className="mt-3 flex flex-col gap-3">
        {reposts.map(({ repostedAt, track }) => (
          <li key={track.id} className="rounded-xl border border-gate-azure/60 bg-white/[0.03] p-3">
            {/* Nome da música + artista */}
            <Link href={`/musicas/${track.slug}`} className="group block">
              <p className="text-sm font-medium text-white/90 truncate group-hover:text-gate-pink transition-colors">
                {track.title}
              </p>
              <p className="text-xs text-gate-blue truncate">
                {track.artistName}
                {track.producerName && track.producerName !== track.artistName && (
                  <span className="text-white/40"> · prod. {track.producerName}</span>
                )}
              </p>
            </Link>

            {/* Player */}
            <div className="mt-2">
              <WaveformPlayer
                trackId={track.id}
                slug={track.slug}
                title={track.title}
                artistName={track.artistName}
                coverUrl={track.coverUrl}
                queue={playerQueue}
              />
            </div>

            {/* Data do repost + gênero + curtidas */}
            <div className="flex items-center justify-between mt-1.5">
              <span className="text-[10px] uppercase tracking-wide text-gate-blue">
                <span className="inline-flex items-center gap-1">
                  <svg className="w-3 h-3" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M4.5 5.5h6a2 2 0 0 1 2 2V8M10.5 3.5l2 2-2 2" />
                    <path d="M11.5 10.5h-6a2 2 0 0 1-2-2V8M5.5 12.5l-2-2 2-2" />
                  </svg>
                  repostado em {formatDate(repostedAt)}
                </span>
                {track.genre && <span className="ml-2 text-white/40">{track.genre}</span>}
              </span>
              <TrackLikeButton trackId={track.id} initialCount={track.likeCount} compact />
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}
