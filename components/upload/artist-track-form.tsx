'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { FileUpload } from '@/components/admin/file-upload'
import { GenreSelector } from '@/components/music/genre-selector'
import { TracklistField } from '@/components/music/tracklist-field'
import { TRACK_MOODS, MUSICAL_KEYS, MAX_TAGS, normalizeTag } from '@/lib/tracks/moods'
import { TRACK_KINDS, TRACK_KIND_LABELS, DEFAULT_TRACK_KIND } from '@/lib/tracks/track-kinds'

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
  mood: string
  tags: string[]
  durationSeconds: string
  kind: string
  tracklistText: string
  /** V3 Plano 12 — 'free' (qualquer conta) | 'follow' (exige seguir o artista) */
  downloadMode: string
  /** V3 Plano 14 — série: '' nenhuma, '__new__' criar nova, ou id existente */
  seriesId: string
  newSeriesTitle: string
  episodeNumber: string
  audioKey: string
  audioFormat: string
  audioSizeBytes: string
  coverKey: string
  coverUrl: string
  scheduleEnabled: boolean
  scheduledDate: string
  scheduledTime: string
}

/** Opção de série do artista (V3 Plano 14) — vem de GET /api/musicas/series */
interface SeriesOption {
  id: string
  title: string
  nextEpisodeNumber: number
}

type BlockStatus = 'idle' | 'sending' | 'done' | 'error'

function emptyTrack(): TrackFormValues {
  return {
    uid: Math.random().toString(36).slice(2),
    title: '', producerName: '', description: '', genreId: '', bpm: '', key: '',
    mood: '', tags: [], durationSeconds: '', kind: DEFAULT_TRACK_KIND, tracklistText: '',
    downloadMode: 'free',
    seriesId: '', newSeriesTitle: '', episodeNumber: '',
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
  /** V3 Plano 6 — quando vindo de "Participar" num concurso, vincula o
   * envio ao contest. Só permite 1 música por envio nesse caso (o batch
   * de várias músicas continua liberado fora do fluxo de concurso). */
  contestId?: string
  contestTitle?: string
}

export function ArtistTrackForm({ maxAudioSizeMb, contestId, contestTitle }: ArtistTrackFormProps) {
  const router = useRouter()
  const [tracks, setTracks] = useState<TrackFormValues[]>([emptyTrack()])
  const [statuses, setStatuses] = useState<Record<string, BlockStatus>>({})
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)
  // V3 Plano 14 — séries do próprio artista (para o select "Série")
  const [seriesOptions, setSeriesOptions] = useState<SeriesOption[]>([])

  useEffect(() => {
    fetch('/api/musicas/series')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (Array.isArray(d?.series)) setSeriesOptions(d.series) })
      .catch(() => {})
  }, [])

  function updateTrack(uid: string, field: keyof TrackFormValues, value: string | boolean | string[]) {
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
            mood: t.mood || undefined,
            tags: t.tags.length > 0 ? t.tags : undefined,
            durationSeconds: t.durationSeconds ? Number(t.durationSeconds) : undefined,
            kind: t.kind || DEFAULT_TRACK_KIND,
            tracklistText: t.tracklistText.trim() || undefined,
            // V3 Plano 12 — modo de download (free | follow)
            downloadMode: t.downloadMode === 'follow' ? 'follow' : 'free',
            // V3 Plano 14 — série: criar nova, usar existente, ou nenhuma
            newSeriesTitle:
              t.seriesId === '__new__' && t.newSeriesTitle.trim()
                ? t.newSeriesTitle.trim()
                : undefined,
            seriesId:
              t.seriesId && t.seriesId !== '__new__' ? t.seriesId : undefined,
            episodeNumber:
              t.seriesId && t.episodeNumber ? Number(t.episodeNumber) : undefined,
            audioKey: t.audioKey,
            audioFormat: t.audioFormat,
            audioSizeBytes: t.audioSizeBytes ? Number(t.audioSizeBytes) : undefined,
            coverKey: t.coverKey || undefined,
            coverUrl: t.coverUrl || undefined,
            scheduledAt,
            // V3 Plano 6 — vincula ao concurso quando o envio veio do botão
            // "Participar" da página do contest
            contestId: contestId || undefined,
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
        <p className="text-sm font-medium text-emerald-400">
          {contestId ? 'Música enviada para o concurso!' : 'Música(s) enviada(s) com sucesso!'}
        </p>
        <p className="mt-1 text-sm text-gate-blue">
          {contestId
            ? 'Sua participação já aparece na aba Submissões do concurso, mesmo enquanto a faixa aguarda revisão.'
            : 'Faixas sem agendamento ficam como rascunho até a equipe revisar. Faixas agendadas são publicadas automaticamente na data/hora escolhida.'}
        </p>
        {!contestId && (
          <button
            onClick={() => setDone(false)}
            className="mt-4 text-sm font-semibold text-gate-pink hover:opacity-80"
          >
            Enviar outra música
          </button>
        )}
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      {contestId && (
        <div className="rounded-xl border border-gate-pink/40 bg-gate-pink/10 px-4 py-3 text-sm text-white">
          🏆 Este envio vai participar do concurso{contestTitle ? ` "${contestTitle}"` : ''}. Você
          pode enviar apenas <strong>uma</strong> faixa por concurso.
        </div>
      )}

      {tracks.map((t, index) => (
        <TrackBlock
          key={t.uid}
          index={index}
          track={t}
          status={statuses[t.uid] ?? 'idle'}
          error={errors[t.uid]}
          maxAudioSizeMb={maxAudioSizeMb}
          canRemove={tracks.length > 1}
          seriesOptions={seriesOptions}
          onChange={(field, value) => updateTrack(t.uid, field, value)}
          onRemove={() => removeTrack(t.uid)}
          onBpmDetected={(bpm) => handleBpmDetected(t.uid, bpm)}
        />
      ))}

      {!contestId && tracks.length < MAX_TRACKS_PER_BATCH && (
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
  seriesOptions: SeriesOption[]
  onChange: (field: keyof TrackFormValues, value: string | boolean | string[]) => void
  onRemove: () => void
  onBpmDetected: (bpm: number) => void
}

function TrackBlock({
  index, track, status, error, maxAudioSizeMb, canRemove, seriesOptions, onChange, onRemove, onBpmDetected,
}: TrackBlockProps) {
  // V3 Plano 14 — ao escolher uma série, sugere o próximo nº de episódio
  // (maior + 1) se o campo ainda estiver vazio; "criar nova" sugere 1.
  function handleSeriesChange(value: string) {
    onChange('seriesId', value)
    if (!track.episodeNumber) {
      if (value === '__new__') {
        onChange('episodeNumber', '1')
      } else if (value) {
        const opt = seriesOptions.find((s) => s.id === value)
        if (opt) onChange('episodeNumber', String(opt.nextEpisodeNumber))
      }
    }
  }
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
        <div>
          <label className={labelClass}>Tipo</label>
          <select
            value={track.kind}
            onChange={(e) => onChange('kind', e.target.value)}
            className={inputClass}
          >
            {TRACK_KINDS.map((k) => (
              <option key={k} value={k} className="text-black">{TRACK_KIND_LABELS[k]}</option>
            ))}
          </select>
          <p className="mt-1 text-xs text-white/30">Sets aparecem nos filtros de mix</p>
        </div>

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
            <select
              value={track.key}
              onChange={(e) => onChange('key', e.target.value)}
              className={inputClass}
            >
              <option value="" className="text-black">Selecione…</option>
              {MUSICAL_KEYS.map((k) => (
                <option key={k} value={k} className="text-black">{k}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass}>Mood</label>
            <select
              value={track.mood}
              onChange={(e) => onChange('mood', e.target.value)}
              className={inputClass}
            >
              <option value="" className="text-black">Selecione…</option>
              {TRACK_MOODS.map((m) => (
                <option key={m} value={m} className="text-black">{m}</option>
              ))}
            </select>
          </div>
        </div>

        <ArtistTagsInput tags={track.tags} onChange={(tags) => onChange('tags', tags)} />

        <TracklistField
          value={track.tracklistText}
          onChange={(v) => onChange('tracklistText', v)}
          labelClassName={labelClass}
          textareaClassName={inputClass}
        />

        {/* V3 Plano 14 — série (episódio de um set recorrente) */}
        <div>
          <label className={labelClass}>
            Série <span className="normal-case text-white/30">(opcional · ex.: &ldquo;Sunday Soul Sessions&rdquo;)</span>
          </label>
          <select
            value={track.seriesId}
            onChange={(e) => handleSeriesChange(e.target.value)}
            className={inputClass}
          >
            <option value="" className="text-black">Nenhuma</option>
            {seriesOptions.map((s) => (
              <option key={s.id} value={s.id} className="text-black">{s.title}</option>
            ))}
            <option value="__new__" className="text-black">➕ Criar nova série…</option>
          </select>

          {track.seriesId === '__new__' && (
            <input
              value={track.newSeriesTitle}
              onChange={(e) => onChange('newSeriesTitle', e.target.value)}
              placeholder="Nome da nova série"
              className={`${inputClass} mt-2`}
            />
          )}

          {track.seriesId && (
            <div className="mt-2">
              <label className={labelClass}>Nº do episódio</label>
              <input
                type="number"
                min="1"
                value={track.episodeNumber}
                onChange={(e) => onChange('episodeNumber', e.target.value)}
                placeholder="Ex.: 19"
                className={inputClass}
              />
            </div>
          )}
        </div>
      </section>

      {/* Download (V3 Plano 12) — livre ou exige seguir o artista */}
      <section className="flex flex-col gap-3 rounded-xl border border-gate-azure bg-white/5 p-5">
        <h3 className="text-sm font-medium text-white">Download</h3>
        <div className="flex flex-col gap-2">
          <label className="flex items-start gap-2.5 cursor-pointer">
            <input
              type="radio"
              name={`downloadMode-${track.uid}`}
              value="free"
              checked={track.downloadMode !== 'follow'}
              onChange={() => onChange('downloadMode', 'free')}
              className="mt-0.5 h-4 w-4 accent-gate-pink"
            />
            <span className="text-sm text-white/80">
              Livre para quem tem conta
              <span className="block text-xs text-white/40">Qualquer usuário logado baixa sua faixa.</span>
            </span>
          </label>
          <label className="flex items-start gap-2.5 cursor-pointer">
            <input
              type="radio"
              name={`downloadMode-${track.uid}`}
              value="follow"
              checked={track.downloadMode === 'follow'}
              onChange={() => onChange('downloadMode', 'follow')}
              className="mt-0.5 h-4 w-4 accent-gate-pink"
            />
            <span className="text-sm text-white/80">
              Exigir seguir o artista
              <span className="block text-xs text-white/40">Transforme cada download em um seguidor.</span>
            </span>
          </label>
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
          onDurationDetected={(seconds) => onChange('durationSeconds', String(seconds))}
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

// ============================================================
// Tags — input de chips no estilo do formulário do artista
// (máx. 10, lowercase, sem espaços; Enter/vírgula adiciona)
// ============================================================

function ArtistTagsInput({ tags, onChange }: { tags: string[]; onChange: (tags: string[]) => void }) {
  const [draft, setDraft] = useState('')

  function addTag() {
    const tag = normalizeTag(draft)
    setDraft('')
    if (!tag || tags.includes(tag) || tags.length >= MAX_TAGS) return
    onChange([...tags, tag])
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      addTag()
    } else if (e.key === 'Backspace' && !draft && tags.length > 0) {
      onChange(tags.slice(0, -1))
    }
  }

  return (
    <div>
      <label className={labelClass}>
        Tags <span className="normal-case text-white/30">(máx. {MAX_TAGS} · Enter para adicionar)</span>
      </label>
      <div className="flex flex-wrap items-center gap-1.5 rounded-lg border border-gate-azure bg-white/5 px-3 py-2 transition focus-within:border-gate-pink focus-within:ring-1 focus-within:ring-gate-pink/40">
        {tags.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 rounded-full bg-white/10 px-2 py-0.5 text-xs text-white/80"
          >
            #{tag}
            <button
              type="button"
              onClick={() => onChange(tags.filter((t) => t !== tag))}
              className="text-white/40 hover:text-white transition"
              aria-label={`Remover tag ${tag}`}
            >
              ×
            </button>
          </span>
        ))}
        <input
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={addTag}
          disabled={tags.length >= MAX_TAGS}
          placeholder={tags.length === 0 ? 'ex.: remix, verao, ao-vivo' : ''}
          className="min-w-[8rem] flex-1 bg-transparent py-1 text-sm text-white outline-none placeholder-white/30 disabled:opacity-50"
        />
      </div>
    </div>
  )
}
