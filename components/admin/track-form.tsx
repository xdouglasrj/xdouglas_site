'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Alert } from '@/components/ui/alert'
import { FileUpload } from './file-upload'
import { TRACK_GENRES } from '@/lib/tracks/genres'

// ============================================================
// Tipos
// ============================================================

interface Artist { id: string; name: string }

interface TrackFormValues {
  title: string
  artistId: string
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
  published: boolean
}

interface TrackFormProps {
  mode: 'create' | 'edit'
  trackId?: string
  initialValues?: Partial<TrackFormValues>
}

const EMPTY: TrackFormValues = {
  title: '', artistId: '', producerName: '',
  description: '', genre: '', bpm: '', key: '',
  audioKey: '', audioFormat: 'mp3', audioSizeBytes: '',
  coverKey: '', coverUrl: '', published: false,
}

// ============================================================
// Componente
// ============================================================

export function TrackForm({ mode, trackId, initialValues }: TrackFormProps) {
  const router = useRouter()
  const [values, setValues] = useState<TrackFormValues>({ ...EMPTY, ...initialValues })
  const [artists, setArtists] = useState<Artist[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [musicMaxSizeMb, setMusicMaxSizeMb] = useState(10)

  // Carrega artistas para o select
  useEffect(() => {
    fetch('/api/admin/artistas')
      .then((r) => r.json())
      .then((d) => setArtists(d.artists ?? []))
      .catch(() => {})
  }, [])

  // Carrega o limite de tamanho de upload configurado em Configurações
  useEffect(() => {
    fetch('/api/admin/settings/upload-limits')
      .then((r) => r.json())
      .then((d) => { if (d.musicMaxSizeMb) setMusicMaxSizeMb(d.musicMaxSizeMb) })
      .catch(() => {})
  }, [])

  function set(field: keyof TrackFormValues, value: string | boolean) {
    setValues((v) => ({ ...v, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!values.title.trim()) { setError('Título é obrigatório'); return }
    if (!values.artistId) { setError('Selecione um artista'); return }
    if (mode === 'create' && !values.audioKey) { setError('Faça upload do arquivo de áudio'); return }

    setLoading(true)

    const body = {
      title: values.title.trim(),
      artistId: values.artistId,
      producerName: values.producerName || undefined,
      description: values.description || undefined,
      genre: values.genre || undefined,
      bpm: values.bpm ? Number(values.bpm) : undefined,
      key: values.key || undefined,
      ...(mode === 'create' && {
        audioKey: values.audioKey,
        audioFormat: values.audioFormat,
        audioSizeBytes: values.audioSizeBytes ? Number(values.audioSizeBytes) : undefined,
      }),
      coverKey: values.coverKey || undefined,
      coverUrl: values.coverUrl || undefined,
      published: values.published,
    }

    try {
      const url = mode === 'create'
        ? '/api/admin/musicas'
        : `/api/admin/musicas/${trackId}`

      const res = await fetch(url, {
        method: mode === 'create' ? 'POST' : 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mode === 'edit' ? { action: 'update', data: body } : body),
      })

      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Erro ao salvar'); return }

      router.push('/admin/musicas')
      router.refresh()
    } catch {
      setError('Erro de conexão. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6 max-w-2xl">
      {error && <Alert variant="error" message={error} />}

      {/* Informações básicas */}
      <section className="flex flex-col gap-4 rounded-xl border border-neutral-800 bg-neutral-900 p-5">
        <h2 className="text-sm font-medium text-neutral-300">Informações básicas</h2>

        <Input label="Título *" value={values.title} onChange={(e) => set('title', e.target.value)} placeholder="Nome da faixa" required />

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-neutral-300">Artista *</label>
          <select
            value={values.artistId}
            onChange={(e) => set('artistId', e.target.value)}
            className="h-10 w-full rounded-md px-3 text-sm bg-neutral-900 text-white border border-neutral-700 focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-500/20"
            required
          >
            <option value="" className="text-black">Selecionar artista…</option>
            {artists.map((a) => (
              <option key={a.id} value={a.id} className="text-black">{a.name}</option>
            ))}
          </select>
        </div>

        <Input label="Produtor" value={values.producerName} onChange={(e) => set('producerName', e.target.value)} placeholder="Nome do produtor (se diferente do artista)" />

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-neutral-300">Descrição</label>
          <textarea
            value={values.description}
            onChange={(e) => set('description', e.target.value)}
            rows={3}
            placeholder="Descrição da faixa…"
            className="w-full rounded-md px-3 py-2 text-sm bg-neutral-900 text-white border border-neutral-700 focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-500/20 resize-y placeholder:text-neutral-500"
          />
        </div>
      </section>

      {/* Metadados técnicos */}
      <section className="flex flex-col gap-4 rounded-xl border border-neutral-800 bg-neutral-900 p-5">
        <h2 className="text-sm font-medium text-neutral-300">Metadados técnicos</h2>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="genre" className="text-sm font-medium text-neutral-300">Gênero</label>
            <select
              id="genre"
              value={values.genre}
              onChange={(e) => set('genre', e.target.value)}
              className="h-10 w-full rounded-md px-3 text-sm bg-neutral-900 text-white border border-neutral-700 focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-500/20"
            >
              <option value="" className="text-black">Selecione…</option>
              {TRACK_GENRES.map((g) => (
                <option key={g} value={g} className="text-black">{g}</option>
              ))}
            </select>
          </div>
          <Input label="BPM" type="number" min="40" max="300" value={values.bpm} onChange={(e) => set('bpm', e.target.value)} placeholder="138" />
          <Input label="Tom" value={values.key} onChange={(e) => set('key', e.target.value)} placeholder="Am, C#…" />
        </div>
      </section>

      {/* Upload de arquivos */}
      <section className="flex flex-col gap-4 rounded-xl border border-neutral-800 bg-neutral-900 p-5">
        <h2 className="text-sm font-medium text-neutral-300">
          Arquivos {mode === 'edit' && <span className="text-neutral-600 font-normal">(deixe em branco para manter os atuais)</span>}
        </h2>

        {mode === 'create' && (
          <FileUpload
            kind="audio"
            accept="audio/mpeg,audio/wav,audio/x-wav,audio/flac,audio/aiff,.mp3,.wav,.flac,.aiff"
            label="Arquivo de áudio *"
            hint={`MP3, WAV, FLAC ou AIFF · máximo ${musicMaxSizeMb}MB`}
            currentKey={values.audioKey || undefined}
            onUpload={({ storageKey, sizeBytes }) => {
              const ext = storageKey.split('.').pop() ?? 'mp3'
              set('audioKey', storageKey)
              set('audioFormat', ext)
              set('audioSizeBytes', String(sizeBytes))
            }}
            onError={setError}
          />
        )}

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

      {/* Publicação */}
      <section className="flex items-center justify-between rounded-xl border border-neutral-800 bg-neutral-900 p-5">
        <div>
          <p className="text-sm font-medium text-neutral-300">Publicar imediatamente</p>
          <p className="text-xs text-neutral-600 mt-0.5">
            {values.published
              ? 'A faixa ficará visível no catálogo público'
              : 'A faixa ficará como rascunho'}
          </p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={values.published}
          onClick={() => set('published', !values.published)}
          className={[
            'relative w-10 h-6 rounded-full transition-colors',
            values.published ? 'bg-rose-600' : 'bg-neutral-700',
          ].join(' ')}
        >
          <span
            className={[
              'absolute top-1 w-4 h-4 rounded-full bg-white transition-transform',
              values.published ? 'translate-x-5' : 'translate-x-1',
            ].join(' ')}
          />
          <span className="sr-only">{values.published ? 'Publicar' : 'Manter como rascunho'}</span>
        </button>
      </section>

      {/* Ações */}
      <div className="flex items-center gap-3">
        <Button type="submit" loading={loading}>
          {mode === 'create' ? 'Criar música' : 'Salvar alterações'}
        </Button>
        <Button
          type="button"
          variant="ghost"
          onClick={() => router.push('/admin/musicas')}
          disabled={loading}
        >
          Cancelar
        </Button>
      </div>
    </form>
  )
}
