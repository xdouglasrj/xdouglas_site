import { prisma } from '@/lib/prisma'
import { z } from 'zod'

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
  key: z.string().max(10).optional(),
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

  const track = await prisma.track.update({
    where: { id },
    data: {
      ...input,
      // Se publicar agora pela primeira vez, registra o momento
      publishedAt:
        input.published && !before?.published ? new Date() : undefined,
      // Nunca zera publishedAt se já estava publicado
    },
    select: { id: true, slug: true, title: true, published: true },
  })

  await prisma.auditLog.create({
    data: {
      userId,
      action: 'TRACK_UPDATE',
      entityId: id,
      entityType: 'track',
      metadata: { before, after: input },
    },
  })

  return track
}

export async function togglePublish(id: string, publish: boolean, userId: string) {
  const track = await prisma.track.update({
    where: { id },
    data: {
      published: publish,
      publishedAt: publish ? new Date() : undefined,
    },
    select: { id: true, title: true, published: true },
  })

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
