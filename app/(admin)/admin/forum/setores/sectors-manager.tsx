'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Sector {
  id: string
  slug: string
  name: string
  description: string | null
  order: number
  onlyAdminPost: boolean
  active: boolean
  threadCount: number
}

export function SectorsManager({ initialSectors }: { initialSectors: Sector[] }) {
  const router = useRouter()
  const [sectors, setSectors] = useState(initialSectors)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Novo setor
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [description, setDescription] = useState('')
  const [creating, setCreating] = useState(false)

  async function createSector(e: React.FormEvent) {
    e.preventDefault()
    if (creating || !name.trim() || !slug.trim()) return
    setCreating(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/forum/sectors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          slug: slug.trim(),
          description: description.trim() || undefined,
          order: sectors.length,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'Erro ao criar setor')
        return
      }
      setSectors((prev) => [...prev, { ...data.sector, threadCount: 0 }])
      setName('')
      setSlug('')
      setDescription('')
    } catch {
      setError('Erro de conexão.')
    } finally {
      setCreating(false)
    }
  }

  async function patchSector(id: string, patch: Partial<Sector>) {
    setBusyId(id)
    setError(null)
    try {
      const res = await fetch(`/api/admin/forum/sectors/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      })
      if (!res.ok) {
        const data = await res.json()
        setError(data.error ?? 'Erro ao atualizar setor')
        return
      }
      setSectors((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)))
    } catch {
      setError('Erro de conexão.')
    } finally {
      setBusyId(null)
    }
  }

  async function move(id: string, direction: -1 | 1) {
    const idx = sectors.findIndex((s) => s.id === id)
    const otherIdx = idx + direction
    if (idx < 0 || otherIdx < 0 || otherIdx >= sectors.length) return

    const a = sectors[idx]
    const b = sectors[otherIdx]

    const next = [...sectors]
    next[idx] = { ...a, order: b.order }
    next[otherIdx] = { ...b, order: a.order }
    next.sort((x, y) => x.order - y.order)
    setSectors(next)

    await Promise.all([
      fetch(`/api/admin/forum/sectors/${a.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ order: b.order }) }),
      fetch(`/api/admin/forum/sectors/${b.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ order: a.order }) }),
    ])
    router.refresh()
  }

  async function remove(id: string) {
    if (!confirm('Remover este setor? Só funciona se ele não tiver tópicos.')) return
    setBusyId(id)
    setError(null)
    try {
      const res = await fetch(`/api/admin/forum/sectors/${id}`, { method: 'DELETE' })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'Erro ao remover setor')
        return
      }
      setSectors((prev) => prev.filter((s) => s.id !== id))
    } catch {
      setError('Erro de conexão.')
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {error && (
        <p className="rounded-lg border border-red-900/50 bg-red-950/30 px-4 py-3 text-sm text-red-400">{error}</p>
      )}

      <div className="rounded-xl border border-neutral-800 bg-neutral-900 divide-y divide-neutral-800">
        {sectors.map((sector, idx) => (
          <div key={sector.id} className="flex items-center gap-3 p-4">
            <div className="flex flex-col gap-1">
              <button
                onClick={() => move(sector.id, -1)}
                disabled={idx === 0 || busyId === sector.id}
                className="text-neutral-500 hover:text-white disabled:opacity-30 text-xs"
                aria-label="Mover para cima"
              >
                ▲
              </button>
              <button
                onClick={() => move(sector.id, 1)}
                disabled={idx === sectors.length - 1 || busyId === sector.id}
                className="text-neutral-500 hover:text-white disabled:opacity-30 text-xs"
                aria-label="Mover para baixo"
              >
                ▼
              </button>
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white">{sector.name}</p>
              <p className="text-xs text-neutral-500 mt-0.5">
                /{sector.slug} · {sector.threadCount} tópico{sector.threadCount !== 1 ? 's' : ''}
                {sector.onlyAdminPost && ' · só admin posta'}
              </p>
            </div>

            <label className="flex items-center gap-2 text-xs text-neutral-400">
              <input
                type="checkbox"
                checked={sector.onlyAdminPost}
                disabled={busyId === sector.id}
                onChange={(e) => patchSector(sector.id, { onlyAdminPost: e.target.checked })}
              />
              Só admin
            </label>

            <button
              onClick={() => patchSector(sector.id, { active: !sector.active })}
              disabled={busyId === sector.id}
              className={`rounded-md border px-3 py-1.5 text-xs font-medium transition disabled:opacity-40 ${
                sector.active
                  ? 'border-emerald-800/60 bg-emerald-950/40 text-emerald-400 hover:bg-emerald-900/50'
                  : 'border-neutral-700 bg-neutral-800 text-neutral-400 hover:bg-neutral-700'
              }`}
            >
              {sector.active ? 'Ativo' : 'Inativo'}
            </button>

            <button
              onClick={() => remove(sector.id)}
              disabled={busyId === sector.id || sector.threadCount > 0}
              title={sector.threadCount > 0 ? 'Remova ou mova os tópicos primeiro' : undefined}
              className="text-red-500 hover:text-red-400 disabled:opacity-30 text-xs font-medium"
            >
              Remover
            </button>
          </div>
        ))}
      </div>

      <form onSubmit={createSector} className="rounded-xl border border-neutral-800 bg-neutral-900 p-4 flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-white">Novo setor</h2>
        <div className="grid sm:grid-cols-2 gap-3">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nome (ex.: Comunidade)"
            className="rounded-md border border-neutral-700 bg-neutral-800 px-3 py-2 text-sm text-white placeholder-neutral-500 outline-none focus:border-rose-600"
          />
          <input
            value={slug}
            onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))}
            placeholder="Slug (ex.: comunidade)"
            className="rounded-md border border-neutral-700 bg-neutral-800 px-3 py-2 text-sm text-white placeholder-neutral-500 outline-none focus:border-rose-600"
          />
        </div>
        <input
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Descrição (opcional)"
          className="rounded-md border border-neutral-700 bg-neutral-800 px-3 py-2 text-sm text-white placeholder-neutral-500 outline-none focus:border-rose-600"
        />
        <button
          type="submit"
          disabled={creating || !name.trim() || !slug.trim()}
          className="self-start rounded-md bg-rose-600 px-4 py-2 text-sm font-medium text-white hover:bg-rose-500 disabled:opacity-50"
        >
          {creating ? 'Criando…' : 'Criar setor'}
        </button>
      </form>
    </div>
  )
}
