import Image from 'next/image'
import Link from 'next/link'
import type { TrackPlayStats } from '@/lib/analytics/queries'

interface TrackPlaysTableProps {
  tracks: TrackPlayStats[]
  query?: string
}

export function TrackPlaysTable({ tracks, query }: TrackPlaysTableProps) {
  if (tracks.length === 0) {
    return (
      <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-12 text-center">
        <p className="text-neutral-500 text-sm">
          {query
            ? `Nenhuma música encontrada para "${query}"`
            : 'Nenhuma música cadastrada ainda'}
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-neutral-800 bg-neutral-900 overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-neutral-800">
            <th className="text-left px-4 py-3 text-xs font-medium text-neutral-500 uppercase tracking-wide">
              Faixa
            </th>
            <th className="text-right px-4 py-3 text-xs font-medium text-neutral-500 uppercase tracking-wide">
              Iniciaram
            </th>
            <th className="text-right px-4 py-3 text-xs font-medium text-neutral-500 uppercase tracking-wide hidden sm:table-cell">
              Passaram 30s
            </th>
            <th className="text-right px-4 py-3 text-xs font-medium text-neutral-500 uppercase tracking-wide hidden md:table-cell">
              Completaram
            </th>
            <th className="text-right px-4 py-3 text-xs font-medium text-neutral-500 uppercase tracking-wide">
              % conclusão
            </th>
            <th className="px-4 py-3 w-28">
              <span className="sr-only">Ações</span>
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-800">
          {tracks.map((track) => (
            <tr key={track.trackId} className="hover:bg-neutral-800/40 transition-colors">
              <td className="px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className="relative w-8 h-8 shrink-0 rounded-md overflow-hidden bg-neutral-800">
                    {track.coverUrl ? (
                      <Image
                        src={track.coverUrl}
                        alt={track.title}
                        fill
                        sizes="32px"
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
                  <div className="min-w-0">
                    <p className="font-medium text-neutral-200 truncate">{track.title}</p>
                    <p className="text-xs text-neutral-600 truncate">
                      {track.artistName}
                      {!track.published && (
                        <span className="ml-1.5 text-neutral-500">· rascunho</span>
                      )}
                    </p>
                  </div>
                </div>
              </td>

              <td className="px-4 py-3 text-right font-semibold text-white tabular-nums">
                {track.playStarts.toLocaleString('pt-BR')}
              </td>

              <td className="px-4 py-3 text-right text-neutral-400 tabular-nums hidden sm:table-cell">
                {track.play30s.toLocaleString('pt-BR')}
              </td>

              <td className="px-4 py-3 text-right text-neutral-400 tabular-nums hidden md:table-cell">
                {track.playComplete.toLocaleString('pt-BR')}
              </td>

              <td className="px-4 py-3 text-right">
                <span
                  className={[
                    'tabular-nums font-medium',
                    track.completionPct >= 50 ? 'text-emerald-400' : 'text-neutral-400',
                  ].join(' ')}
                >
                  {track.completionPct}%
                </span>
              </td>

              <td className="px-4 py-3 text-right">
                <Link
                  href={`/admin/musicas/${track.trackId}/analytics`}
                  className="text-xs font-medium text-violet-400 hover:text-violet-300 transition-colors whitespace-nowrap"
                >
                  Ver detalhes
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
