import type { Metadata } from 'next'
import { prisma } from '@/lib/prisma'
import { GenresPanel } from './genres-panel'

export const metadata: Metadata = { title: 'Gêneros' }
export const dynamic = 'force-dynamic'

export default async function AdminGenerosPage() {
  const genres = await prisma.genre.findMany({
    orderBy: [{ order: 'asc' }, { name: 'asc' }],
  })

  const parents = genres
    .filter((g) => !g.parentId)
    .map((parent) => ({
      ...parent,
      children: genres.filter((g) => g.parentId === parent.id),
    }))

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-white">Gêneros</h1>
        <p className="text-sm text-neutral-500 mt-1 max-w-xl">
          Catálogo hierárquico (categoria-mãe → subgêneros) usado no upload e no filtro de
          músicas. Editável sem deploy.
        </p>
      </div>

      <GenresPanel initialGenres={parents} />
    </div>
  )
}
