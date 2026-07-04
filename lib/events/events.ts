import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { createNotification } from '@/lib/notifications/notifications'

// ============================================================
// V3 Plano 18 — Eventos / agenda de apresentações do artista.
// v1 enxuta: SEM venda de ingresso, SEM RSVP. Server-only (Prisma).
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

export async function generateUniqueEventSlug(title: string): Promise<string> {
  const base = slugify(title) || 'evento'
  let slug = base
  let attempt = 0
  while (true) {
    const existing = await prisma.artistEvent.findUnique({ where: { slug }, select: { id: true } })
    if (!existing) return slug
    attempt++
    slug = `${base}-${attempt}`
  }
}

// ============================================================
// Validação de infoUrl — só http/https, nunca javascript:/data: etc.
// ============================================================

function isHttpUrl(value: string): boolean {
  try {
    const parsed = new URL(value)
    return parsed.protocol === 'http:' || parsed.protocol === 'https:'
  } catch {
    return false
  }
}

export const eventInputSchema = z.object({
  title: z.string().trim().min(1, 'Título obrigatório').max(200),
  venue: z.string().trim().max(200).optional().nullable(),
  city: z.string().trim().max(120).optional().nullable(),
  startsAt: z.coerce.date({ errorMap: () => ({ message: 'Data inválida' }) }),
  infoUrl: z
    .string()
    .trim()
    .max(500)
    .optional()
    .nullable()
    .refine((v) => !v || isHttpUrl(v), 'Link deve ser uma URL http(s) válida'),
  coverKey: z.string().max(500).optional().nullable(),
  published: z.boolean().optional(),
})

export type EventInput = z.infer<typeof eventInputSchema>

// ============================================================
// Criar / editar — notifica seguidores SÓ na transição para published
// (evita spam de edição: reenvios e alterações não notificam de novo).
// ============================================================

export async function createArtistEvent(artistId: string, input: EventInput) {
  const slug = await generateUniqueEventSlug(input.title)

  const event = await prisma.artistEvent.create({
    data: {
      slug,
      artistId,
      title: input.title,
      venue: input.venue || null,
      city: input.city || null,
      startsAt: input.startsAt,
      infoUrl: input.infoUrl || null,
      coverKey: input.coverKey || null,
      published: input.published ?? false,
    },
  })

  if (event.published) {
    await notifyFollowersOfNewEvent(event.id).catch((err) =>
      console.error('[ArtistEvent] Falha ao notificar seguidores', err)
    )
  }

  return event
}

export async function updateArtistEvent(eventId: string, input: Partial<EventInput>) {
  const existing = await prisma.artistEvent.findUnique({ where: { id: eventId } })
  if (!existing) throw new Error('Evento não encontrado')

  const wasPublished = existing.published

  const data: Record<string, unknown> = {}
  if (input.title !== undefined) data.title = input.title
  if (input.venue !== undefined) data.venue = input.venue || null
  if (input.city !== undefined) data.city = input.city || null
  if (input.startsAt !== undefined) data.startsAt = input.startsAt
  if (input.infoUrl !== undefined) data.infoUrl = input.infoUrl || null
  if (input.coverKey !== undefined) data.coverKey = input.coverKey || null
  if (input.published !== undefined) data.published = input.published

  const event = await prisma.artistEvent.update({ where: { id: eventId }, data })

  // Notifica seguidores só na TRANSIÇÃO false -> true (1 vez por evento).
  if (!wasPublished && event.published) {
    await notifyFollowersOfNewEvent(event.id).catch((err) =>
      console.error('[ArtistEvent] Falha ao notificar seguidores', err)
    )
  }

  return event
}

export async function deleteArtistEvent(eventId: string) {
  await prisma.artistEvent.delete({ where: { id: eventId } })
}

// ============================================================
// Notificação — segue o padrão de Follow (seguidores do userId do artista).
// Artista sem conta de usuário vinculada (userId null) não tem seguidores
// no modelo Follow — não faz nada nesse caso.
// ============================================================

async function notifyFollowersOfNewEvent(eventId: string): Promise<void> {
  const event = await prisma.artistEvent.findUnique({
    where: { id: eventId },
    select: {
      title: true,
      slug: true,
      artist: { select: { userId: true, name: true } },
    },
  })
  if (!event || !event.artist.userId) return

  const followers = await prisma.follow.findMany({
    where: { followingId: event.artist.userId },
    select: { followerId: true },
  })

  // allSettled: a falha de uma notificação (ex.: userId órfão, hiccup de rede)
  // NÃO pode impedir as demais seguidoras de serem entregues. Falhas são
  // logadas individualmente em vez de derrubar o lote inteiro.
  const results = await Promise.allSettled(
    followers.map((f) =>
      createNotification({
        userId: f.followerId,
        actorId: event.artist.userId,
        type: 'evento_publicado',
        payload: { eventTitle: event.title, eventSlug: event.slug, artistName: event.artist.name },
      })
    )
  )
  const failed = results.filter((r) => r.status === 'rejected')
  if (failed.length > 0) {
    console.error(
      `[Eventos] ${failed.length}/${followers.length} notificações de evento falharam`,
      (failed[0] as PromiseRejectedResult).reason
    )
  }
}

// ============================================================
// Queries públicas
// ============================================================

export interface ArtistEventPublic {
  id: string
  slug: string
  title: string
  venue: string | null
  city: string | null
  startsAt: string
  infoUrl: string | null
  coverKey: string | null
  artist: { id: string; slug: string; name: string; photoUrl: string | null }
}

const EVENT_SELECT = {
  id: true,
  slug: true,
  title: true,
  venue: true,
  city: true,
  startsAt: true,
  infoUrl: true,
  coverKey: true,
  artist: { select: { id: true, slug: true, name: true, photoUrl: true } },
} as const

function serializeEvent(e: {
  id: string
  slug: string
  title: string
  venue: string | null
  city: string | null
  startsAt: Date
  infoUrl: string | null
  coverKey: string | null
  artist: { id: string; slug: string; name: string; photoUrl: string | null }
}): ArtistEventPublic {
  return {
    id: e.id,
    slug: e.slug,
    title: e.title,
    venue: e.venue,
    city: e.city,
    startsAt: e.startsAt.toISOString(),
    infoUrl: e.infoUrl,
    coverKey: e.coverKey,
    artist: e.artist,
  }
}

/** Próximos eventos publicados de um artista (perfil). */
export async function listUpcomingEventsByArtist(artistId: string): Promise<ArtistEventPublic[]> {
  const events = await prisma.artistEvent.findMany({
    where: { artistId, published: true, startsAt: { gte: new Date() } },
    orderBy: { startsAt: 'asc' },
    select: EVENT_SELECT,
  })
  return events.map(serializeEvent)
}

/** Últimos eventos passados de um artista (seção "anteriores" colapsada). */
export async function listPastEventsByArtist(artistId: string, limit = 5): Promise<ArtistEventPublic[]> {
  const events = await prisma.artistEvent.findMany({
    where: { artistId, published: true, startsAt: { lt: new Date() } },
    orderBy: { startsAt: 'desc' },
    take: limit,
    select: EVENT_SELECT,
  })
  return events.map(serializeEvent)
}

/** Agenda pública geral (/eventos), com filtro opcional por artista. */
export async function listUpcomingEvents(opts: { artistSlug?: string } = {}): Promise<ArtistEventPublic[]> {
  const events = await prisma.artistEvent.findMany({
    where: {
      published: true,
      startsAt: { gte: new Date() },
      ...(opts.artistSlug ? { artist: { slug: opts.artistSlug } } : {}),
    },
    orderBy: { startsAt: 'asc' },
    select: EVENT_SELECT,
  })
  return events.map(serializeEvent)
}

/** Eventos nos próximos N dias, para o bloco "Agenda" da home. */
export async function listEventsWithinDays(days: number, limit = 5): Promise<ArtistEventPublic[]> {
  const now = new Date()
  const until = new Date(now.getTime() + days * 24 * 60 * 60 * 1000)

  const events = await prisma.artistEvent.findMany({
    where: { published: true, startsAt: { gte: now, lte: until } },
    orderBy: { startsAt: 'asc' },
    take: limit,
    select: EVENT_SELECT,
  })
  return events.map(serializeEvent)
}

/** Lista de artistas com evento futuro publicado, para o filtro de /eventos. */
export async function listArtistsWithUpcomingEvents(): Promise<Array<{ slug: string; name: string }>> {
  const events = await prisma.artistEvent.findMany({
    where: { published: true, startsAt: { gte: new Date() } },
    select: { artist: { select: { slug: true, name: true } } },
    distinct: ['artistId'],
  })
  return events.map((e) => e.artist)
}

// ============================================================
// Gestão (admin / área do músico) — inclui eventos futuros e passados,
// publicados ou não.
// ============================================================

export async function listEventsByArtistForManagement(artistId: string) {
  return prisma.artistEvent.findMany({
    where: { artistId },
    orderBy: { startsAt: 'desc' },
    select: {
      id: true,
      slug: true,
      title: true,
      venue: true,
      city: true,
      startsAt: true,
      infoUrl: true,
      published: true,
      createdAt: true,
    },
  })
}
