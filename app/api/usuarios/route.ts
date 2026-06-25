import { NextRequest, NextResponse } from 'next/server'
import { searchUsers } from '@/lib/social/search'

// ============================================================
// GET /api/usuarios?q=
// Busca pessoas/artistas pelo @handle ou nome.
// ============================================================

export async function GET(request: NextRequest): Promise<NextResponse> {
  const { searchParams } = request.nextUrl
  const q = searchParams.get('q') ?? ''

  const users = await searchUsers(q)

  return NextResponse.json({ users })
}
