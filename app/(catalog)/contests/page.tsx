import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { listPublishedContests } from '@/lib/contests/contests'
import { getStorage } from '@/lib/storage'
import { ContestCountdown } from '@/components/contests/contest-countdown'

export const revalidate = 60

export const metadata: Metadata = {
  title: 'Concursos de remix',
  description: 'Participe dos concursos de remix do xDouglas — prêmios em pontos e destaque no catálogo.',
  robots: { index: true, follow: true },
}

export default async function ContestsPage() {
  const contests = await listPublishedContests()
  const storage = getStorage()

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-8 py-8 sm:py-12">
      <h1 className="text-2xl font-bold text-white">Concursos de remix</h1>
      <p className="mt-2 text-sm text-gate-blue">
        Participe enviando sua faixa. Prêmios em pontos da loja + destaque no catálogo por 7 dias
        para os vencedores — sem dinheiro/cripto envolvido.
      </p>

      <div className="mt-6 space-y-3">
        {contests.length === 0 && (
          <p className="text-sm text-gate-blue">Nenhum concurso ativo no momento.</p>
        )}
        {contests.map((contest) => (
          <Link
            key={contest.id}
            href={`/contests/${contest.slug}`}
            className="flex items-center gap-4 rounded-xl border border-gate-azure bg-white/5 p-4 transition hover:border-gate-pink"
          >
            <div className="relative w-16 h-16 shrink-0 rounded-lg overflow-hidden bg-white/5 border border-gate-azure">
              {contest.coverKey ? (
                <Image
                  src={storage.getPublicUrl(contest.coverKey)}
                  alt={contest.title}
                  fill
                  sizes="64px"
                  className="object-cover"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-2xl">🏆</div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-white truncate">{contest.title}</p>
              <p className="text-xs text-gate-blue">
                {contest.hostArtist ? `Hospedado por ${contest.hostArtist.name} · ` : ''}
                {contest.entryCount} submissõe{contest.entryCount === 1 ? '' : 's'}
                {contest.prizePoints > 0 && ` · ${contest.prizePoints} pts de prêmio`}
              </p>
            </div>
            <ContestCountdown deadline={contest.deadline.toISOString()} compact />
          </Link>
        ))}
      </div>
    </div>
  )
}
