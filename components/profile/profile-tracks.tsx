import Link from 'next/link'
import { WaveformPlayer } from '@/components/music/waveform-player'
import { TrackLikeButton } from '@/components/music/track-like-button'

interface ProfileTrack {
  id: string
  slug: string
  title: string
  genre: string | null
  coverUrl: string | null
  producerName: string | null
  likeCount: number
}

export function ProfileTracks({
  tracks,
  artistName,
}: {
  tracks: ProfileTrack[]
  artistName: string
}) {
  if (tracks.length === 0) return null

  return (
    <section className="mt-6 rounded-lg border border-gate-azure bg-white/5 p-5">
      <h2 className="text-xs font-bold uppercase tracking-widest text-gate-blue">
        Músicas publicadas ({tracks.length})
      </h2>
      <ul className="mt-3 flex flex-col gap-3">
        {tracks.map((track) => (
          <li key={track.id} className="rounded-xl border border-gate-azure/60 bg-white/[0.03] p-3">
            {/* Nome da música + dj/produtor */}
            <Link href={`/musicas/${track.slug}`} className="group block">
              <p className="text-sm font-medium text-white/90 truncate group-hover:text-gate-pink transition-colors">
                {track.title}
              </p>
              <p className="text-xs text-gate-blue truncate">
                {artistName}
                {track.producerName && track.producerName !== artistName && (
                  <span className="text-white/40"> · prod. {track.producerName}</span>
                )}
              </p>
            </Link>

            {/* Player */}
            <div className="mt-2">
              <WaveformPlayer trackId={track.id} title={track.title} coverUrl={track.coverUrl} />
            </div>

            {/* Gênero + curtidas */}
            <div className="flex items-center justify-between mt-1.5">
              {track.genre ? (
                <span className="text-[10px] uppercase tracking-wide text-gate-blue">{track.genre}</span>
              ) : (
                <span />
              )}
              <TrackLikeButton trackId={track.id} initialCount={track.likeCount} compact />
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}
