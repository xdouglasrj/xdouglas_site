'use client'

import { clsx } from 'clsx'
import type { TrackSortBy } from '@/lib/tracks/queries'

const SORT_OPTIONS: { value: TrackSortBy; label: string }[] = [
  { value: 'recent', label: 'Data' },
  { value: 'name', label: 'Nome' },
  { value: 'artist', label: 'Artista' },
  { value: 'downloads', label: 'Download' },
]

interface SortFilterProps {
  selected: TrackSortBy
  onChange: (sort: TrackSortBy) => void
}

// Filtros extra — só aparecem nas páginas de gênero (catálogo completo),
// não no feed de /musicas-recentes.
export function SortFilter({ selected, onChange }: SortFilterProps) {
  return (
    <div
      className="flex flex-wrap items-center justify-center gap-2"
      role="group"
      aria-label="Ordenar músicas"
    >
      <span className="text-xs text-gate-blue mr-1">Ordenar por:</span>
      {SORT_OPTIONS.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          aria-pressed={selected === opt.value}
          className={clsx(
            'shrink-0 px-3 py-1.5 text-xs font-medium rounded-full border transition-colors',
            selected === opt.value
              ? 'bg-gate-pink border-gate-pink text-white'
              : 'bg-transparent border-gate-azure text-gate-blue hover:border-gate-pink hover:text-gate-pink'
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}
