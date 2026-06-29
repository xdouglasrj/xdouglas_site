import type { Metadata } from 'next'
import { prisma } from '@/lib/prisma'
import { publishDueScheduledTracks } from '@/lib/tracks/scheduling'
import { ScheduleActions } from './schedule-actions'

export const metadata: Metadata = { title: 'Agendamentos' }
export const dynamic = 'force-dynamic'

export default async function AdminAgendamentosPage() {
  await publishDueScheduledTracks().catch((err) =>
    console.error('[AdminAgendamentosPage] Falha ao publicar agendamentos vencidos', err)
  )

  const tracks = await prisma.track.findMany({
    where: { scheduledAt: { not: null } },
    orderBy: { scheduledAt: 'asc' },
    select: {
      id: true,
      title: true,
      genre: true,
      published: true,
      scheduledAt: true,
      artist: { select: { name: true } },
      submittedBy: { select: { name: true, handle: true, email: true } },
    },
  })

  const now = Date.now()

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-xl font-semibold text-white">Agendamentos</h1>
        <p className="text-sm text-neutral-500 mt-0.5">
          Todas as músicas com lançamento agendado, de todos os artistas. O agendamento já vale
          como aprovação — a publicação acontece automaticamente na data/hora escolhida; cancele
          aqui se precisar interromper.
        </p>
      </div>

      {tracks.length === 0 ? (
        <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-12 text-center">
          <p className="text-neutral-500 text-sm">Nenhum agendamento ativo no momento.</p>
        </div>
      ) : (
        <div className="rounded-xl border border-neutral-800 bg-neutral-900 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-800">
                <th className="text-left px-4 py-3 text-xs font-medium text-neutral-500 uppercase tracking-wide">
                  Faixa
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-neutral-500 uppercase tracking-wide">
                  Artista
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-neutral-500 uppercase tracking-wide">
                  Agendado para
                </th>
                <th className="text-center px-4 py-3 text-xs font-medium text-neutral-500 uppercase tracking-wide">
                  Status
                </th>
                <th className="px-4 py-3 w-40">
                  <span className="sr-only">Ações</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800">
              {tracks.map((track) => {
                const scheduledAt = track.scheduledAt as Date
                const isLate = !track.published && scheduledAt.getTime() <= now

                return (
                  <tr key={track.id} className="hover:bg-neutral-800/40 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-medium text-neutral-200 truncate">{track.title}</p>
                      <p className="text-xs text-neutral-600 truncate">{track.genre ?? '—'}</p>
                    </td>

                    <td className="px-4 py-3 text-neutral-400">
                      <p>{track.artist.name}</p>
                      {track.submittedBy && (
                        <p className="text-xs text-neutral-600">
                          {track.submittedBy.name ?? track.submittedBy.handle ?? track.submittedBy.email}
                        </p>
                      )}
                    </td>

                    <td className="px-4 py-3 text-neutral-400 tabular-nums">
                      {scheduledAt.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                      {' · '}
                      {scheduledAt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </td>

                    <td className="px-4 py-3 text-center">
                      {track.published ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-950/60 text-emerald-400 border border-emerald-800/60">
                          Publicada
                        </span>
                      ) : isLate ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-950/60 text-amber-400 border border-amber-800/60">
                          Publicando…
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-violet-950/60 text-violet-400 border border-violet-800/60">
                          Aguardando
                        </span>
                      )}
                    </td>

                    <td className="px-4 py-3 text-right">
                      {!track.published && <ScheduleActions trackId={track.id} />}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
