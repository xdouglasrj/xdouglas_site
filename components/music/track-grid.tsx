'use client'

import { useState, useEffect, useCallback } from 'react'
import { TrackCard } from './track-card'
import { TrackGridSkeleton } from './track-card-skeleton'
import { EmptyState } from './empty-state'
import { SortFilter } from './sort-filter'
import type { TrackPublic } from '@/lib/tracks/types'
import type { TrackSortBy } from '@/lib/tracks/queries'

interface TrackGridProps {
  initialTracks: TrackPublic[]
  initialTotal: number
  initialGenre?: string | null
  initialQuery?: string | null
  initialSort?: TrackSortBy
  canDownload?: boolean
  /**
   * 'feed' — /musicas-recentes: só músicas postadas nas últimas 24h (janela
   * individual por upload), sem barra de filtros.
   * 'catalog' — páginas de gênero: todo o histórico publicado, com filtro
   * de gênero centralizado e filtros extra (nome, artista, data, download).
   */
  mode?: 'feed' | 'catalog'
}

const PER_PAGE = 20

export function TrackGrid({
  initialTracks,
  initialTotal,
  initialGenre = null,
  initialQuery = null,
  initialSort = 'recent',
  canDownload = true,
  mode = 'feed',
}: TrackGridProps) {
  const isCatalog = mode === 'catalog'
  const [tracks, setTracks] = useState<TrackPublic[]>(initialTracks)
  const [total, setTotal] = useState(initialTotal)
  const [genre, setGenre] = useState<string | null>(isCatalog ? initialGenre : null)
  const [sort, setSort] = useState<TrackSortBy>(isCatalog ? initialSort : 'recent')
  const [query] = useState<string | null>(initialQuery)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)

  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE))

  // Busca quando filtro ou página muda
  const fetchTracks = useCallback(
    async (selectedGenre: string | null, nextPage: number, nextSort: TrackSortBy) => {
      const params = new URLSearchParams({
        page: String(nextPage),
        perPage: String(PER_PAGE),
      })
      if (selectedGenre) params.set('genre', selectedGenre)
      if (query) params.set('q', query)
      if (isCatalog) {
        params.set('includeExpired', '1')
        params.set('sort', nextSort)
      }

      const res = await fetch(`/api/musicas?${params}`)
      if (!res.ok) return

      const data = await res.json()

      setTracks(data.tracks)
      setTotal(data.total)
    },
    [query, isCatalog]
  )

  // Mudança de gênero — reseta paginação
  function handleGenreChange(newGenre: string | null) {
    if (newGenre === genre) return
    setGenre(newGenre)
    setPage(1)
    setLoading(true)
    fetchTracks(newGenre, 1, sort).finally(() => setLoading(false))
  }

  // Mudança de ordenação — reseta paginação
  function handleSortChange(newSort: TrackSortBy) {
    if (newSort === sort) return
    setSort(newSort)
    setPage(1)
    setLoading(true)
    fetchTracks(genre, 1, newSort).finally(() => setLoading(false))
  }

  // Troca de página
  function handlePageChange(nextPage: number) {
    if (nextPage === page || nextPage < 1 || nextPage > totalPages) return
    setPage(nextPage)
    setLoading(true)
    fetchTracks(genre, nextPage, sort).finally(() => setLoading(false))
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Barra de filtros — só nas páginas de gênero (catálogo completo) */}
      {isCatalog && (
        <div className="flex flex-col items-center gap-3 px-4 py-4">
          <SortFilter selected={sort} onChange={handleSortChange} />
        </div>
      )}

      {/* Contagem */}
      {!loading && (
        <p className={`text-xs text-gate-blue ${isCatalog ? 'text-center' : ''}`}>
          {total.toLocaleString('pt-BR')} música{total !== 1 ? 's' : ''}
          {genre ? ` em ${genre}` : ''}
          {query ? ` para "${query}"` : ''}
        </p>
      )}

      {/* Grid */}
      {loading ? (
        <TrackGridSkeleton count={PER_PAGE} />
      ) : tracks.length === 0 ? (
        <EmptyState
          filtered={genre !== null}
          onClearFilter={() => handleGenreChange(null)}
        />
      ) : (
        <>
          <div className="max-w-3xl mx-auto w-full flex flex-col gap-3">
            {tracks.map((track) => (
              <TrackCard key={track.id} track={track} canDownload={canDownload} />
            ))}
          </div>

          {/* Paginação */}
          {totalPages > 1 && (
            <Pagination page={page} totalPages={totalPages} onChange={handlePageChange} />
          )}
        </>
      )}
    </div>
  )
}

// ============================================================
// Paginação numerada
// ============================================================

function Pagination({
  page,
  totalPages,
  onChange,
}: {
  page: number
  totalPages: number
  onChange: (page: number) => void
}) {
  // Janela de páginas em volta da atual (no máximo 5 números visíveis)
  const start = Math.max(1, Math.min(page - 2, totalPages - 4))
  const end = Math.min(totalPages, start + 4)
  const pageNumbers = Array.from({ length: end - start + 1 }, (_, i) => start + i)

  return (
    <nav
      aria-label="Paginação de músicas"
      className="flex items-center justify-center gap-1.5 pt-4"
    >
      <button
        onClick={() => onChange(page - 1)}
        disabled={page <= 1}
        className="px-3 py-2 text-sm font-medium text-gate-blue border border-gate-azure rounded-lg hover:border-gate-pink hover:text-gate-pink disabled:opacity-40 disabled:pointer-events-none transition-colors"
        aria-label="Página anterior"
      >
        Anterior
      </button>

      {pageNumbers.map((n) => (
        <button
          key={n}
          onClick={() => onChange(n)}
          aria-current={n === page ? 'page' : undefined}
          className={`min-w-[2.25rem] px-2.5 py-2 text-sm font-medium rounded-lg border transition-colors ${
            n === page
              ? 'bg-gate-pink border-gate-pink text-white'
              : 'text-gate-blue border-gate-azure hover:border-gate-pink hover:text-gate-pink'
          }`}
        >
          {n}
        </button>
      ))}

      <button
        onClick={() => onChange(page + 1)}
        disabled={page >= totalPages}
        className="px-3 py-2 text-sm font-medium text-gate-blue border border-gate-azure rounded-lg hover:border-gate-pink hover:text-gate-pink disabled:opacity-40 disabled:pointer-events-none transition-colors"
        aria-label="Próxima página"
      >
        Próxima
      </button>
    </nav>
  )
}
