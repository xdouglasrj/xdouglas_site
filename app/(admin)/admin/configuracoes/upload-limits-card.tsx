'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface UploadLimitsCardProps {
  initialMusicMaxSizeMb: number
  initialPodcastMaxSizeMb: number
  initialPodcastEnabled: boolean
}

export function UploadLimitsCard({
  initialMusicMaxSizeMb,
  initialPodcastMaxSizeMb,
  initialPodcastEnabled,
}: UploadLimitsCardProps) {
  const router = useRouter()
  const [musicMaxSizeMb, setMusicMaxSizeMb] = useState(initialMusicMaxSizeMb)
  const [podcastMaxSizeMb, setPodcastMaxSizeMb] = useState(initialPodcastMaxSizeMb)
  const [podcastEnabled, setPodcastEnabled] = useState(initialPodcastEnabled)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  async function save(patch: Partial<{
    musicMaxSizeMb: number
    podcastMaxSizeMb: number
    podcastEnabled: boolean
  }>) {
    if (busy) return
    setBusy(true)
    setError(null)
    setSaved(false)
    try {
      const res = await fetch('/api/admin/settings/upload-limits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ musicMaxSizeMb, podcastMaxSizeMb, podcastEnabled, ...patch }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError('Não foi possível salvar.')
        return
      }
      setMusicMaxSizeMb(data.musicMaxSizeMb)
      setPodcastMaxSizeMb(data.podcastMaxSizeMb)
      setPodcastEnabled(data.podcastEnabled)
      setSaved(true)
      router.refresh()
    } catch {
      setError('Erro de conexão.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-5">
      <h2 className="text-sm font-semibold text-white">Limites de upload</h2>
      <p className="mt-1 text-xs text-neutral-500 max-w-md">
        Tamanho máximo de arquivo de áudio aceito por tipo de conteúdo.
      </p>

      {/* Modelo: Música */}
      <div className="mt-5 flex flex-wrap items-end justify-between gap-4 rounded-lg border border-neutral-800 bg-neutral-950 p-4">
        <div>
          <p className="text-sm font-medium text-neutral-200">🎵 Música</p>
          <p className="text-xs text-neutral-500">Faixas enviadas por artistas e pelo admin.</p>
        </div>
        <div>
          <label className="block text-[11px] uppercase tracking-wider text-neutral-500 mb-1">
            Tamanho máximo (MB)
          </label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={1}
              max={2000}
              value={musicMaxSizeMb}
              disabled={busy}
              onChange={(e) => setMusicMaxSizeMb(parseInt(e.target.value, 10) || 0)}
              className="w-24 rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm text-white outline-none transition focus:border-rose-500 disabled:opacity-50"
            />
            <button
              type="button"
              onClick={() => save({ musicMaxSizeMb })}
              disabled={busy || musicMaxSizeMb < 1}
              className="rounded-lg bg-neutral-800 px-3 py-2 text-xs font-semibold text-white transition hover:bg-neutral-700 disabled:opacity-50"
            >
              Salvar
            </button>
          </div>
        </div>
      </div>

      {/* Modelo: Podcast */}
      <div className="mt-4 flex flex-wrap items-end justify-between gap-4 rounded-lg border border-neutral-800 bg-neutral-950 p-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium text-neutral-200">🎙️ Podcast</p>
            <span
              className={[
                'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium border',
                podcastEnabled
                  ? 'bg-emerald-950/60 text-emerald-400 border-emerald-800/60'
                  : 'bg-neutral-800 text-neutral-400 border-neutral-700',
              ].join(' ')}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${podcastEnabled ? 'bg-emerald-400' : 'bg-neutral-500'}`} />
              {podcastEnabled ? 'Liberado' : 'Bloqueado'}
            </span>
          </div>
          <p className="text-xs text-neutral-500 max-w-xs">
            Função ainda não disponível para os artistas. Fica bloqueada até você liberar.
          </p>
        </div>

        <div className="flex items-end gap-3">
          <div>
            <label className="block text-[11px] uppercase tracking-wider text-neutral-500 mb-1">
              Tamanho máximo (MB)
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={1}
                max={2000}
                value={podcastMaxSizeMb}
                disabled={busy}
                onChange={(e) => setPodcastMaxSizeMb(parseInt(e.target.value, 10) || 0)}
                className="w-24 rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm text-white outline-none transition focus:border-rose-500 disabled:opacity-50"
              />
              <button
                type="button"
                onClick={() => save({ podcastMaxSizeMb })}
                disabled={busy || podcastMaxSizeMb < 1}
                className="rounded-lg bg-neutral-800 px-3 py-2 text-xs font-semibold text-white transition hover:bg-neutral-700 disabled:opacity-50"
              >
                Salvar
              </button>
            </div>
          </div>

          {/* Liga/desliga podcast */}
          <button
            type="button"
            onClick={() => save({ podcastEnabled: !podcastEnabled })}
            disabled={busy}
            role="switch"
            aria-checked={podcastEnabled}
            aria-label="Liberar/bloquear upload de podcast"
            className={[
              'relative h-7 w-12 shrink-0 rounded-full transition-colors disabled:opacity-50',
              podcastEnabled ? 'bg-emerald-600' : 'bg-neutral-700',
            ].join(' ')}
          >
            <span
              className={[
                'absolute top-1 h-5 w-5 rounded-full bg-white transition-transform',
                podcastEnabled ? 'translate-x-6' : 'translate-x-1',
              ].join(' ')}
            />
          </button>
        </div>
      </div>

      {error && <p className="mt-3 text-xs text-rose-400">{error}</p>}
      {saved && !error && <p className="mt-3 text-xs text-emerald-400">Salvo.</p>}
    </div>
  )
}
