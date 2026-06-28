import { NextRequest } from 'next/server'
import { withAuth, apiSuccess, apiError } from '@/lib/auth/guard'
import { prisma } from '@/lib/prisma'

// GET /api/store/targets?itemKey=FEATURE_TRACK
// Lista os alvos que o usuário pode escolher pra usar um item AWAITING_USE
// (faixas próprias, comentários nas próprias músicas, posts próprios)
export const GET = withAuth(async (request: NextRequest, auth) => {
  const itemKey = request.nextUrl.searchParams.get('itemKey')

  if (itemKey === 'FEATURE_TRACK') {
    const artist = await prisma.artist.findUnique({ where: { userId: auth.userId }, select: { id: true } })
    if (!artist) return apiSuccess({ targets: [] })
    const tracks = await prisma.track.findMany({
      where: { artistId: artist.id, published: true },
      select: { id: true, title: true },
      orderBy: { title: 'asc' },
    })
    return apiSuccess({ targets: tracks.map((t) => ({ id: t.id, label: t.title })) })
  }

  if (itemKey === 'PIN_TRACK_COMMENT') {
    const artist = await prisma.artist.findUnique({ where: { userId: auth.userId }, select: { id: true } })
    if (!artist) return apiSuccess({ targets: [] })
    const comments = await prisma.trackComment.findMany({
      where: { track: { artistId: artist.id } },
      select: { id: true, content: true, track: { select: { title: true } } },
      orderBy: { createdAt: 'desc' },
      take: 100,
    })
    return apiSuccess({
      targets: comments.map((c) => ({ id: c.id, label: `"${c.content.slice(0, 60)}" — ${c.track.title}` })),
    })
  }

  if (itemKey === 'PIN_FEED_POST') {
    const posts = await prisma.post.findMany({
      where: { authorId: auth.userId },
      select: { id: true, content: true },
      orderBy: { createdAt: 'desc' },
      take: 50,
    })
    return apiSuccess({ targets: posts.map((p) => ({ id: p.id, label: p.content.slice(0, 80) })) })
  }

  return apiError('Item não exige escolha de alvo', 400, 'NOT_APPLICABLE')
})
