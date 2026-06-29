import type { Metadata } from 'next'
import { prisma } from '@/lib/prisma'
import { normalizeSchedulingToken } from '@/lib/tracks/scheduling'

export const metadata: Metadata = {
  title: 'Músicas agendadas',
  robots: { index: false, follow: false },
}
export const dynamic = 'force-dynamic'

export default async function AgendamentosPage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params
  const normalized = normalizeSchedulingToken(token)

  const artist = await prisma.artist.findUnique({
    where: { schedulingToken: normalized },
    select: {
      name: true,
      tracks: {
        where: { scheduledAt: { not: null } },
        orderBy: { scheduledAt: 'asc' },
        select: { id: true, title: true, genre: true, published: true, scheduledAt: true },
      },
    },
  })

  if (!artist) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gate-bg px-4">
        <p className="text-sm text-gate-blue">Link de agendamentos inválido ou expirado.</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gate-bg px-4 py-12 sm:px-8">
      <div className="mx-auto max-w-2xl">
        <h1 className="text-2xl font-bold text-white">Músicas agendadas</h1>
        <p className="mt-1 text-sm text-gate-blue">{artist.name}</p>

        {artist.tracks.length === 0 ? (
          <p className="mt-8 text-sm text-gate-blue">Nenhuma música agendada no momento.</p>
        ) : (
          <div className="mt-8 rounded-xl border border-gate-azure bg-white/5 overflow-hidden">
            <ul className="divide-y divide-gate-azure">
              {artist.tracks.map((track) => (
                <li key={track.id} className="flex items-center justify-between px-4 py-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-white truncate">{track.title}</p>
                    <p className="text-xs text-gate-blue">
                      {track.scheduledAt &&
                        new Date(track.scheduledAt).toLocaleString('pt-BR', {
                          day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
                        })}
                      {track.genre && ` · ${track.genre}`}
                    </p>
                  </div>
                  {track.published ? (
                    <span className="inline-flex shrink-0 items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-950/60 text-emerald-400 border border-emerald-800/60">
                      Publicada
                    </span>
                  ) : (
                    <span className="inline-flex shrink-0 items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-neutral-800 text-neutral-400 border border-neutral-700">
                      Agendada
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}
