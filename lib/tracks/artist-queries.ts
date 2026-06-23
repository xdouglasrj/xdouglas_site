import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { generateUniqueSlug } from './admin-queries'

// ============================================================
// Schema de validação — envio de música pelo próprio artista
// ============================================================

export const submitTrackSchema = z.object({
  title: z.string().min(1, 'Título obrigatório').max(200),
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
    select: { name: true, username: true },
  })
  const name = user?.name?.trim() || user?.username?.trim() || 'Artista'
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
  const artist = await getOrCreateArtistProfile(userId)
  const slug = await generateUniqueSlug(input.title)

  return prisma.track.create({
    data: {
      slug,
      title: input.title,
      artistId: artist.id,
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
      submittedById: userId,
      published: false,
    },
    select: { id: true, slug: true, title: true, published: true, createdAt: true },
  })
}

// ============================================================
// Lista as músicas enviadas pelo próprio artista (qualquer status)
// ============================================================

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
    },
  })
}
