'use client'

import { useState, useEffect, useCallback } from 'react'
import { TrackCard } from './track-card'
import { TrackGridSkeleton } from './track-card-skeleton'
import { EmptyState } from './empty-state'
import { GenreFilter } from './genre-filter'
import type { TrackPublic } from '@/lib/tracks/types'

interface TrackGridProps {
  initialTracks: TrackPublic[]
  initialTotal: number
  genres: string[]
  initialGenre?: string | null
  initialQuery?: string | null
  canDownload?: boolean
}

const PER_PAGE = 24

export function TrackGrid({
  initialTracks,
  initialTotal,
  genres,
  initialGenre = null,
  initialQuery = null,
  canDownload = true,
}: TrackGridProps) {
  const [tracks, setTracks] = useState<TrackPublic[]>(initialTracks)
  const [total, setTotal] = useState(initialTotal)
  const [genre, setGenre] = useState<string | null>(initialGenre)
  const [query] = useState<string | null>(initialQuery)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)

  const hasMore = tracks.length < total

  // Busca quando filtro muda — reseta paginação
  const fetchTracks = useCallback(
    async (selectedGenre: string | null, nextPage: number, append: boolean) => {
      const params = new URLSearchParams({
        page: String(nextPage),
        perPage: String(PER_PAGE),
      })
      if (selectedGenre) params.set('genre', selectedGenre)
      if (query) params.set('q', query)

      const res = await fetch(`/api/musicas?${params}`)
      if (!res.ok) return

      const data = await res.json()

      setTracks((prev) =>
        append ? [...prev, ...data.tracks] : data.tracks
      )
      setTotal(data.total)
    },
    [query]
  )

  // Mudança de gênero
  function handleGenreChange(newGenre: string | null) {
    if (newGenre === genre) return
    setGenre(newGenre)
    setPage(1)
    setLoading(true)
    fetchTracks(newGenre, 1, false).finally(() => setLoading(false))
  }

  // Carregar mais
  function handleLoadMore() {
    const nextPage = page + 1
    setPage(nextPage)
    setLoadingMore(true)
    fetchTracks(genre, nextPage, true).finally(() => setLoadingMore(false))
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Filtro de gênero */}
      <GenreFilter
        genres={genres}
        selected={genre}
        onChange={handleGenreChange}
      />

      {/* Contagem */}
      {!loading && (
        <p className="text-xs text-gate-blue">
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
          <div className="flex flex-col gap-2 max-w-3xl mx-auto w-full">
            {tracks.map((track) => (
              <TrackCard key={track.id} track={track} canDownload={canDownload} />
            ))}
          </div>

          {/* Carregar mais */}
          {hasMore && (
            <div className="flex justify-center pt-4">
              <button
                onClick={handleLoadMore}
                disabled={loadingMore}
                className="px-6 py-2.5 text-sm font-medium text-gate-blue border border-gate-azure rounded-lg hover:border-gate-pink hover:text-gate-pink disabled:opacity-50 transition-colors"
              >
                {loadingMore ? 'Carregando…' : 'Ver mais músicas'}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
