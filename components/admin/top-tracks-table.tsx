import Image from 'next/image'
import Link from 'next/link'
import type { TopTrack } from '@/lib/analytics/queries'

interface TopTracksTableProps {
  tracks: TopTrack[]
}

export function TopTracksTable({ tracks }: TopTracksTableProps) {
  if (tracks.length === 0) {
    return (
      <p className="text-sm text-neutral-600 py-8 text-center">
        Nenhum download registrado ainda
      </p>
    )
  }

  return (
    <div className="divide-y divide-neutral-800">
      {tracks.map((track, i) => (
        <div
          key={track.trackId}
          className="flex items-center gap-4 py-3 hover:bg-neutral-800/30 -mx-2 px-2 rounded-lg transition-colors"
        >
          {/* Posição */}
          <span className="w-5 shrink-0 text-xs font-medium text-neutral-600 tabular-nums text-right">
            {i + 1}
          </span>

          {/* Capa */}
          <div className="relative w-9 h-9 shrink-0 rounded-md overflow-hidden bg-neutral-800">
            {track.coverUrl ? (
              <Image
                src={track.coverUrl}
                alt={track.title}
                fill
                sizes="36px"
                className="object-cover"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xs text-neutral-600 font-bold">
                  {track.title.charAt(0)}
                </span>
              </div>
            )}
          </div>

          {/* Título e artista */}
          <div className="flex-1 min-w-0">
            <Link
              href={`/musicas/${track.trackId}`}
              className="text-sm font-medium text-neutral-200 hover:text-white transition-colors truncate block"
            >
              {track.title}
            </Link>
            <p className="text-xs text-neutral-500 truncate">{track.artistName}</p>
          </div>

          {/* Downloads */}
          <span className="shrink-0 text-sm font-semibold text-white tabular-nums">
            {track.downloads.toLocaleString('pt-BR')}
          </span>
        </div>
      ))}
    </div>
  )
}
