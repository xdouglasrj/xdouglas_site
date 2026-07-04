import { NextRequest } from 'next/server'
import { withRole, apiSuccess } from '@/lib/auth/guard'
import { prisma } from '@/lib/prisma'
import { listArtistSeriesOptions } from '@/lib/tracks/series'

// ============================================================
// GET /api/musicas/series (V3 Plano 14) — séries do próprio artista para o
// select do upload, com o próximo nº de episódio sugerido. Se o usuário ainda
// não tem perfil de artista, devolve lista vazia (não cria nada num GET).
// ============================================================

export const GET = withRole('GUEST', async (_req: NextRequest, auth) => {
  const artist = await prisma.artist.findUnique({
    where: { userId: auth.userId },
    select: { id: true },
  })
  if (!artist) return apiSuccess({ series: [] })

  const series = await listArtistSeriesOptions(artist.id)
  return apiSuccess({ series })
})
