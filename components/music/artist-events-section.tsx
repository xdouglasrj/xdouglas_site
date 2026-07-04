'use client'

import { useState } from 'react'
import type { ArtistEventPublic } from '@/lib/events/events'

// ============================================================
// Seção "Próximos eventos" no perfil do artista (V3 Plano 18). Próximos
// sempre visíveis; passados ficam colapsados em "Eventos anteriores"
// (últimos 5), expandidos sob demanda — client component só por causa
// do toggle, sem fetch algum (dados vêm do servidor via props).
// ============================================================

function formatEventDate(iso: string): string {
  return new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function EventRow({ event }: { event: ArtistEventPublic }) {
  return (
    <div className="rounded-xl border border-gate-azure bg-white/5 p-4 flex items-center justify-between gap-3">
      <div className="min-w-0">
        <p className="text-sm font-medium text-white truncate">{event.title}</p>
        <p className="text-xs text-gate-blue">
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
  )
}

export function ArtistEventsSection({
  upcoming,
  past,
}: {
  upcoming: ArtistEventPublic[]
  past: ArtistEventPublic[]
}) {
  const [showPast, setShowPast] = useState(false)

  if (upcoming.length === 0 && past.length === 0) return null

  return (
    <section className="mt-8">
      <h2 className="text-sm font-bold uppercase tracking-widest text-gate-blue mb-3">Próximos eventos</h2>

      {upcoming.length === 0 ? (
        <p className="text-sm text-gate-blue">Nenhum evento futuro agendado.</p>
      ) : (
        <div className="space-y-2">
          {upcoming.map((event) => (
            <EventRow key={event.id} event={event} />
          ))}
        </div>
      )}

      {past.length > 0 && (
        <div className="mt-4">
          <button
            onClick={() => setShowPast((v) => !v)}
            className="text-xs font-semibold text-gate-blue hover:text-white transition"
          >
            {showPast ? 'Ocultar eventos anteriores' : `Ver eventos anteriores (${past.length})`}
          </button>
          {showPast && (
            <div className="mt-2 space-y-2">
              {past.map((event) => (
                <EventRow key={event.id} event={event} />
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  )
}
