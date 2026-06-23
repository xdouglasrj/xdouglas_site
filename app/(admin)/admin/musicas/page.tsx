import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { prisma } from '@/lib/prisma'
import { TrackActions } from './track-actions'

export const metadata: Metadata = { title: 'Músicas' }
export const dynamic = 'force-dynamic'

export default async function AdminMusicasPage() {
  const tracks = await prisma.track.findMany({
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      slug: true,
      title: true,
      genre: true,
      audioFormat: true,
      published: true,
      downloadCount: true,
      coverUrl: true,
      createdAt: true,
      artist: { select: { name: true } },
      submittedById: true,
    },
  })

  return (
    <div className="max-w-5xl mx-auto">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-xl font-semibold text-white">Músicas</h1>
          <p className="text-sm text-neutral-500 mt-0.5">
            {tracks.length} faixa{tracks.length !== 1 ? 's' : ''} cadastrada{tracks.length !== 1 ? 's' : ''}
          </p>
        </div>

        <Link
          href="/admin/musicas/nova"
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-rose-600 hover:bg-rose-500 rounded-lg transition-colors"
        >
          <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            <path d="M8 3v10M3 8h10" />
          </svg>
          Nova música
        </Link>
      </div>

      {/* Tabela */}
      {tracks.length === 0 ? (
        <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-12 text-center">
          <p className="text-neutral-500 text-sm mb-4">
            Nenhuma música cadastrada ainda.
          </p>
          <Link
            href="/admin/musicas/nova"
            className="text-sm text-rose-500 hover:text-rose-400 transition-colors"
          >
            Criar primeira música →
          </Link>
        </div>
      ) : (
        <div className="rounded-xl border border-neutral-800 bg-neutral-900 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-800">
                <th className="text-left px-4 py-3 text-xs font-medium text-neutral-500 uppercase tracking-wide">
                  Faixa
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-neutral-500 uppercase tracking-wide hidden sm:table-cell">
                  Gênero
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-neutral-500 uppercase tracking-wide hidden md:table-cell">
                  Formato
                </th>
                <th className="text-right px-4 py-3 text-xs font-medium text-neutral-500 uppercase tracking-wide">
                  Downloads
                </th>
                <th className="text-center px-4 py-3 text-xs font-medium text-neutral-500 uppercase tracking-wide">
                  Status
                </th>
                <th className="px-4 py-3 w-24">
                  <span className="sr-only">Ações</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800">
              {tracks.map((track) => (
                <tr key={track.id} className="hover:bg-neutral-800/40 transition-colors">

                  {/* Faixa */}
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
                        <p className="font-medium text-neutral-200 truncate">
                          {track.title}
                        </p>
                        <p className="text-xs text-neutral-600 truncate">
                          {track.artist.name}
                          {track.submittedById && (
                            <span className="ml-1.5 text-violet-400">· enviada por artista</span>
                          )}
                        </p>
                      </div>
                    </div>
                  </td>

                  {/* Gênero */}
                  <td className="px-4 py-3 text-neutral-400 hidden sm:table-cell">
                    {track.genre ?? '—'}
                  </td>

                  {/* Formato */}
                  <td className="px-4 py-3 hidden md:table-cell">
                    <span className="px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide rounded bg-neutral-800 text-neutral-400 border border-neutral-700">
                      {track.audioFormat}
                    </span>
                  </td>

                  {/* Downloads */}
                  <td className="px-4 py-3 text-right font-semibold text-white tabular-nums">
                    {track.downloadCount.toLocaleString('pt-BR')}
                  </td>

                  {/* Status */}
                  <td className="px-4 py-3 text-center">
                    <span className={[
                      'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium',
                      track.published
                        ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/60'
                        : 'bg-neutral-800 text-neutral-500 border border-neutral-700',
                    ].join(' ')}>
                      <span className={`w-1 h-1 rounded-full ${track.published ? 'bg-emerald-400' : 'bg-neutral-500'}`} aria-hidden="true" />
                      {track.published ? 'Publicada' : 'Rascunho'}
                    </span>
                  </td>

                  {/* Ações */}
                  <td className="px-4 py-3">
                    <TrackActions
                      trackId={track.id}
                      slug={track.slug}
                      published={track.published}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
