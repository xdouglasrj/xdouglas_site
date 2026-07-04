import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { TRACK_SELECT, serializeTrack } from './queries'
import type { TrackPublic } from './types'

// ============================================================
// V3 Plano 14 — Séries de sets (volumes/episódios)
// Server-only (importa Prisma). Slug único gerado a partir do título,
// mesma técnica de generateUniqueSlug em admin-queries.ts.
// ============================================================

const REMOVE_DIACRITICS = new RegExp(
  `[${String.fromCharCode(0x0300)}-${String.fromCharCode(0x036f)}]`,
  'g',
)

function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFD')
    .replace(REMOVE_DIACRITICS, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 80)
}

export async function generateUniqueSeriesSlug(title: string): Promise<string> {
  const base = slugify(title) || 'serie'
  let slug = base
  let attempt = 0
  while (true) {
    const existing = await prisma.trackSeries.findUnique({ where: { slug }, select: { id: true } })
    if (!existing) return slug
    attempt++
    slug = `${base}-${attempt}`
  }
}

// ============================================================
// Listagem de séries do artista (para o select no upload) e criação
// ============================================================

export interface ArtistSeriesOption {
  id: string
  title: string
  nextEpisodeNumber: number
}

/** Séries do artista com o próximo número de episódio sugerido (maior + 1). */
export async function listArtistSeriesOptions(artistId: string): Promise<ArtistSeriesOption[]> {
  const series = await prisma.trackSeries.findMany({
    where: { artistId },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      title: true,
      tracks: { select: { episodeNumber: true }, orderBy: { episodeNumber: 'desc' }, take: 1 },
    },
  })

  return series.map((s) => ({
    id: s.id,
    title: s.title,
    nextEpisodeNumber: (s.tracks[0]?.episodeNumber ?? 0) + 1,
  }))
}

export const createSeriesSchema = z.object({
  title: z.string().min(1, 'Título obrigatório').max(200),
  description: z.string().max(2000).optional(),
})

export async function getOrCreateSeriesByTitle(
  artistId: string,
  title: string,
  description?: string,
) {
  const trimmed = title.trim()
  const existing = await prisma.trackSeries.findFirst({
    where: { artistId, title: trimmed },
  })
  if (existing) return existing

  const slug = await generateUniqueSeriesSlug(trimmed)
  try {
    return await prisma.trackSeries.create({
      data: { slug, title: trimmed, description, artistId },
    })
  } catch {
    // Corrida (@@unique([artistId, title])): outra requisição criou a mesma
    // série entre o findFirst e o create — reusa a existente em vez de falhar.
    const raced = await prisma.trackSeries.findFirst({
      where: { artistId, title: trimmed },
    })
    if (raced) return raced
    throw new Error('Falha ao criar a série')
  }
}

// ============================================================
// Página pública da série
// ============================================================

export interface SeriesPublic {
  id: string
  slug: string
  title: string
  description: string | null
  coverUrl: string | null
  artist: { id: string; slug: string; name: string; photoUrl: string | null }
  updatedAt: string
}

export async function getSeriesBySlug(slug: string): Promise<SeriesPublic | null> {
  const series = await prisma.trackSeries.findUnique({
    where: { slug },
    select: {
      id: true,
      slug: true,
      title: true,
      description: true,
      updatedAt: true,
      artist: { select: { id: true, slug: true, name: true, photoUrl: true } },
      tracks: {
        where: { published: true },
        orderBy: { episodeNumber: 'desc' },
        take: 1,
        select: { coverUrl: true },
      },
    },
  })
  if (!series) return null

  return {
    id: series.id,
    slug: series.slug,
    title: series.title,
    description: series.description,
    coverUrl: series.tracks[0]?.coverUrl ?? null,
    artist: series.artist,
    updatedAt: series.updatedAt.toISOString(),
  }
}

/** Episódios publicados da série, em ordem decrescente (mais recente primeiro). */
export async function listSeriesEpisodes(seriesId: string): Promise<TrackPublic[]> {
  const raws = await prisma.track.findMany({
    where: { seriesId, published: true },
    select: TRACK_SELECT,
    orderBy: { episodeNumber: 'desc' },
  })
  return raws.map((raw) => serializeTrack(raw))
}

// ============================================================
// Vizinhos (anterior/próximo) para a página da faixa
// ============================================================

export interface SeriesContextForTrack {
  series: { id: string; slug: string; title: string }
  episodeNumber: number | null
  neighbors: Array<{ slug: string; title: string; episodeNumber: number | null; coverUrl: string | null }>
  prevSlug: string | null
  nextSlug: string | null
}

/** Contexto de série para a página da faixa: badge, vizinhos, navegação anterior/próximo. */
export async function getSeriesContextForTrack(
  trackId: string,
  seriesId: string,
  episodeNumber: number | null,
): Promise<SeriesContextForTrack | null> {
  const series = await prisma.trackSeries.findUnique({
    where: { id: seriesId },
    select: { id: true, slug: true, title: true },
  })
  if (!series) return null

  const episodes = await prisma.track.findMany({
    where: { seriesId, published: true },
    orderBy: { episodeNumber: 'desc' },
    select: { id: true, slug: true, title: true, episodeNumber: true, coverUrl: true },
  })

  const idx = episodes.findIndex((e) => e.id === trackId)
  const neighbors = episodes.filter((e) => e.id !== trackId).slice(0, 3)

  // Ordem decrescente: "próximo" (mais recente) fica no índice anterior,
  // "anterior" (mais antigo) fica no índice seguinte.
  const nextSlug = idx > 0 ? episodes[idx - 1].slug : null
  const prevSlug = idx >= 0 && idx < episodes.length - 1 ? episodes[idx + 1].slug : null

  return {
    series,
    episodeNumber,
    neighbors: neighbors.map(({ slug, title, episodeNumber: ep, coverUrl }) => ({
      slug, title, episodeNumber: ep, coverUrl,
    })),
    prevSlug,
    nextSlug,
  }
}

// ============================================================
// Séries do artista (aba "Séries" no perfil)
// ============================================================

export interface ArtistSeriesCard {
  id: string
  slug: string
  title: string
  coverUrl: string | null
  episodeCount: number
}

export async function listPublishedSeriesByArtist(artistId: string): Promise<ArtistSeriesCard[]> {
  const series = await prisma.trackSeries.findMany({
    where: { artistId, tracks: { some: { published: true } } },
    orderBy: { updatedAt: 'desc' },
    select: {
      id: true,
      slug: true,
      title: true,
      tracks: {
        where: { published: true },
        orderBy: { episodeNumber: 'desc' },
        select: { coverUrl: true },
      },
    },
  })

  return series.map((s) => ({
    id: s.id,
    slug: s.slug,
    title: s.title,
    coverUrl: s.tracks[0]?.coverUrl ?? null,
    episodeCount: s.tracks.length,
  }))
}

// ============================================================
// Gestão — renomear série, reordenar/remover episódio (minhas-musicas/admin)
// ============================================================

export async function listMySeriesWithEpisodes(artistId: string) {
  return prisma.trackSeries.findMany({
    where: { artistId },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      slug: true,
      title: true,
      tracks: {
        orderBy: { episodeNumber: 'asc' },
        select: { id: true, title: true, episodeNumber: true, published: true, slug: true },
      },
    },
  })
}

export const renameSeriesSchema = z.object({
  title: z.string().min(1, 'Título obrigatório').max(200),
})

export async function renameSeries(seriesId: string, title: string) {
  return prisma.trackSeries.update({
    where: { id: seriesId },
    data: { title: title.trim() },
    select: { id: true, title: true, slug: true },
  })
}

/** Atualiza o episodeNumber de uma faixa dentro da série (reordenar). */
export async function setEpisodeNumber(trackId: string, episodeNumber: number) {
  return prisma.track.update({
    where: { id: trackId },
    data: { episodeNumber },
    select: { id: true, episodeNumber: true },
  })
}

/** Remove a faixa da série (não apaga a faixa, só desvincula). */
export async function removeTrackFromSeries(trackId: string) {
  return prisma.track.update({
    where: { id: trackId },
    data: { seriesId: null, episodeNumber: null },
    select: { id: true },
  })
}
