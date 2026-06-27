'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { FileUpload } from '@/components/admin/file-upload'

type Target = 'player' | 'download'

interface VinhetaCardProps {
  initialVinhetaKey: string | null
  initialVinhetaDownloadKey: string | null
}

export function VinhetaCard({ initialVinhetaKey, initialVinhetaDownloadKey }: VinhetaCardProps) {
  return (
    <div className="mt-6 rounded-xl border border-neutral-800 bg-neutral-900 p-5">
      <h2 className="text-sm font-semibold text-white">Vinheta</h2>
      <p className="mt-1 text-xs text-neutral-500 max-w-md">
        Duas vinhetas independentes — uma pra quem ouve no site, outra pra
        quem baixa o arquivo. Pode usar o mesmo áudio nas duas ou um
        diferente em cada.
      </p>

      <VinhetaSlot
        target="player"
        title="Vinheta do player"
        description="Tocada automaticamente assim que cada faixa termina de tocar no site —
          o arquivo original da música não é alterado, a vinheta é um segundo
          arquivo enfileirado em tempo real pelo player."
        initialKey={initialVinhetaKey}
      />

      <div className="mt-5 border-t border-neutral-800 pt-5">
        <VinhetaSlot
          target="download"
          title="Vinheta do download"
          description="Colada de verdade no final do arquivo MP3 que a pessoa baixa — depois
            de baixado não existe mais player pra enfileirar nada, então essa
            precisa estar dentro do próprio arquivo. Gerada automaticamente
            (pode levar alguns segundos no primeiro download de cada faixa
            depois que essa vinheta for definida ou trocada)."
          initialKey={initialVinhetaDownloadKey}
        />
      </div>
    </div>
  )
}

// ── Um slot de upload/remoção de vinheta (player ou download) ──

function VinhetaSlot({
  target,
  title,
  description,
  initialKey,
}: {
  target: Target
  title: string
  description: string
  initialKey: string | null
}) {
  const router = useRouter()
  const [vinhetaKey, setVinhetaKey] = useState(initialKey)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  async function save(storageKey: string | null) {
    setBusy(true)
    setError(null)
    setSaved(false)
    try {
      const res = await fetch('/api/admin/settings/vinheta', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ storageKey, target }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError('Não foi possível salvar.')
        return
      }
      setVinhetaKey(target === 'download' ? data.vinhetaDownloadKey : data.vinhetaKey)
      setSaved(true)
      router.refresh()
    } catch {
      setError('Erro de conexão.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div>
      <div className="flex items-center gap-2">
        <h3 className="text-sm font-medium text-white">{title}</h3>
        <span
          className={[
            'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium border',
            vinhetaKey
              ? 'bg-emerald-950/60 text-emerald-400 border-emerald-800/60'
              : 'bg-neutral-800 text-neutral-400 border-neutral-700',
          ].join(' ')}
        >
          <span className={`h-1.5 w-1.5 rounded-full ${vinhetaKey ? 'bg-emerald-400' : 'bg-neutral-500'}`} />
          {vinhetaKey ? 'Ativa' : 'Sem vinheta'}
        </span>
      </div>
      <p className="mt-1 text-xs text-neutral-500 max-w-md">{description}</p>

      <div className="mt-3">
        <FileUpload
          kind="audio"
          accept="audio/mpeg,audio/wav,audio/x-wav,audio/flac,audio/aiff"
          label="Arquivo da vinheta"
          hint="MP3, WAV, FLAC ou AIFF"
          currentKey={vinhetaKey ?? undefined}
          disabled={busy}
          onUpload={({ storageKey }) => save(storageKey)}
          onError={(message) => setError(message)}
        />
      </div>

      {vinhetaKey && (
        <button
          type="button"
          onClick={() => save(null)}
          disabled={busy}
          className="mt-3 text-xs text-rose-500 hover:text-rose-400 underline disabled:opacity-50"
        >
          Remover vinheta
        </button>
      )}

      {error && <p className="mt-3 text-xs text-rose-400">{error}</p>}
      {saved && !error && <p className="mt-3 text-xs text-emerald-400">Salvo.</p>}
    </div>
  )
}
