import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { normalizeSchedulingToken } from '@/lib/tracks/scheduling'

// ============================================================
// GET /api/agendamentos/[token]
// Consulta pública (sem login) das músicas agendadas de um artista —
// quem tem o link vê a lista, mesmo padrão de /api/invites/[code].
// ============================================================

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
): Promise<NextResponse> {
  const { token } = await params
  const normalized = normalizeSchedulingToken(token)

  const artist = await prisma.artist.findUnique({
    where: { schedulingToken: normalized },
    select: {
      name: true,
      tracks: {
        where: { scheduledAt: { not: null } },
        orderBy: { scheduledAt: 'asc' },
        select: {
          id: true,
          title: true,
          coverUrl: true,
          genre: true,
          published: true,
          scheduledAt: true,
        },
      },
    },
  })

  if (!artist) {
    return NextResponse.json(
      { error: 'Link de agendamentos inválido.', code: 'INVALID_TOKEN' },
      { status: 404 }
    )
  }

  return NextResponse.json({
    artistName: artist.name,
    tracks: artist.tracks.map((t) => ({
      ...t,
      scheduledAt: t.scheduledAt?.toISOString() ?? null,
    })),
  })
}
