'use client'

import { clsx } from 'clsx'

interface GenreFilterProps {
  genres: string[]
  selected: string | null
  onChange: (genre: string | null) => void
}

export function GenreFilter({ genres, selected, onChange }: GenreFilterProps) {
  if (genres.length === 0) return null

  return (
    <div
      className="flex flex-wrap items-center justify-center gap-2"
      role="group"
      aria-label="Filtrar por gênero"
    >
      <FilterChip
        label="Todos"
        active={selected === null}
        onClick={() => onChange(null)}
      />
      {genres.map((genre) => (
        <FilterChip
          key={genre}
          label={genre}
          active={selected === genre}
          onClick={() => onChange(selected === genre ? null : genre)}
        />
      ))}
    </div>
  )
}

function FilterChip({
  label,
  active,
  onClick,
}: {
  label: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={clsx(
        'shrink-0 px-3 py-1.5 text-xs font-medium rounded-full border transition-colors',
        active
          ? 'bg-gate-pink border-gate-pink text-white'
          : 'bg-transparent border-gate-azure text-gate-blue hover:border-gate-pink hover:text-gate-pink'
      )}
      aria-pressed={active}
    >
      {label}
    </button>
  )
}
