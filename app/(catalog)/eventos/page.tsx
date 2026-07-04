import type { Metadata } from 'next'
import Link from 'next/link'
import { listUpcomingEvents, listArtistsWithUpcomingEvents } from '@/lib/events/events'

export const revalidate = 60

export const metadata: Metadata = {
  title: 'Agenda de eventos',
  description: 'Confira onde os artistas do xDouglas vão se apresentar — shows, festas e lives.',
  robots: { index: true, follow: true },
}

interface PageProps {
  searchParams: Promise<{ artista?: string }>
}

function formatEventDate(iso: string): string {
  return new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default async function EventosPage({ searchParams }: PageProps) {
  const { artista } = await searchParams

  const [events, artists] = await Promise.all([
    listUpcomingEvents({ artistSlug: artista }),
    listArtistsWithUpcomingEvents(),
  ])

  const jsonLd = events.map((event) => ({
    '@context': 'https://schema.org',
    '@type': 'MusicEvent',
    name: event.title,
    startDate: event.startsAt,
    location: {
      '@type': 'Place',
      name: event.venue ?? event.city ?? 'A confirmar',
      // schema.org exige PostalAddress (objeto), não string — necessário para
      // o Rich Results Test do Google validar o MusicEvent (critério de aceite).
      address: event.city
        ? { '@type': 'PostalAddress', addressLocality: event.city }
        : undefined,
    },
    performer: { '@type': 'MusicGroup', name: event.artist.name },
    url: event.infoUrl ?? undefined,
  }))

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-8 py-8 sm:py-12">
      {jsonLd.map((ld, i) => (
        <script
          key={i}
          type="application/ld+json"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }}
        />
      ))}

      <h1 className="text-2xl font-bold text-white">Agenda de eventos</h1>
      <p className="mt-2 text-sm text-gate-blue">
        Onde os artistas do xDouglas vão se apresentar. Sem venda de ingresso por aqui — cada
        evento tem um link externo com mais informações.
      </p>

      {artists.length > 0 && (
        <div className="mt-5 flex flex-wrap gap-2">
          <Link
            href="/eventos"
            className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
              !artista ? 'border-gate-pink text-gate-pink' : 'border-gate-azure text-gate-blue hover:text-white'
            }`}
          >
            Todos
          </Link>
          {artists.map((a) => (
            <Link
              key={a.slug}
              href={`/eventos?artista=${a.slug}`}
              className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                artista === a.slug ? 'border-gate-pink text-gate-pink' : 'border-gate-azure text-gate-blue hover:text-white'
              }`}
            >
              {a.name}
            </Link>
          ))}
        </div>
      )}

      <div className="mt-6 space-y-3">
        {events.length === 0 && (
          <p className="text-sm text-gate-blue">Nenhum evento futuro agendado no momento.</p>
        )}
        {events.map((event) => (
          <div key={event.id} className="rounded-xl border border-gate-azure bg-white/5 p-4 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-medium text-white truncate">{event.title}</p>
              <p className="text-xs text-gate-blue">
                <Link href={`/artista/${event.artist.slug}`} className="hover:text-white transition-colors">
                  {event.artist.name}
                </Link>
                {' · '}
                {formatEventDate(event.startsAt)}
                {event.venue && ` · ${event.venue}`}
                {event.city && ` · ${event.city}`}
              </p>
            </div>
            {event.infoUrl && (
              <a
                href={event.infoUrl}
                target="_blank"
                rel="noopener nofollow"
                className="shrink-0 rounded-lg border border-gate-azure px-3 py-1.5 text-xs font-medium text-gate-pink transition hover:border-gate-pink"
              >
                Ingressos/infos
              </a>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
