import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getCurrentUserBasics } from '@/lib/auth/current-user'
import { listMySubmissions } from '@/lib/tracks/artist-queries'
import { publishDueScheduledTracks } from '@/lib/tracks/scheduling'

export const metadata: Metadata = {
  title: 'Minhas músicas',
  robots: { index: false, follow: false },
}
export const dynamic = 'force-dynamic'

export default async function MinhasMusicasPage() {
  const user = await getCurrentUserBasics()
  const canAccess = user?.mappingEnabled || user?.role === 'ADMIN'

  if (!user || !canAccess) redirect('/inicio')

  await publishDueScheduledTracks().catch((err) =>
    console.error('[MinhasMusicasPage] Falha ao publicar agendamentos vencidos', err)
  )

  const submissions = await listMySubmissions(user.id)

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-8 py-8 sm:py-12">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Minhas músicas</h1>
        <p className="mt-1 text-sm text-gate-blue">
          Estatísticas de reprodução, downloads e localização de quem ouve suas faixas.
        </p>
      </div>

      {submissions.length === 0 ? (
        <p className="text-sm text-gate-blue">Você ainda não enviou nenhuma faixa.</p>
      ) : (
        <div className="rounded-xl border border-gate-azure bg-white/5 overflow-hidden">
          <ul className="divide-y divide-gate-azure">
            {submissions.map((track) => (
              <li key={track.id}>
                <Link
                  href={`/minhas-musicas/${track.id}`}
                  className="flex items-center justify-between px-4 py-3 hover:bg-white/5 transition-colors"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-white truncate">{track.title}</p>
                    <p className="text-xs text-gate-blue">
                      {track.downloadCount.toLocaleString('pt-BR')} downloads
                      {track.genre && ` · ${track.genre}`}
                    </p>
                  </div>
                  {track.published ? (
                    <span className="inline-flex shrink-0 items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-950/60 text-emerald-400 border border-emerald-800/60">
                      Publicada
                    </span>
                  ) : (
                    <span className="inline-flex shrink-0 items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-neutral-800 text-neutral-400 border border-neutral-700">
                      Em análise
                    </span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
