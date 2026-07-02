'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { FileUpload } from '@/components/admin/file-upload'
import { GenreSelector } from '@/components/music/genre-selector'

const MAX_TRACKS_PER_BATCH = 5
const MAX_SCHEDULE_DAYS_AHEAD = 15

interface TrackFormValues {
  uid: string
  title: string
  producerName: string
  description: string
  genreId: string
  bpm: string
  key: string
  audioKey: string
  audioFormat: string
  audioSizeBytes: string
  coverKey: string
  coverUrl: string
  scheduleEnabled: boolean
  scheduledDate: string
  scheduledTime: string
}

type BlockStatus = 'idle' | 'sending' | 'done' | 'error'

function emptyTrack(): TrackFormValues {
  return {
    uid: Math.random().toString(36).slice(2),
    title: '', producerName: '', description: '', genreId: '', bpm: '', key: '',
    audioKey: '', audioFormat: 'mp3', audioSizeBytes: '', coverKey: '', coverUrl: '',
    scheduleEnabled: false, scheduledDate: '', scheduledTime: '',
  }
}

const inputClass =
  'w-full rounded-lg border border-gate-azure bg-white/5 px-4 py-3 text-sm text-white placeholder-white/30 outline-none transition focus:border-gate-pink focus:ring-1 focus:ring-gate-pink/40'
const labelClass = 'mb-1.5 block text-xs font-medium uppercase tracking-wider text-gate-blue'

function todayISODate(): string {
  return new Date().toISOString().slice(0, 10)
}

function maxScheduleISODate(): string {
  const d = new Date()
  d.setDate(d.getDate() + MAX_SCHEDULE_DAYS_AHEAD)
  return d.toISOString().slice(0, 10)
}

interface ArtistTrackFormProps {
  maxAudioSizeMb: number
}

export function ArtistTrackForm({ maxAudioSizeMb }: ArtistTrackFormProps) {
  const router = useRouter()
  const [tracks, setTracks] = useState<TrackFormValues[]>([emptyTrack()])
  const [statuses, setStatuses] = useState<Record<string, BlockStatus>>({})
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)

  function updateTrack(uid: string, field: keyof TrackFormValues, value: string | boolean) {
    setTracks((list) => list.map((t) => (t.uid === uid ? { ...t, [field]: value } : t)))
  }

  function addTrack() {
    if (tracks.length >= MAX_TRACKS_PER_BATCH) return
    setTracks((list) => [...list, emptyTrack()])
  }

  function removeTrack(uid: string) {
    setTracks((list) => (list.length > 1 ? list.filter((t) => t.uid !== uid) : list))
  }

  function handleBpmDetected(uid: string, bpm: number) {
    setTracks((list) =>
      list.map((t) => (t.uid === uid && !t.bpm ? { ...t, bpm: String(bpm) } : t))
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    for (const t of tracks) {
      if (!t.title.trim()) {
        setErrors((prev) => ({ ...prev, [t.uid]: 'Título é obrigatório' }))
        return
      }
      if (!t.audioKey) {
        setErrors((prev) => ({ ...prev, [t.uid]: 'Faça upload do arquivo de áudio' }))
        return
      }
      if (t.scheduleEnabled && (!t.scheduledDate || !t.scheduledTime)) {
        setErrors((prev) => ({ ...prev, [t.uid]: 'Informe data e hora do agendamento' }))
        return
      }
    }

    setSubmitting(true)
    setErrors({})

    let allOk = true
    for (const t of tracks) {
      setStatuses((prev) => ({ ...prev, [t.uid]: 'sending' }))

      const scheduledAt = t.scheduleEnabled
        ? new Date(`${t.scheduledDate}T${t.scheduledTime}`).toISOString()
        : undefined

      try {
        const res = await fetch('/api/musicas/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: t.title.trim(),
            producerName: t.producerName || undefined,
            description: t.description || undefined,
            genreId: t.genreId || undefined,
            bpm: t.bpm ? Number(t.bpm) : undefined,
            key: t.key || undefined,
            audioKey: t.audioKey,
            audioFormat: t.audioFormat,
            audioSizeBytes: t.audioSizeBytes ? Number(t.audioSizeBytes) : undefined,
            coverKey: t.coverKey || undefined,
            coverUrl: t.coverUrl || undefined,
            scheduledAt,
          }),
        })

        const data = await res.json()
        if (!res.ok) {
          allOk = false
          setStatuses((prev) => ({ ...prev, [t.uid]: 'error' }))
          setErrors((prev) => ({ ...prev, [t.uid]: data.error ?? 'Erro ao enviar música' }))
          continue
        }

        setStatuses((prev) => ({ ...prev, [t.uid]: 'done' }))
      } catch {
        allOk = false
        setStatuses((prev) => ({ ...prev, [t.uid]: 'error' }))
        setErrors((prev) => ({ ...prev, [t.uid]: 'Erro de conexão. Tente novamente.' }))
      }
    }

    setSubmitting(false)
    if (allOk) {
      setDone(true)
      setTracks([emptyTrack()])
      setStatuses({})
      router.refresh()
    }
  }

  if (done) {
    return (
      <div className="rounded-xl border border-emerald-800/60 bg-emerald-950/30 p-6 text-center">
        <p className="text-sm font-medium text-emerald-400">Música(s) enviada(s) com sucesso!</p>
        <p className="mt-1 text-sm text-gate-blue">
          Faixas sem agendamento ficam como rascunho até a equipe revisar. Faixas agendadas são
          publicadas automaticamente na data/hora escolhida.
        </p>
        <button
          onClick={() => setDone(false)}
          className="mt-4 text-sm font-semibold text-gate-pink hover:opacity-80"
        >
          Enviar outra música
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      {tracks.map((t, index) => (
        <TrackBlock
          key={t.uid}
          index={index}
          track={t}
          status={statuses[t.uid] ?? 'idle'}
          error={errors[t.uid]}
          maxAudioSizeMb={maxAudioSizeMb}
          canRemove={tracks.length > 1}
          onChange={(field, value) => updateTrack(t.uid, field, value)}
          onRemove={() => removeTrack(t.uid)}
          onBpmDetected={(bpm) => handleBpmDetected(t.uid, bpm)}
        />
      ))}

      {tracks.length < MAX_TRACKS_PER_BATCH && (
        <button
          type="button"
          onClick={addTrack}
          className="rounded-lg border border-dashed border-gate-azure py-3 text-sm font-medium text-gate-blue transition hover:border-gate-pink hover:text-gate-pink"
        >
          + Adicionar outra música ({tracks.length}/{MAX_TRACKS_PER_BATCH})
        </button>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="rounded-lg bg-gate-pink py-3.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
      >
        {submitting ? 'Enviando...' : tracks.length > 1 ? `Enviar ${tracks.length} músicas` : 'Enviar para revisão'}
      </button>
    </form>
  )
}

// ============================================================
// Bloco de um único envio — repetido até MAX_TRACKS_PER_BATCH vezes
// ============================================================

interface TrackBlockProps {
  index: number
  track: TrackFormValues
  status: BlockStatus
  error?: string
  maxAudioSizeMb: number
  canRemove: boolean
  onChange: (field: keyof TrackFormValues, value: string | boolean) => void
  onRemove: () => void
  onBpmDetected: (bpm: number) => void
}

function TrackBlock({
  index, track, status, error, maxAudioSizeMb, canRemove, onChange, onRemove, onBpmDetected,
}: TrackBlockProps) {
  return (
    <div className="flex flex-col gap-4 rounded-xl border border-gate-azure bg-white/[0.02] p-5">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-white">Música {index + 1}</h2>
        <div className="flex items-center gap-3">
          {status === 'sending' && <span className="text-xs text-gate-blue">Enviando…</span>}
          {status === 'done' && <span className="text-xs text-emerald-400">Enviada ✓</span>}
          {canRemove && (
            <button
              type="button"
              onClick={onRemove}
              className="text-xs font-medium text-gate-blue transition hover:text-gate-pink"
            >
              Remover
            </button>
          )}
        </div>
      </div>

      {error && (
        <p className="rounded-lg border border-gate-pink/40 bg-gate-pink/10 px-4 py-3 text-sm text-gate-pink">
          {error}
        </p>
      )}

      {/* Informações básicas */}
      <section className="flex flex-col gap-4 rounded-xl border border-gate-azure bg-white/5 p-5">
        <h3 className="text-sm font-medium text-white">Informações básicas</h3>

        <div>
          <label className={labelClass}>Título *</label>
          <input
            value={track.title}
            onChange={(e) => onChange('title', e.target.value)}
            required
            className={inputClass}
            placeholder="Nome da faixa"
          />
        </div>

        <div>
          <label className={labelClass}>Produtor</label>
          <input
            value={track.producerName}
            onChange={(e) => onChange('producerName', e.target.value)}
            className={inputClass}
            placeholder="Nome do produtor (se diferente de você)"
          />
        </div>

        <div>
          <label className={labelClass}>Descrição</label>
          <textarea
            value={track.description}
            onChange={(e) => onChange('description', e.target.value)}
            rows={3}
            placeholder="Conte um pouco sobre a faixa…"
            className={`${inputClass} resize-y`}
          />
        </div>
      </section>

      {/* Metadados técnicos */}
      <section className="flex flex-col gap-4 rounded-xl border border-gate-azure bg-white/5 p-5">
        <h3 className="text-sm font-medium text-white">Metadados técnicos</h3>
        <GenreSelector
          value={track.genreId}
          onChange={(genreId) => onChange('genreId', genreId)}
          labelClassName={labelClass}
        />
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>BPM</label>
            <input
              type="number"
              min="40"
              max="300"
              value={track.bpm}
              onChange={(e) => onChange('bpm', e.target.value)}
              className={inputClass}
              placeholder="Detectado automaticamente"
            />
          </div>
          <div>
            <label className={labelClass}>Tom</label>
            <input value={track.key} onChange={(e) => onChange('key', e.target.value)} className={inputClass} placeholder="Am, C#…" />
          </div>
        </div>
      </section>

      {/* Upload de arquivos */}
      <section className="flex flex-col gap-4 rounded-xl border border-gate-azure bg-white/5 p-5">
        <h3 className="text-sm font-medium text-white">Arquivos</h3>

        <FileUpload
          kind="audio"
          accept="audio/mpeg,audio/wav,audio/x-wav,audio/flac,audio/aiff,.mp3,.wav,.flac,.aiff"
          label="Arquivo de áudio *"
          hint={`MP3, WAV, FLAC ou AIFF · máximo ${maxAudioSizeMb}MB`}
          currentKey={track.audioKey || undefined}
          onUpload={({ storageKey, sizeBytes }) => {
            const ext = storageKey.split('.').pop() ?? 'mp3'
            onChange('audioKey', storageKey)
            onChange('audioFormat', ext)
            onChange('audioSizeBytes', String(sizeBytes))
          }}
          onBpmDetected={onBpmDetected}
        />

        <FileUpload
          kind="cover"
          accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
          label="Capa"
          hint="JPG, PNG ou WebP · recomendado 600×600px"
          currentKey={track.coverKey || undefined}
          currentUrl={track.coverUrl || undefined}
          onUpload={({ storageKey, publicUrl }) => {
            onChange('coverKey', storageKey)
            if (publicUrl) onChange('coverUrl', publicUrl)
          }}
        />
      </section>

      {/* Agendamento de lançamento */}
      <section className="flex flex-col gap-4 rounded-xl border border-gate-azure bg-white/5 p-5">
        <label className="flex items-center gap-2 text-sm font-medium text-white">
          <input
            type="checkbox"
            checked={track.scheduleEnabled}
            onChange={(e) => onChange('scheduleEnabled', e.target.checked)}
            className="h-4 w-4 rounded border-gate-azure bg-white/5 accent-gate-pink"
          />
          Agendar lançamento
        </label>

        {track.scheduleEnabled && (
          <>
            <p className="text-xs text-gate-blue">
              A música é publicada automaticamente na data e hora escolhidas, sem precisar de
              aprovação manual. Janela máxima: {MAX_SCHEDULE_DAYS_AHEAD} dias a partir de hoje.
            </p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Data</label>
                <input
                  type="date"
                  value={track.scheduledDate}
                  min={todayISODate()}
                  max={maxScheduleISODate()}
                  onChange={(e) => onChange('scheduledDate', e.target.value)}
                  className={inputClass}
                  required={track.scheduleEnabled}
                />
              </div>
              <div>
                <label className={labelClass}>Hora</label>
                <input
                  type="time"
                  value={track.scheduledTime}
                  onChange={(e) => onChange('scheduledTime', e.target.value)}
                  className={inputClass}
                  required={track.scheduleEnabled}
                />
              </div>
            </div>
          </>
        )}
      </section>
    </div>
  )
}
