import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// ============================================================
// GET /api/generos — árvore de gêneros ativos (categoria-mãe +
// subgêneros), usada pelo seletor hierárquico de upload/filtro
// ============================================================

export const revalidate = 300

export async function GET() {
  const genres = await prisma.genre.findMany({
    where: { active: true },
    orderBy: [{ order: 'asc' }, { name: 'asc' }],
    select: { id: true, slug: true, name: true, parentId: true },
  })

  const parents = genres.filter((g) => !g.parentId)
  const tree = parents.map((parent) => ({
    ...parent,
    children: genres.filter((g) => g.parentId === parent.id),
  }))

  return NextResponse.json({ genres: tree })
}
