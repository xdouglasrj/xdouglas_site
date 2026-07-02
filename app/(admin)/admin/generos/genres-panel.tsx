'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Genre {
  id: string
  name: string
  slug: string
  order: number
  active: boolean
  parentId: string | null
}

interface ParentGenre extends Genre {
  children: Genre[]
}

function slugify(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function GenresPanel({ initialGenres }: { initialGenres: ParentGenre[] }) {
  const router = useRouter()
  const [newParentName, setNewParentName] = useState('')
  const [newChildName, setNewChildName] = useState<Record<string, string>>({})
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function refresh() {
    router.refresh()
  }

  async function createGenre(name: string, parentId: string | null) {
    if (!name.trim()) return
    setBusy(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/generos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), slug: slugify(name), parentId }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erro ao criar gênero')
      await refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar gênero')
    } finally {
      setBusy(false)
    }
  }

  async function toggleActive(genre: Genre) {
    setBusy(true)
    setError(null)
    try {
      const res = await fetch(`/api/admin/generos/${genre.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: !genre.active }),
      })
      if (!res.ok) throw new Error('Erro ao atualizar gênero')
      await refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao atualizar')
    } finally {
      setBusy(false)
    }
  }

  async function rename(genre: Genre) {
    const name = window.prompt('Novo nome', genre.name)
    if (!name || name.trim() === genre.name) return
    setBusy(true)
    setError(null)
    try {
      const res = await fetch(`/api/admin/generos/${genre.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), slug: slugify(name) }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erro ao renomear')
      await refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao renomear')
    } finally {
      setBusy(false)
    }
  }

  async function reorder(genre: Genre, direction: -1 | 1) {
    setBusy(true)
    setError(null)
    try {
      const res = await fetch(`/api/admin/generos/${genre.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order: genre.order + direction }),
      })
      if (!res.ok) throw new Error('Erro ao reordenar')
      await refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao reordenar')
    } finally {
      setBusy(false)
    }
  }

  async function remove(genre: Genre) {
    if (!window.confirm(`Excluir "${genre.name}"?`)) return
    setBusy(true)
    setError(null)
    try {
      const res = await fetch(`/api/admin/generos/${genre.id}`, { method: 'DELETE' })
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

      <div className="flex gap-2">
        <input
          value={newParentName}
          onChange={(e) => setNewParentName(e.target.value)}
          placeholder="Nova categoria-mãe..."
          className="flex-1 rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-sm text-neutral-200 placeholder:text-neutral-600 outline-none focus:border-neutral-600"
        />
        <button
          disabled={busy}
          onClick={async () => { await createGenre(newParentName, null); setNewParentName('') }}
          className="rounded-lg bg-gate-pink px-4 py-2 text-xs font-semibold text-white transition hover:bg-gate-pink/90 disabled:opacity-50"
        >
          Adicionar categoria
        </button>
      </div>

      {initialGenres.map((parent) => (
        <div key={parent.id} className="rounded-xl border border-neutral-800 bg-neutral-900 p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <button onClick={() => reorder(parent, -1)} disabled={busy} className="text-neutral-500 hover:text-neutral-300">↑</button>
              <button onClick={() => reorder(parent, 1)} disabled={busy} className="text-neutral-500 hover:text-neutral-300">↓</button>
              <p className={`font-medium ${parent.active ? 'text-neutral-200' : 'text-neutral-600 line-through'}`}>{parent.name}</p>
              <span className="text-xs text-neutral-600">/{parent.slug}</span>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => rename(parent)} disabled={busy} className="text-xs text-neutral-400 hover:text-neutral-200">Editar</button>
              <button onClick={() => toggleActive(parent)} disabled={busy} className="text-xs text-neutral-400 hover:text-neutral-200">
                {parent.active ? 'Desativar' : 'Ativar'}
              </button>
              <button onClick={() => remove(parent)} disabled={busy} className="text-xs text-rose-500 hover:text-rose-400">Excluir</button>
            </div>
          </div>

          <ul className="mt-3 ml-6 space-y-1.5 border-l border-neutral-800 pl-4">
            {parent.children.map((child) => (
              <li key={child.id} className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <button onClick={() => reorder(child, -1)} disabled={busy} className="text-neutral-500 hover:text-neutral-300 text-xs">↑</button>
                  <button onClick={() => reorder(child, 1)} disabled={busy} className="text-neutral-500 hover:text-neutral-300 text-xs">↓</button>
                  <span className={`text-sm ${child.active ? 'text-neutral-300' : 'text-neutral-600 line-through'}`}>{child.name}</span>
                  <span className="text-xs text-neutral-600">/{child.slug}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => rename(child)} disabled={busy} className="text-xs text-neutral-400 hover:text-neutral-200">Editar</button>
                  <button onClick={() => toggleActive(child)} disabled={busy} className="text-xs text-neutral-400 hover:text-neutral-200">
                    {child.active ? 'Desativar' : 'Ativar'}
                  </button>
                  <button onClick={() => remove(child)} disabled={busy} className="text-xs text-rose-500 hover:text-rose-400">Excluir</button>
                </div>
              </li>
            ))}
          </ul>

          <div className="mt-3 ml-6 flex gap-2 pl-4">
            <input
              value={newChildName[parent.id] ?? ''}
              onChange={(e) => setNewChildName((prev) => ({ ...prev, [parent.id]: e.target.value }))}
              placeholder="Novo subgênero..."
              className="flex-1 rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-1.5 text-xs text-neutral-200 placeholder:text-neutral-600 outline-none focus:border-neutral-600"
            />
            <button
              disabled={busy}
              onClick={async () => {
                await createGenre(newChildName[parent.id] ?? '', parent.id)
                setNewChildName((prev) => ({ ...prev, [parent.id]: '' }))
              }}
              className="rounded-lg border border-neutral-700 px-3 py-1.5 text-xs font-medium text-neutral-300 transition hover:border-gate-pink hover:text-gate-pink disabled:opacity-50"
            >
              Adicionar
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
