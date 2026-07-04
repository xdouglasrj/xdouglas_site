'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { FileUpload } from '@/components/admin/file-upload'

interface ContestItem {
  id: string
  slug: string
  title: string
  prizePoints: number
  deadline: string
  published: boolean
  entryCount: number
  hostArtist: { id: string; name: string; slug: string } | null
}

interface ArtistOption {
  id: string
  name: string
}

export function ContestsPanel({
  initialContests,
  artists,
}: {
  initialContests: ContestItem[]
  artists: ArtistOption[]
}) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [hostArtistId, setHostArtistId] = useState('')
  const [prizePoints, setPrizePoints] = useState('')
  const [prizeText, setPrizeText] = useState('')
  const [deadline, setDeadline] = useState('')
  const [coverKey, setCoverKey] = useState('')
  const [stemsKey, setStemsKey] = useState('')

  async function refresh() {
    router.refresh()
  }

  async function createContest() {
    if (!title.trim() || !description.trim() || !deadline) {
      setError('Título, descrição e deadline são obrigatórios')
      return
    }
    setBusy(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/contests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          hostArtistId: hostArtistId || undefined,
          prizePoints: prizePoints ? Number(prizePoints) : 0,
          prizeText: prizeText.trim() || undefined,
          deadline,
          coverKey: coverKey || undefined,
          stemsKey: stemsKey || undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erro ao criar concurso')
      setTitle('')
      setDescription('')
      setHostArtistId('')
      setPrizePoints('')
      setPrizeText('')
      setDeadline('')
      setCoverKey('')
      setStemsKey('')
      await refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar concurso')
    } finally {
      setBusy(false)
    }
  }

  async function togglePublished(contest: ContestItem) {
    setBusy(true)
    setError(null)
    try {
      const res = await fetch(`/api/admin/contests/${contest.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ published: !contest.published }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erro ao atualizar concurso')
      await refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao atualizar')
    } finally {
      setBusy(false)
    }
  }

  async function remove(contest: ContestItem) {
    if (!window.confirm(`Excluir "${contest.title}"? Isso remove todas as submissões vinculadas.`)) return
    setBusy(true)
    setError(null)
    try {
      const res = await fetch(`/api/admin/contests/${contest.id}`, { method: 'DELETE' })
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
    <div className="space-y-4">
      {error && <p className="text-xs text-rose-400">{error}</p>}

      <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-4 space-y-3">
        <p className="text-sm font-medium text-neutral-200">Novo concurso</p>

        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Título do concurso"
          className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-sm text-neutral-200 placeholder:text-neutral-600 outline-none focus:border-neutral-600"
        />

        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
          placeholder="Regras do concurso (ex.: usar ao menos 3 samples, 60-90s, BPM 140, tom F)"
          className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-sm text-neutral-200 placeholder:text-neutral-600 outline-none focus:border-neutral-600 resize-y"
        />

        <div className="grid grid-cols-2 gap-2">
          <select
            value={hostArtistId}
            onChange={(e) => setHostArtistId(e.target.value)}
            className="rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-sm text-neutral-200 outline-none focus:border-neutral-600"
          >
            <option value="">Sem artista host</option>
            {artists.map((a) => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
          </select>
          <input
            type="datetime-local"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
            className="rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-sm text-neutral-200 outline-none focus:border-neutral-600"
          />
          <input
            type="number"
            min="0"
            value={prizePoints}
            onChange={(e) => setPrizePoints(e.target.value)}
            placeholder="Prêmio em pontos"
            className="rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-sm text-neutral-200 placeholder:text-neutral-600 outline-none focus:border-neutral-600"
          />
          <input
            value={prizeText}
            onChange={(e) => setPrizeText(e.target.value)}
            placeholder="Prêmios extras (texto livre)"
            className="rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-sm text-neutral-200 placeholder:text-neutral-600 outline-none focus:border-neutral-600"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <FileUpload
            kind="cover"
            accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
            label="Capa"
            hint="JPG, PNG ou WebP"
            currentKey={coverKey || undefined}
            uploadUrlEndpoint="/api/admin/contests/upload-url"
            onUpload={({ storageKey }) => setCoverKey(storageKey)}
          />
          <FileUpload
            kind="stems"
            accept="application/zip,.zip"
            label="Stems (.zip)"
            hint="Pacote de stems para download — opcional"
            currentKey={stemsKey || undefined}
            uploadUrlEndpoint="/api/admin/contests/upload-url"
            onUpload={({ storageKey }) => setStemsKey(storageKey)}
          />
        </div>

        <button
          disabled={busy}
          onClick={createContest}
          className="rounded-lg bg-gate-pink px-4 py-2 text-xs font-semibold text-white transition hover:bg-gate-pink/90 disabled:opacity-50"
        >
          Criar concurso
        </button>
      </div>

      <div className="rounded-xl border border-neutral-800 bg-neutral-900 divide-y divide-neutral-800">
        {initialContests.length === 0 && (
          <p className="p-4 text-sm text-neutral-500">Nenhum concurso cadastrado ainda.</p>
        )}
        {initialContests.map((contest) => (
          <div key={contest.id} className="flex items-center justify-between gap-3 p-4">
            <div className="min-w-0">
              <Link
                href={`/admin/contests/${contest.id}`}
                className="text-sm font-medium text-neutral-200 hover:text-gate-pink truncate"
              >
                {contest.title}
              </Link>
              <p className="text-xs text-neutral-500">
                {contest.hostArtist ? `${contest.hostArtist.name} · ` : ''}
                Deadline {new Date(contest.deadline).toLocaleString('pt-BR')}
                {' · '}
                {contest.prizePoints} pts
                {' · '}
                {contest.entryCount} submissões
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className={`text-xs ${contest.published ? 'text-emerald-400' : 'text-neutral-500'}`}>
                {contest.published ? 'Publicado' : 'Rascunho'}
              </span>
              <button
                onClick={() => togglePublished(contest)}
                disabled={busy}
                className="text-xs text-neutral-400 hover:text-neutral-200"
              >
                {contest.published ? 'Despublicar' : 'Publicar'}
              </button>
              <Link href={`/admin/contests/${contest.id}`} className="text-xs text-neutral-400 hover:text-neutral-200">
                Gerenciar
              </Link>
              <button onClick={() => remove(contest)} disabled={busy} className="text-xs text-rose-500 hover:text-rose-400">
                Excluir
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
