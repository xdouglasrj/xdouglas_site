'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { FileUpload } from '@/components/admin/file-upload'
import { TRACK_GENRES } from '@/lib/tracks/genres'

interface FormValues {
  title: string
  producerName: string
  description: string
  genre: string
  bpm: string
  key: string
  audioKey: string
  audioFormat: string
  audioSizeBytes: string
  coverKey: string
  coverUrl: string
}

const EMPTY: FormValues = {
  title: '', producerName: '', description: '', genre: '', bpm: '', key: '',
  audioKey: '', audioFormat: 'mp3', audioSizeBytes: '', coverKey: '', coverUrl: '',
}

const inputClass =
  'w-full rounded-lg border border-gate-azure bg-white/5 px-4 py-3 text-sm text-white placeholder-white/30 outline-none transition focus:border-gate-pink focus:ring-1 focus:ring-gate-pink/40'
const labelClass = 'mb-1.5 block text-xs font-medium uppercase tracking-wider text-gate-blue'

export function ArtistTrackForm() {
  const router = useRouter()
  const [values, setValues] = useState<FormValues>(EMPTY)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  function set(field: keyof FormValues, value: string) {
    setValues((v) => ({ ...v, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!values.title.trim()) { setError('Título é obrigatório'); return }
    if (!values.audioKey) { setError('Faça upload do arquivo de áudio'); return }

    setLoading(true)
    try {
      const res = await fetch('/api/musicas/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: values.title.trim(),
          producerName: values.producerName || undefined,
          description: values.description || undefined,
          genre: values.genre || undefined,
          bpm: values.bpm ? Number(values.bpm) : undefined,
          key: values.key || undefined,
          audioKey: values.audioKey,
          audioFormat: values.audioFormat,
          audioSizeBytes: values.audioSizeBytes ? Number(values.audioSizeBytes) : undefined,
          coverKey: values.coverKey || undefined,
          coverUrl: values.coverUrl || undefined,
        }),
      })

      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Erro ao enviar música'); return }

      setDone(true)
      setValues(EMPTY)
      router.refresh()
    } catch {
      setError('Erro de conexão. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  if (done) {
    return (
      <div className="rounded-xl border border-emerald-800/60 bg-emerald-950/30 p-6 text-center">
        <p className="text-sm font-medium text-emerald-400">Música enviada com sucesso!</p>
        <p className="mt-1 text-sm text-gate-blue">
          Ela ficará como rascunho até a equipe revisar e publicar no catálogo.
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
      {error && (
        <p className="rounded-lg border border-gate-pink/40 bg-gate-pink/10 px-4 py-3 text-sm text-gate-pink">
          {error}
        </p>
      )}

      {/* Informações básicas */}
      <section className="flex flex-col gap-4 rounded-xl border border-gate-azure bg-white/5 p-5">
        <h2 className="text-sm font-medium text-white">Informações básicas</h2>

        <div>
          <label className={labelClass}>Título *</label>
          <input value={values.title} onChange={(e) => set('title', e.target.value)} required className={inputClass} placeholder="Nome da faixa" />
        </div>

        <div>
          <label className={labelClass}>Produtor</label>
          <input value={values.producerName} onChange={(e) => set('producerName', e.target.value)} className={inputClass} placeholder="Nome do produtor (se diferente de você)" />
        </div>

        <div>
          <label className={labelClass}>Descrição</label>
          <textarea
            value={values.description}
            onChange={(e) => set('description', e.target.value)}
            rows={3}
            placeholder="Conte um pouco sobre a faixa…"
            className={`${inputClass} resize-y`}
          />
        </div>
      </section>

      {/* Metadados técnicos */}
      <section className="flex flex-col gap-4 rounded-xl border border-gate-azure bg-white/5 p-5">
        <h2 className="text-sm font-medium text-white">Metadados técnicos</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <div>
            <label className={labelClass}>Gênero</label>
            <select value={values.genre} onChange={(e) => set('genre', e.target.value)} className={inputClass}>
              <option value="" className="text-black">Selecione…</option>
              {TRACK_GENRES.map((g) => (
                <option key={g} value={g} className="text-black">{g}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass}>BPM</label>
            <input type="number" min="40" max="300" value={values.bpm} onChange={(e) => set('bpm', e.target.value)} className={inputClass} placeholder="138" />
          </div>
          <div>
            <label className={labelClass}>Tom</label>
            <input value={values.key} onChange={(e) => set('key', e.target.value)} className={inputClass} placeholder="Am, C#…" />
          </div>
        </div>
      </section>

      {/* Upload de arquivos */}
      <section className="flex flex-col gap-4 rounded-xl border border-gate-azure bg-white/5 p-5">
        <h2 className="text-sm font-medium text-white">Arquivos</h2>

        <FileUpload
          kind="audio"
          accept="audio/mpeg,audio/wav,audio/x-wav,audio/flac,audio/aiff,.mp3,.wav,.flac,.aiff"
          label="Arquivo de áudio *"
          hint="MP3, WAV, FLAC ou AIFF · máximo 500MB"
          currentKey={values.audioKey || undefined}
          onUpload={({ storageKey, sizeBytes }) => {
            const ext = storageKey.split('.').pop() ?? 'mp3'
            set('audioKey', storageKey)
            set('audioFormat', ext)
            set('audioSizeBytes', String(sizeBytes))
          }}
          onError={setError}
        />

        <FileUpload
          kind="cover"
          accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
          label="Capa"
          hint="JPG, PNG ou WebP · recomendado 600×600px"
          currentKey={values.coverKey || undefined}
          currentUrl={values.coverUrl || undefined}
          onUpload={({ storageKey, publicUrl }) => {
            set('coverKey', storageKey)
            if (publicUrl) set('coverUrl', publicUrl)
          }}
          onError={setError}
        />
      </section>

      <button
        type="submit"
        disabled={loading}
        className="rounded-lg bg-gate-pink py-3.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
      >
        {loading ? 'Enviando...' : 'Enviar para revisão'}
      </button>
    </form>
  )
}
