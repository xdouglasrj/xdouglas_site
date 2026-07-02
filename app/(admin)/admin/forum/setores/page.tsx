import type { Metadata } from 'next'
import { listAllSectors } from '@/lib/forum/forum'
import { SectorsManager } from './sectors-manager'

export const metadata: Metadata = { title: 'Setores do fórum' }
export const dynamic = 'force-dynamic'

export default async function AdminForumSetoresPage() {
  const sectors = await listAllSectors()

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-xl font-semibold text-white">Setores do fórum</h1>
        <p className="text-sm text-neutral-500 mt-0.5">
          {sectors.length} setor{sectors.length !== 1 ? 'es' : ''} cadastrado{sectors.length !== 1 ? 's' : ''}
        </p>
      </div>

      <SectorsManager
        initialSectors={sectors.map((s) => ({
          id: s.id,
          slug: s.slug,
          name: s.name,
          description: s.description,
          order: s.order,
          onlyAdminPost: s.onlyAdminPost,
          active: s.active,
          threadCount: s._count.threads,
        }))}
      />
    </div>
  )
}
