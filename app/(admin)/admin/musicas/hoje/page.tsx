import type { Metadata } from 'next'
import Image from 'next/image'
import { prisma } from '@/lib/prisma'
import { publishDueScheduledTracks } from '@/lib/tracks/scheduling'
import { TrackActions } from '../track-actions'

export const metadata: Metadata = { title: 'Pedidos do dia' }
export const dynamic = 'force-dynamic'

type TrackRow = {
  id: string
  slug: string
  title: string
  genre: string | null
  audioFormat: string
  published: boolean
  pinned: boolean
  downloadCount: number
  coverUrl: string | null
  createdAt: Date
  artist: { name: string }
  submittedById: string | null
}

export default async function AdminMusicasHojePage() {
  await publishDueScheduledTracks().catch((err) =>
    console.error('[AdminMusicasHojePage] Falha ao publicar agendamentos vencidos', err)
  )

  const startOfToday = new Date()
  startOfToday.setHours(0, 0, 0, 0)

  const baseSelect = {
    id: true,
    slug: true,
    title: true,
    genre: true,
    audioFormat: true,
    published: true,
    pinned: true,
    downloadCount: true,
    coverUrl: true,
    createdAt: true,
    artist: { select: { name: true } },
    submittedById: true,
  } as const

  const [published, pedidosHoje] = await Promise.all([
    prisma.track.findMany({
      where: { published: true },
      orderBy: [{ pinned: 'desc' }, { publishedAt: 'desc' }],
      select: baseSelect,
    }),
    prisma.track.findMany({
      where: { published: false, createdAt: { gte: startOfToday } },
      orderBy: { createdAt: 'desc' },
      select: baseSelect,
    }),
  ])

  return (
    <div className="max-w-5xl mx-auto flex flex-col gap-10">
      <div>
        <h1 className="text-xl font-semibold text-white">Pedidos do dia</h1>
        <p className="text-sm text-neutral-500 mt-0.5">
          Separa o que já está publicado do que foi enviado hoje e ainda aguarda revisão.
        </p>
      </div>

      <TracksSection
        title="Pedidos enviados hoje"
        emptyMessage="Nenhum pedido novo enviado hoje."
        tracks={pedidosHoje}
      />

      <TracksSection
        title="Já publicadas"
        emptyMessage="Nenhuma música publicada ainda."
        tracks={published}
      />
    </div>
  )
}

function TracksSection({
  title,
  emptyMessage,
  tracks,
}: {
  title: string
  emptyMessage: string
  tracks: TrackRow[]
}) {
  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-white">{title}</h2>
        <span className="text-xs text-neutral-500">
          {tracks.length} faixa{tracks.length !== 1 ? 's' : ''}
        </span>
      </div>

      {tracks.length === 0 ? (
        <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-8 text-center">
          <p className="text-neutral-500 text-sm">{emptyMessage}</p>
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
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="relative w-8 h-8 shrink-0 rounded-md overflow-hidden bg-neutral-800">
                        {track.coverUrl ? (
                          <Image src={track.coverUrl} alt={track.title} fill sizes="32px" className="object-cover" />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-xs text-neutral-600 font-bold">{track.title.charAt(0)}</span>
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-neutral-200 truncate">{track.title}</p>
                        <p className="text-xs text-neutral-600 truncate">
                          {track.artist.name}
                          {track.submittedById && (
                            <span className="ml-1.5 text-violet-400">· enviada por artista</span>
                          )}
                        </p>
                      </div>
                    </div>
                  </td>

                  <td className="px-4 py-3 text-neutral-400 hidden sm:table-cell">{track.genre ?? '—'}</td>

                  <td className="px-4 py-3 text-right font-semibold text-white tabular-nums">
                    {track.downloadCount.toLocaleString('pt-BR')}
                  </td>

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

                  <td className="px-4 py-3">
                    <TrackActions
                      trackId={track.id}
                      slug={track.slug}
                      published={track.published}
                      pinned={track.pinned}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}
