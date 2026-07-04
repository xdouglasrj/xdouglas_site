import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { getContestBySlug, listContestSubmissions, isContestOpen } from '@/lib/contests/contests'
import { getStorage } from '@/lib/storage'
import { getCurrentUserBasics } from '@/lib/auth/current-user'
import { prisma } from '@/lib/prisma'
import { ContestCountdown } from '@/components/contests/contest-countdown'
import { ContestEnterButton } from '@/components/contests/contest-enter-button'
import { ContestStemsButton } from '@/components/contests/contest-stems-button'
import { ContestTabs } from '@/components/contests/contest-tabs'
import { ContestSubmissions } from '@/components/contests/contest-submissions'

export const revalidate = 30

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const contest = await getContestBySlug(slug)
  if (!contest) return { title: 'Concurso não encontrado' }

  return {
    title: `${contest.title} — Concursos`,
    description: contest.description.slice(0, 160),
    robots: { index: true, follow: true },
  }
}

export default async function ContestDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const [contest, viewer] = await Promise.all([getContestBySlug(slug), getCurrentUserBasics()])

  if (!contest) notFound()

  const [entries, alreadyEntered] = await Promise.all([
    listContestSubmissions(contest.id),
    viewer
      ? prisma.contestEntry
          .findUnique({ where: { contestId_userId: { contestId: contest.id, userId: viewer.id } }, select: { id: true } })
          .then((e) => !!e)
      : Promise.resolve(false),
  ])

  const storage = getStorage()
  const isOpen = isContestOpen(contest)

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: contest.title,
    description: contest.description,
    startDate: contest.createdAt,
    endDate: contest.deadline,
    eventStatus: isOpen ? 'https://schema.org/EventScheduled' : 'https://schema.org/EventCompleted',
    image: contest.coverKey ? storage.getPublicUrl(contest.coverKey) : undefined,
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-8 py-8 sm:py-12">
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <nav className="mb-6 text-sm text-gate-blue" aria-label="Navegação">
        <Link href="/contests" className="hover:text-white transition-colors">Concursos</Link>
        <span className="mx-2">/</span>
        <span className="text-white/70 truncate">{contest.title}</span>
      </nav>

      {/* Banner */}
      <div className="relative w-full aspect-[3/1] rounded-xl overflow-hidden bg-white/5 border border-gate-azure mb-6">
        {contest.coverKey ? (
          <Image
            src={storage.getPublicUrl(contest.coverKey)}
            alt={contest.title}
            fill
            sizes="(max-width: 768px) 100vw, 768px"
            className="object-cover"
            priority
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-5xl">🏆</div>
        )}
      </div>

      <div className="flex flex-col gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">{contest.title}</h1>
          {contest.hostArtist && (
            <p className="mt-1 text-sm text-gate-blue">
              Hospedado por{' '}
              <Link href={`/artista/${contest.hostArtist.slug}`} className="hover:text-white transition-colors">
                {contest.hostArtist.name}
              </Link>
            </p>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <ContestCountdown deadline={contest.deadline.toISOString()} />
          <span className="text-xs text-gate-blue">
            Prazo final: {new Date(contest.deadline).toLocaleString('pt-BR', {
              day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
            })}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <ContestEnterButton
            contestId={contest.id}
            isLoggedIn={!!viewer}
            isOpen={isOpen}
            alreadyEntered={alreadyEntered}
          />
          {contest.stemsKey && (
            <ContestStemsButton contestId={contest.id} isLoggedIn={!!viewer} />
          )}
        </div>
      </div>

      <div className="mt-8">
        <ContestTabs
          submissionCount={entries.length}
          detailsContent={
            <div className="flex flex-col gap-6">
              <section>
                <h2 className="text-sm font-semibold uppercase tracking-wide text-gate-blue mb-2">Sobre</h2>
                <p className="text-sm text-white/80 leading-relaxed whitespace-pre-line">
                  {contest.description}
                </p>
              </section>

              {(contest.prizePoints > 0 || contest.prizeText) && (
                <section>
                  <h2 className="text-sm font-semibold uppercase tracking-wide text-gate-blue mb-2">Prêmios</h2>
                  <ul className="flex flex-col gap-1.5 text-sm text-white/80">
                    {contest.prizePoints > 0 && (
                      <li>🪙 {contest.prizePoints.toLocaleString('pt-BR')} pontos da loja</li>
                    )}
                    <li>⭐ Destaque da faixa vencedora por 7 dias no catálogo</li>
                    {contest.prizeText && <li>{contest.prizeText}</li>}
                  </ul>
                </section>
              )}
            </div>
          }
          submissionsContent={
            <ContestSubmissions
              submissions={entries.map((e) => ({
                id: e.id,
                winner: e.winner,
                track: e.track,
                user: e.user,
              }))}
            />
          }
        />
      </div>
    </div>
  )
}
