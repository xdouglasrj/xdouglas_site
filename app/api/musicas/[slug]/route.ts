import { NextRequest, NextResponse } from 'next/server'
import { getTrackBySlug } from '@/lib/tracks/queries'

// ============================================================
// GET /api/musicas/[slug]
// ============================================================

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
): Promise<NextResponse> {
  const { slug } = await params

  const track = await getTrackBySlug(slug)

  if (!track) {
    return NextResponse.json(
      { error: 'Música não encontrada', code: 'NOT_FOUND' },
      { status: 404 }
    )
  }

  return NextResponse.json(
    { track },
    {
      headers: {
        'Cache-Control': 'public, s-maxage=120, stale-while-revalidate=600',
      },
    }
  )
}
