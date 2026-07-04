import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { listContestSubmissions } from '@/lib/contests/contests'
import { ContestDetailPanel } from './contest-detail-panel'

export const metadata: Metadata = { title: 'Gerenciar concurso' }
export const dynamic = 'force-dynamic'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function AdminContestDetailPage({ params }: PageProps) {
  const { id } = await params

  const contest = await prisma.contest.findUnique({
    where: { id },
    include: { hostArtist: { select: { id: true, name: true } } },
  })
  if (!contest) notFound()

  const entries = await listContestSubmissions(id)

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-white">{contest.title}</h1>
        <p className="text-sm text-neutral-500 mt-1">
          {entries.length} submissões · prêmio {contest.prizePoints} pts
          {contest.hostArtist ? ` · host ${contest.hostArtist.name}` : ''}
        </p>
      </div>

      <ContestDetailPanel
        contestId={contest.id}
        entries={entries.map((e) => ({
          id: e.id,
          winner: e.winner,
          createdAt: e.createdAt.toISOString(),
          track: e.track,
          user: e.user,
        }))}
      />
    </div>
  )
}
