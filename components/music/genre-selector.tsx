'use client'

import { useEffect, useState } from 'react'

// ============================================================
// Seletor hierárquico de gênero — categoria-mãe primeiro, depois
// subgênero (opcional). Busca a árvore de /api/generos uma vez e
// reutiliza em qualquer formulário (upload, filtros futuros).
// ============================================================

export interface GenreNode {
  id: string
  slug: string
  name: string
  parentId: string | null
}

export interface GenreTreeNode extends GenreNode {
  children: GenreNode[]
}

interface GenreSelectorProps {
  /** id do gênero selecionado (pode ser categoria-mãe ou subgênero) */
  value: string
  onChange: (genreId: string) => void
  className?: string
  labelClassName?: string
}

const selectClass =
  'w-full rounded-lg border border-gate-azure bg-white/5 px-4 py-3 text-sm text-white outline-none transition focus:border-gate-pink focus:ring-1 focus:ring-gate-pink/40'

export function GenreSelector({ value, onChange, className, labelClassName }: GenreSelectorProps) {
  const [tree, setTree] = useState<GenreTreeNode[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    fetch('/api/generos')
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled) setTree(data.genres ?? [])
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  // Descobre a categoria-mãe atualmente selecionada (direta ou via filho)
  const selectedParent =
    tree.find((p) => p.id === value) ?? tree.find((p) => p.children.some((c) => c.id === value))
  const selectedChildId = selectedParent && selectedParent.id !== value ? value : ''

  function handleParentChange(parentId: string) {
    onChange(parentId)
  }

  function handleChildChange(childId: string) {
    onChange(childId || selectedParent!.id)
  }

  return (
    <div className={`grid grid-cols-1 sm:grid-cols-2 gap-4 ${className ?? ''}`}>
      <div>
        <label className={labelClassName ?? 'mb-1.5 block text-xs font-medium uppercase tracking-wider text-gate-blue'}>
          Gênero
        </label>
        <select
          value={selectedParent?.id ?? ''}
          onChange={(e) => handleParentChange(e.target.value)}
          disabled={loading}
          className={selectClass}
        >
          <option value="" className="text-black">{loading ? 'Carregando…' : 'Selecione…'}</option>
          {tree.map((parent) => (
            <option key={parent.id} value={parent.id} className="text-black">
              {parent.name}
            </option>
          ))}
        </select>
      </div>

      {selectedParent && selectedParent.children.length > 0 && (
        <div>
          <label className={labelClassName ?? 'mb-1.5 block text-xs font-medium uppercase tracking-wider text-gate-blue'}>
            Subgênero
          </label>
          <select
            value={selectedChildId}
            onChange={(e) => handleChildChange(e.target.value)}
            className={selectClass}
          >
            <option value="" className="text-black">Só a categoria acima</option>
            {selectedParent.children.map((child) => (
              <option key={child.id} value={child.id} className="text-black">
                {child.name}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  )
}
