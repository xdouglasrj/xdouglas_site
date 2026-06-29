import { NextRequest } from 'next/server'
import { withRole, apiSuccess, apiError } from '@/lib/auth/guard'
import { getOrCreateArtistProfile } from '@/lib/tracks/artist-queries'
import { getOrCreateSchedulingToken } from '@/lib/tracks/scheduling'

// ============================================================
// POST /api/musicas/agendamentos/link
// Gera (ou retorna) o link particular do artista para visualizar
// suas próprias músicas agendadas, sem precisar logar.
// ============================================================

export const POST = withRole('ARTIST', async (request: NextRequest, auth) => {
  try {
    const artist = await getOrCreateArtistProfile(auth.userId)
    const token = await getOrCreateSchedulingToken(artist.id)
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? request.nextUrl.origin
    const url = `${baseUrl.replace(/\/$/, '')}/agendamentos/${token}`

    return apiSuccess({ token, url })
  } catch (err) {
    console.error('[API POST /musicas/agendamentos/link]', err)
    return apiError('Erro ao gerar link de agendamentos', 500, 'LINK_ERROR')
  }
})
