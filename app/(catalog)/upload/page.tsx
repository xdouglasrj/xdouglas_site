import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { listMySubmissions } from '@/lib/tracks/artist-queries'
import { getAccessToken } from '@/lib/auth/cookies'
import { verifyAccessToken } from '@/lib/auth/jwt'
import { getUploadLimits } from '@/lib/settings/upload-limits'
import { publishDueScheduledTracks } from '@/lib/tracks/scheduling'
import Link from 'next/link'
import { ArtistTrackForm } from '@/components/upload/artist-track-form'
import { SchedulingLinkButton } from '@/components/upload/scheduling-link-button'
import { prisma } from '@/lib/prisma'
import { isContestOpen } from '@/lib/contests/contests'

export const metadata: Metadata = {
  title: 'Upload de música',
  robots: { index: false, follow: false },
}
export const dynamic = 'force-dynamic'

interface UploadPageProps {
  searchParams: Promise<{ contestId?: string }>
}

export default async function UploadPage({ searchParams }: UploadPageProps) {
  const { contestId: contestIdParam } = await searchParams
  const token = await getAccessToken()
  if (!token) redirect('/inicio')
  const payload = token ? await verifyAccessToken(token) : null

  await publishDueScheduledTracks().catch((err) =>
    console.error('[UploadPage] Falha ao publicar agendamentos vencidos', err)
  )

  const submissions = payload ? await listMySubmissions(payload.userId) : []
  const { musicMaxSizeMb } = await getUploadLimits()

  // V3 Plano 6 — quando vem de "Participar" num concurso (/contests/[slug]),
  // valida no servidor que o concurso existe, está publicado e no prazo
  // ANTES de oferecer o formulário vinculado. Se inválido, cai no upload
  // normal (sem contestId) em vez de travar a página.
  let contest: { id: string; title: string } | null = null
  if (contestIdParam) {
    const found = await prisma.contest.findUnique({
      where: { id: contestIdParam },
      select: { id: true, title: true, published: true, deadline: true },
    })
    if (found && isContestOpen(found)) {
      contest = { id: found.id, title: found.title }
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-8 py-8 sm:py-12">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">
          {contest ? `Participar — ${contest.title}` : 'Upload de música'}
        </h1>
        <p className="mt-1 text-sm text-gate-blue">
          {contest
            ? 'Envie sua faixa para participar do concurso. Ela também passa pela revisão normal da equipe antes de aparecer no catálogo público.'
            : 'Envie sua faixa para revisão. Ela só aparece no catálogo depois de aprovada pela equipe. Você pode enviar até 5 músicas por vez e agendar o lançamento automático para até 15 dias no futuro.'}
        </p>
      </div>

      {!contest && (
        <>
          <div className="mb-8">
            <SchedulingLinkButton />
            <p className="mt-1.5 text-xs text-gate-blue">
              Link particular para você (e a equipe) acompanhar suas músicas agendadas, sem precisar logar.
            </p>
          </div>

          <div className="mb-8">
            <Link
              href="/minhas-musicas/eventos"
              className="inline-block rounded-lg border border-gate-azure px-4 py-2 text-xs font-semibold text-white transition hover:border-gate-pink hover:text-gate-pink"
            >
              Gerenciar meus eventos (agenda)
            </Link>
          </div>
        </>
      )}

      <ArtistTrackForm
        maxAudioSizeMb={musicMaxSizeMb}
        contestId={contest?.id}
        contestTitle={contest?.title}
      />

      {submissions.length > 0 && (
        <section className="mt-12">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gate-blue">
            Meus envios
          </h2>
          <div className="rounded-xl border border-gate-azure bg-white/5 overflow-hidden">
            <ul className="divide-y divide-gate-azure">
              {submissions.map((track) => (
                <li key={track.id} className="flex items-center justify-between px-4 py-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-white truncate">{track.title}</p>
                    <p className="text-xs text-gate-blue">
                      {new Date(track.createdAt).toLocaleDateString('pt-BR', {
                        day: '2-digit', month: '2-digit', year: 'numeric',
                      })}
                      {track.genre && ` · ${track.genre}`}
                    </p>
                  </div>
                  {track.published ? (
                    <span className="inline-flex shrink-0 items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-950/60 text-emerald-400 border border-emerald-800/60">
                      Publicada
                    </span>
                  ) : track.scheduledAt ? (
                    <span className="inline-flex shrink-0 items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-violet-950/60 text-violet-400 border border-violet-800/60">
                      Agendada · {new Date(track.scheduledAt).toLocaleDateString('pt-BR', {
                        day: '2-digit', month: '2-digit',
                      })} {new Date(track.scheduledAt).toLocaleTimeString('pt-BR', {
                        hour: '2-digit', minute: '2-digit',
                      })}
                    </span>
                  ) : (
                    <span className="inline-flex shrink-0 items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-neutral-800 text-neutral-400 border border-neutral-700">
                      Em análise
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}
    </div>
  )
}
