import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { after } from 'next/server'
import { isValidMood, normalizeTag, MAX_TAGS } from './moods'
import { isValidTrackKind, DEFAULT_TRACK_KIND } from './track-kinds'
import { addPoints } from '@/lib/points/points-service'
import { createNotification } from '@/lib/notifications/notifications'
import { saveTracklistFromText } from './tracklist-writer'
import { runCopyrightCheck } from './copyright-check'

// Pontua TRACK_PUBLISHED só quando a faixa vira pública pela primeira vez
// e foi enviada por um artista (não músicas cadastradas direto pelo admin)
async function awardPublishPointsIfNeeded(trackId: string, wasPublished: boolean | undefined, isPublished: boolean) {
  if (wasPublished || !isPublished) return

  const track = await prisma.track.findUnique({
    where: { id: trackId },
    select: { submittedById: true, title: true, slug: true },
  })
  if (!track?.submittedById) return

  addPoints(track.submittedById, 'TRACK_PUBLISHED').catch((err) =>
    console.error('[Track] Falha ao registrar pontos de publicação', err)
  )

  createNotification({
    userId: track.submittedById,
    type: 'musica_publicada',
    payload: { trackTitle: track.title, trackSlug: track.slug },
  }).catch((err) => console.error('[Track] Falha ao criar notificação de publicação', err))
}

// ============================================================
// Schemas de validação
// ============================================================

export const createTrackSchema = z.object({
  title: z.string().min(1, 'Título obrigatório').max(200),
  artistId: z.string().uuid('Artista obrigatório'),
  producerName: z.string().max(200).optional(),
  description: z.string().max(2000).optional(),
  genre: z.string().max(100).optional(),
  bpm: z.number().int().min(40).max(300).optional(),
  key: z.string().max(20).optional(),
  // V3 Plano 5 — metadados DJ (tudo opcional; null limpa o campo na edição)
  mood: z.string().max(40).refine((v) => isValidMood(v), 'Mood inválido').nullable().optional(),
  tags: z
    .array(z.string().max(40))
    .max(MAX_TAGS, `Máximo de ${MAX_TAGS} tags`)
    .transform((arr) => [...new Set(arr.map(normalizeTag).filter(Boolean))])
    .optional(),
  durationSeconds: z.number().int().positive().max(24 * 60 * 60).optional(),
  // V3 Plano 16 — tipo de upload (Música / Set-Mix / Podcast). Default Música.
  kind: z.string().refine((v) => isValidTrackKind(v), 'Tipo inválido').default(DEFAULT_TRACK_KIND),
  // V3 Plano 10 — tracklist do set colada como texto (parseada no servidor).
  // null/"" limpa; undefined não mexe. Não é coluna de Track — tratada à parte.
  tracklistText: z.string().max(20000).nullable().optional(),
  // V3 Plano 12 — modo de download: "free" (qualquer conta) ou "follow"
  // (exige seguir o dono). Validado no servidor — só aceita esses dois valores.
  downloadMode: z.enum(['free', 'follow']).default('free'),
  audioKey: z.string().min(1, 'Arquivo de áudio obrigatório'),
  audioFormat: z.enum(['mp3', 'wav', 'flac', 'aiff']),
  audioSizeBytes: z.number().positive().optional(),
  coverKey: z.string().optional(),
  coverUrl: z.string().url().optional(),
  published: z.boolean().default(false),
})

export const updateTrackSchema = createTrackSchema.partial().omit({ audioKey: true, audioFormat: true })

export type CreateTrackInput = z.infer<typeof createTrackSchema>
export type UpdateTrackInput = z.infer<typeof updateTrackSchema>

// ============================================================
// Helpers
// ============================================================

/** Gera slug único a partir do título */
export async function generateUniqueSlug(title: string): Promise<string> {
  const base = title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove acentos
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 80)

  // Verifica colisão e adiciona sufixo numérico se necessário
  let slug = base
  let attempt = 0
  while (true) {
    const existing = await prisma.track.findUnique({
      where: { slug },
      select: { id: true },
    })
    if (!existing) return slug
    attempt++
    slug = `${base}-${attempt}`
  }
}

// ============================================================
// Queries de escrita
// ============================================================

export async function adminListTracks() {
  return prisma.track.findMany({
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      slug: true,
      title: true,
      genre: true,
      audioFormat: true,
      published: true,
      publishedAt: true,
      downloadCount: true,
      coverUrl: true,
      createdAt: true,
      artist: { select: { id: true, name: true } },
      copyrightStatus: true,
      copyrightResult: true,
    },
  })
}

export async function adminGetTrack(id: string) {
  return prisma.track.findUnique({
    where: { id },
    select: {
      id: true,
      slug: true,
      title: true,
      description: true,
      genre: true,
      bpm: true,
      key: true,
      mood: true,
      tags: true,
      durationSeconds: true,
      kind: true,
      downloadMode: true,
      producerName: true,
      audioKey: true,
      audioFormat: true,
      audioSizeBytes: true,
      coverKey: true,
      coverUrl: true,
      published: true,
      publishedAt: true,
      downloadCount: true,
      artistId: true,
      artist: { select: { id: true, name: true, slug: true } },
      copyrightStatus: true,
      copyrightResult: true,
      copyrightAt: true,
    },
  })
}

export async function createTrack(input: CreateTrackInput, userId: string) {
  const slug = await generateUniqueSlug(input.title)

  const track = await prisma.track.create({
    data: {
      slug,
      title: input.title,
      artistId: input.artistId,
      producerName: input.producerName,
      description: input.description,
      genre: input.genre,
      bpm: input.bpm,
      key: input.key,
      mood: input.mood,
      tags: input.tags ?? [],
      durationSeconds: input.durationSeconds,
      kind: input.kind,
      downloadMode: input.downloadMode,
      audioKey: input.audioKey,
      audioFormat: input.audioFormat,
      audioSizeBytes: input.audioSizeBytes ? BigInt(input.audioSizeBytes) : null,
      coverKey: input.coverKey,
      coverUrl: input.coverUrl,
      published: input.published,
      publishedAt: input.published ? new Date() : null,
    },
    select: { id: true, slug: true, title: true },
  })

  // V3 Plano 10 — grava a tracklist (se enviada) após criar a faixa
  await saveTracklistFromText(track.id, input.tracklistText)

  // Audit log
  await prisma.auditLog.create({
    data: {
      userId,
      action: 'TRACK_CREATE',
      entityId: track.id,
      entityType: 'track',
      metadata: { title: track.title, slug: track.slug },
    },
  })

  // V3 Plano 20 — verificação de copyright (AcoustID), best-effort, roda
  // depois da resposta. Admin também recebe o aviso (é só informativo,
  // o admin é o dono da decisão de publicar).
  after(() => runCopyrightCheck(track.id))

  return track
}

export async function updateTrack(
  id: string,
  input: UpdateTrackInput,
  userId: string
) {
  // Captura estado anterior para o diff no audit log
  const before = await prisma.track.findUnique({
    where: { id },
    select: { title: true, published: true },
  })

  // tracklistText não é coluna de Track — separa do resto antes do update
  const { tracklistText, ...trackData } = input

  const track = await prisma.track.update({
    where: { id },
    data: {
      ...trackData,
      // Se publicar agora pela primeira vez, registra o momento
      publishedAt:
        input.published && !before?.published ? new Date() : undefined,
      // Nunca zera publishedAt se já estava publicado
    },
    select: { id: true, slug: true, title: true, published: true },
  })

  // V3 Plano 10 — atualiza a tracklist (só se o campo foi enviado)
  await saveTracklistFromText(id, tracklistText)

  await prisma.auditLog.create({
    data: {
      userId,
      action: 'TRACK_UPDATE',
      entityId: id,
      entityType: 'track',
      metadata: { before, after: input },
    },
  })

  await awardPublishPointsIfNeeded(id, before?.published, track.published)

  return track
}

export async function togglePublish(id: string, publish: boolean, userId: string) {
  const before = await prisma.track.findUnique({ where: { id }, select: { published: true } })

  const track = await prisma.track.update({
    where: { id },
    data: {
      published: publish,
      publishedAt: publish ? new Date() : undefined,
    },
    select: { id: true, title: true, published: true },
  })

  await awardPublishPointsIfNeeded(id, before?.published, track.published)

  await prisma.auditLog.create({
    data: {
      userId,
      action: 'TRACK_UPDATE',
      entityId: id,
      entityType: 'track',
      metadata: { action: publish ? 'publish' : 'unpublish' },
    },
  })

  return track
}

export async function togglePin(id: string, pinned: boolean, userId: string) {
  const track = await prisma.track.update({
    where: { id },
    data: {
      pinned,
      pinnedAt: pinned ? new Date() : null,
    },
    select: { id: true, title: true, pinned: true },
  })

  await prisma.auditLog.create({
    data: {
      userId,
      action: 'TRACK_UPDATE',
      entityId: id,
      entityType: 'track',
      metadata: { action: pinned ? 'pin' : 'unpin' },
    },
  })

  return track
}

export async function cancelSchedule(id: string, userId: string) {
  const track = await prisma.track.update({
    where: { id },
    data: { scheduledAt: null },
    select: { id: true, title: true, scheduledAt: true },
  })

  await prisma.auditLog.create({
    data: {
      userId,
      action: 'TRACK_UPDATE',
      entityId: id,
      entityType: 'track',
      metadata: { action: 'cancelSchedule' },
    },
  })

  return track
}

export async function deleteTrack(id: string, userId: string) {
  const track = await prisma.track.findUnique({
    where: { id },
    select: { title: true, audioKey: true, coverKey: true },
  })

  if (!track) throw new Error('Música não encontrada')

  await prisma.track.delete({ where: { id } })

  await prisma.auditLog.create({
    data: {
      userId,
      action: 'TRACK_DELETE',
      entityId: id,
      entityType: 'track',
      metadata: { title: track.title, audioKey: track.audioKey },
    },
  })

  // Retorna as chaves para que o chamador possa deletar do R2 se quiser
  return { audioKey: track.audioKey, coverKey: track.coverKey }
}
