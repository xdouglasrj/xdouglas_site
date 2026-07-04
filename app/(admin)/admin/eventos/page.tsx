import type { Metadata } from 'next'
import { prisma } from '@/lib/prisma'
import { EventosPanel } from './eventos-panel'

export const metadata: Metadata = { title: 'Eventos' }
export const dynamic = 'force-dynamic'

export default async function AdminEventosPage() {
  const [events, artists] = await Promise.all([
    prisma.artistEvent.findMany({
      orderBy: { startsAt: 'desc' },
      select: {
        id: true,
        slug: true,
        title: true,
        venue: true,
        city: true,
        startsAt: true,
        infoUrl: true,
        published: true,
        artist: { select: { id: true, name: true, slug: true } },
      },
    }),
    prisma.artist.findMany({ where: { active: true }, orderBy: { name: 'asc' }, select: { id: true, name: true } }),
  ])

  const initialEvents = events.map((e) => ({ ...e, startsAt: e.startsAt.toISOString() }))

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-white">Eventos</h1>
        <p className="text-sm text-neutral-500 mt-1 max-w-xl">
          Agenda de apresentações dos artistas — vitrine pública em /eventos e no perfil de cada
          artista. Sem venda de ingresso nem RSVP nesta versão.
        </p>
      </div>

      <EventosPanel initialEvents={initialEvents} artists={artists} />
    </div>
  )
}
