'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface EventItem {
  id: string
  slug: string
  title: string
  venue: string | null
  city: string | null
  startsAt: string
  infoUrl: string | null
  published: boolean
}

export function MeusEventosPanel({ initialEvents }: { initialEvents: EventItem[] }) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [title, setTitle] = useState('')
  const [venue, setVenue] = useState('')
  const [city, setCity] = useState('')
  const [startsAt, setStartsAt] = useState('')
  const [infoUrl, setInfoUrl] = useState('')

  async function refresh() {
    router.refresh()
  }

  async function createEvent() {
    if (!title.trim() || !startsAt) {
      setError('Título e data são obrigatórios')
      return
    }
    setBusy(true)
    setError(null)
    try {
      const res = await fetch('/api/musicas/eventos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          venue: venue.trim() || undefined,
          city: city.trim() || undefined,
          startsAt,
          infoUrl: infoUrl.trim() || undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erro ao criar evento')
      setTitle('')
      setVenue('')
      setCity('')
      setStartsAt('')
      setInfoUrl('')
      await refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar evento')
    } finally {
      setBusy(false)
    }
  }

  async function togglePublished(event: EventItem) {
    setBusy(true)
    setError(null)
    try {
      const res = await fetch(`/api/musicas/eventos/${event.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ published: !event.published }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erro ao atualizar evento')
      await refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao atualizar')
    } finally {
      setBusy(false)
    }
  }

  async function remove(event: EventItem) {
    if (!window.confirm(`Excluir "${event.title}"?`)) return
    setBusy(true)
    setError(null)
    try {
      const res = await fetch(`/api/musicas/eventos/${event.id}`, { method: 'DELETE' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erro ao excluir')
      await refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao excluir')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-6">
      {error && <p className="text-xs text-rose-400">{error}</p>}

      <div className="rounded-xl border border-gate-azure bg-white/5 p-4 space-y-3">
        <p className="text-sm font-medium text-white">Novo evento</p>
        <div className="grid grid-cols-2 gap-2">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Título do evento"
            className="col-span-2 rounded-lg border border-gate-azure bg-gate-bg px-3 py-2 text-sm text-white placeholder:text-gate-blue outline-none focus:border-gate-pink"
          />
          <input
            value={venue}
            onChange={(e) => setVenue(e.target.value)}
            placeholder="Local (opcional)"
            className="rounded-lg border border-gate-azure bg-gate-bg px-3 py-2 text-sm text-white placeholder:text-gate-blue outline-none focus:border-gate-pink"
          />
          <input
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="Cidade (opcional)"
            className="rounded-lg border border-gate-azure bg-gate-bg px-3 py-2 text-sm text-white placeholder:text-gate-blue outline-none focus:border-gate-pink"
          />
          <input
            type="datetime-local"
            value={startsAt}
            onChange={(e) => setStartsAt(e.target.value)}
            className="rounded-lg border border-gate-azure bg-gate-bg px-3 py-2 text-sm text-white outline-none focus:border-gate-pink"
          />
          <input
            value={infoUrl}
            onChange={(e) => setInfoUrl(e.target.value)}
            placeholder="Link de ingressos/infos (http/https)"
            className="rounded-lg border border-gate-azure bg-gate-bg px-3 py-2 text-sm text-white placeholder:text-gate-blue outline-none focus:border-gate-pink"
          />
        </div>
        <button
          disabled={busy}
          onClick={createEvent}
          className="rounded-lg bg-gate-pink px-4 py-2 text-xs font-semibold text-white transition hover:bg-gate-pink/90 disabled:opacity-50"
        >
          Criar evento
        </button>
      </div>

      <div className="rounded-xl border border-gate-azure bg-white/5 divide-y divide-gate-azure">
        {initialEvents.length === 0 && (
          <p className="p-4 text-sm text-gate-blue">Nenhum evento cadastrado ainda.</p>
        )}
        {initialEvents.map((event) => (
          <div key={event.id} className="flex items-center justify-between gap-3 p-4">
            <div className="min-w-0">
              <p className="text-sm font-medium text-white truncate">{event.title}</p>
              <p className="text-xs text-gate-blue">
                {new Date(event.startsAt).toLocaleString('pt-BR')}
                {event.venue && ` · ${event.venue}`}
                {event.city && ` · ${event.city}`}
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className={`text-xs ${event.published ? 'text-emerald-400' : 'text-gate-blue'}`}>
                {event.published ? 'Publicado' : 'Rascunho'}
              </span>
              <button onClick={() => togglePublished(event)} disabled={busy} className="text-xs text-gate-blue hover:text-white">
                {event.published ? 'Despublicar' : 'Publicar'}
              </button>
              <button onClick={() => remove(event)} disabled={busy} className="text-xs text-rose-500 hover:text-rose-400">
                Excluir
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
