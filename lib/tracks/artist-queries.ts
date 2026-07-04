import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { after } from 'next/server'
import { generateUniqueSlug } from './admin-queries'
import { saveTracklistFromText } from './tracklist-writer'
import { getOrCreateSeriesByTitle } from './series'
import { isValidMood, normalizeTag, MAX_TAGS } from './moods'
import { isValidTrackKind, DEFAULT_TRACK_KIND } from './track-kinds'
import {
  isWithinScheduleWindow,
  countActiveSchedules,
  MAX_SCHEDULE_DAYS_AHEAD,
  MAX_SCHEDULED_TRACKS_PER_USER,
} from './scheduling'
import { assertCanEnterContest, createContestEntry } from '@/lib/contests/entries'
import { runCopyrightCheck } from './copyright-check'

// ============================================================
// Schema de validação — envio de música pelo próprio artista
// ============================================================

export const submitTrackSchema = z.object({
  title: z.string().min(1, 'Título obrigatório').max(200),
  producerName: z.string().max(200).optional(),
  description: z.string().max(2000).optional(),
  genreId: z.string().uuid().optional(),
  bpm: z.number().int().min(40).max(300).optional(),
  key: z.string().max(20).optional(),
  // V3 Plano 5 — metadados DJ (tudo opcional)
  mood: z.string().max(40).refine((v) => isValidMood(v), 'Mood inválido').optional(),
  tags: z
    .array(z.string().max(40))
    .max(MAX_TAGS, `Máximo de ${MAX_TAGS} tags`)
    .transform((arr) => [...new Set(arr.map(normalizeTag).filter(Boolean))])
    .optional(),
  durationSeconds: z.number().int().positive().max(24 * 60 * 60).optional(),
  // V3 Plano 16 — tipo de upload (Música / Set-Mix / Podcast). Default Música.
  kind: z.string().refine((v) => isValidTrackKind(v), 'Tipo inválido').default(DEFAULT_TRACK_KIND),
  // V3 Plano 10 — tracklist do set (texto colado; parseada no servidor)
  tracklistText: z.string().max(20000).nullable().optional(),
  // V3 Plano 12 — modo de download: "free" ou "follow" (exige seguir o
  // artista). Validado no servidor — só aceita esses dois valores.
  downloadMode: z.enum(['free', 'follow']).default('free'),
  // V3 Plano 14 — série (episódio de um set recorrente). Escolhe uma série
  // existente (seriesId) OU cria uma nova (newSeriesTitle). episodeNumber é
  // sugerido no form (maior da série + 1) e editável.
  seriesId: z.string().uuid().optional(),
  newSeriesTitle: z.string().max(200).optional(),
  episodeNumber: z.number().int().positive().max(100_000).optional(),
  audioKey: z.string().min(1, 'Arquivo de áudio obrigatório'),
  audioFormat: z.enum(['mp3', 'wav', 'flac', 'aiff']),
  audioSizeBytes: z.number().positive().optional(),
  coverKey: z.string().optional(),
  coverUrl: z.string().url().optional(),
  // Lançamento agendado pelo próprio artista — opcional; quando presente,
  // é validado contra a janela de 15 dias e o limite de 30 agendamentos
  // simultâneos por usuário (ver lib/tracks/scheduling.ts)
  scheduledAt: z.string().datetime().optional(),
  // V3 Plano 6 — participação em concurso (opcional). Validado no servidor
  // em submitTrack: contest precisa existir, estar publicado, dentro do
  // prazo, e o usuário não pode já ter participado (ver lib/contests/entries.ts)
  contestId: z.string().uuid().optional(),
})

export type SubmitTrackInput = z.infer<typeof submitTrackSchema>

// ============================================================
// Gera slug único para o perfil de artista
// ============================================================

// Faixa Unicode dos sinais diacríticos combinantes (acentos), construída via
// código para evitar caracteres de combinação literais no arquivo-fonte
const REMOVE_DIACRITICS = new RegExp(
  `[${String.fromCharCode(0x0300)}-${String.fromCharCode(0x036f)}]`,
  'g'
)

async function generateUniqueArtistSlug(name: string): Promise<string> {
  const base = name
    .toLowerCase()
    .normalize('NFD')
    .replace(REMOVE_DIACRITICS, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 80) || 'artista'

  let slug = base
  let attempt = 0
  while (true) {
    const existing = await prisma.artist.findUnique({
      where: { slug },
      select: { id: true },
    })
    if (!existing) return slug
    attempt++
    slug = `${base}-${attempt}`
  }
}

// ============================================================
// Garante que o usuário (role ARTIST) tem um perfil de Artist —
// cria automaticamente no primeiro envio
// ============================================================

export async function getOrCreateArtistProfile(userId: string) {
  const existing = await prisma.artist.findUnique({ where: { userId } })
  if (existing) return existing

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { name: true, username: true, artisticName: true },
  })
  const name = user?.artisticName?.trim() || user?.name?.trim() || user?.username?.trim() || 'Artista'
  const slug = await generateUniqueArtistSlug(name)

  return prisma.artist.create({
    data: { slug, name, userId },
  })
}

// ============================================================
// Cria a submissão — sempre como rascunho (published: false),
// aguardando moderação do admin
// ============================================================

export async function submitTrack(input: SubmitTrackInput, userId: string) {
  let scheduledAt: Date | undefined
  if (input.scheduledAt) {
    scheduledAt = new Date(input.scheduledAt)
    if (!isWithinScheduleWindow(scheduledAt)) {
      throw new Error(`Data de agendamento deve estar entre agora e ${MAX_SCHEDULE_DAYS_AHEAD} dias no futuro`)
    }
    const activeSchedules = await countActiveSchedules(userId)
    if (activeSchedules >= MAX_SCHEDULED_TRACKS_PER_USER) {
      throw new Error(`Limite de ${MAX_SCHEDULED_TRACKS_PER_USER} músicas agendadas atingido`)
    }
  }

  // V3 Plano 6 — valida a participação em concurso ANTES de criar a faixa:
  // contest precisa existir, estar publicado, dentro do prazo, e o usuário
  // não pode já ter uma entry neste contest. Falha cedo — nunca cria uma
  // Track associada a um contestId inválido.
  if (input.contestId) {
    await assertCanEnterContest(input.contestId, userId)
  }

  const artist = await getOrCreateArtistProfile(userId)
  const slug = await generateUniqueSlug(input.title)

  // V3 Plano 14 — resolve a série: cria nova pelo título OU usa uma existente
  // do PRÓPRIO artista (verificação de posse — não aceita série de terceiros).
  let seriesId: string | undefined
  if (input.newSeriesTitle && input.newSeriesTitle.trim()) {
    const series = await getOrCreateSeriesByTitle(artist.id, input.newSeriesTitle)
    seriesId = series.id
  } else if (input.seriesId) {
    const owned = await prisma.trackSeries.findFirst({
      where: { id: input.seriesId, artistId: artist.id },
      select: { id: true },
    })
    seriesId = owned?.id
  }

  const genre = input.genreId
    ? await prisma.genre.findUnique({ where: { id: input.genreId }, select: { name: true } })
    : null

  const track = await prisma.track.create({
    data: {
      slug,
      title: input.title,
      artistId: artist.id,
      producerName: input.producerName,
      description: input.description,
      genre: genre?.name,
      genreId: input.genreId,
      bpm: input.bpm,
      key: input.key,
      mood: input.mood,
      tags: input.tags ?? [],
      durationSeconds: input.durationSeconds,
      kind: input.kind,
      downloadMode: input.downloadMode,
      seriesId,
      episodeNumber: seriesId ? input.episodeNumber ?? null : null,
      audioKey: input.audioKey,
      audioFormat: input.audioFormat,
      audioSizeBytes: input.audioSizeBytes ? BigInt(input.audioSizeBytes) : null,
      coverKey: input.coverKey,
      coverUrl: input.coverUrl,
      submittedById: userId,
      published: false,
      scheduledAt,
    },
    select: { id: true, slug: true, title: true, published: true, scheduledAt: true, createdAt: true },
  })

  // V3 Plano 10 — grava a tracklist (se enviada) após criar a faixa
  await saveTracklistFromText(track.id, input.tracklistText)

  // V3 Plano 6 — cria a ContestEntry vinculando a faixa recém-criada ao
  // concurso. Revalida tudo de novo (fecha a janela de corrida entre o
  // assertCanEnterContest acima e este momento) — se disparar
  // ContestEntryError aqui, a faixa já foi criada como música normal (o
  // upload não é desfeito), só não conta como participação no concurso.
  if (input.contestId) {
    await createContestEntry(input.contestId, track.id, userId)
  }

  // V3 Plano 20 — verificação de copyright (AcoustID) roda depois da
  // resposta do upload, em background. Best-effort: nunca lança, nunca
  // atrasa/bloqueia o upload. Resultado é só um aviso pro moderador.
  after(() => runCopyrightCheck(track.id))

  return track
}

// ============================================================
// Lista as músicas enviadas pelo próprio artista (qualquer status)
// ============================================================

// ============================================================
// Lista as músicas publicadas de um artista — usado no perfil
// (próprio e público)
// ============================================================

export async function listPublishedTracksByArtist(artistId: string) {
  const tracks = await prisma.track.findMany({
    where: { artistId, published: true },
    orderBy: { publishedAt: 'desc' },
    select: {
      id: true,
      slug: true,
      title: true,
      genre: true,
      coverUrl: true,
      producerName: true,
      publishedAt: true,
      _count: { select: { likes: true } },
    },
  })

  return tracks.map(({ _count, ...track }) => ({
    ...track,
    likeCount: _count.likes,
  }))
}

export async function listMySubmissions(userId: string) {
  return prisma.track.findMany({
    where: { submittedById: userId },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      slug: true,
      title: true,
      genre: true,
      coverUrl: true,
      published: true,
      publishedAt: true,
      downloadCount: true,
      createdAt: true,
      scheduledAt: true,
    },
  })
}
