import { NextRequest, NextResponse } from 'next/server'
import { listTracks, listGenres } from '@/lib/tracks/queries'

// ============================================================
// GET /api/musicas
// Parâmetros: page, perPage, genre, artistSlug
// ============================================================

export async function GET(request: NextRequest): Promise<NextResponse> {
  const { searchParams } = request.nextUrl

  const page = Math.max(1, Number(searchParams.get('page') ?? '1'))
  const perPage = Math.min(48, Math.max(1, Number(searchParams.get('perPage') ?? '24')))
  const genre = searchParams.get('genre') ?? undefined
  const artistSlug = searchParams.get('artistSlug') ?? undefined
  const q = searchParams.get('q') ?? undefined

  // Genres e tracks em paralelo
  const [result, genres] = await Promise.all([
    listTracks({ page, perPage, genre, artistSlug, q }),
    listGenres(),
  ])

  return NextResponse.json(
    { ...result, genres },
    {
      headers: {
        // Cache público: 60s no edge, revalidação em background
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
      },
    }
  )
}
