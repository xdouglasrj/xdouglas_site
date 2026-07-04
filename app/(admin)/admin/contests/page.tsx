import type { Metadata } from 'next'
import { prisma } from '@/lib/prisma'
import { listAllContestsForAdmin } from '@/lib/contests/contests'
import { ContestsPanel } from './contests-panel'

export const metadata: Metadata = { title: 'Concursos' }
export const dynamic = 'force-dynamic'

export default async function AdminContestsPage() {
  const [contests, artists] = await Promise.all([
    listAllContestsForAdmin(),
    prisma.artist.findMany({ where: { active: true }, orderBy: { name: 'asc' }, select: { id: true, name: true } }),
  ])

  const initialContests = contests.map((c) => ({
    id: c.id,
    slug: c.slug,
    title: c.title,
    prizePoints: c.prizePoints,
    deadline: c.deadline.toISOString(),
    published: c.published,
    entryCount: c._count.entries,
    hostArtist: c.hostArtist,
  }))

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-white">Concursos</h1>
        <p className="text-sm text-neutral-500 mt-1 max-w-xl">
          Concursos de remix — prêmio em pontos da loja + destaque de 7 dias na faixa vencedora.
          Sem dinheiro/cripto. Só o admin cria contests nesta versão.
        </p>
      </div>

      <ContestsPanel initialContests={initialContests} artists={artists} />
    </div>
  )
}
