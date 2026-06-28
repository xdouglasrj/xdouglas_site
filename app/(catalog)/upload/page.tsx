import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getCurrentRole } from '@/lib/auth/role'
import { listMySubmissions } from '@/lib/tracks/artist-queries'
import { getAccessToken } from '@/lib/auth/cookies'
import { verifyAccessToken } from '@/lib/auth/jwt'
import { getUploadLimits } from '@/lib/settings/upload-limits'
import { ArtistTrackForm } from '@/components/upload/artist-track-form'

export const metadata: Metadata = {
  title: 'Upload de música',
  robots: { index: false, follow: false },
}
export const dynamic = 'force-dynamic'

export default async function UploadPage() {
  const role = await getCurrentRole()
  const isArtist = role === 'ARTIST' || role === 'ARTIST_SUPPORTER' || role === 'ADMIN'

  // Exclusivo para músicos/produtores (e admin) — visitantes/membros comuns
  // não têm essa função
  if (!isArtist) redirect('/inicio')

  const token = await getAccessToken()
  const payload = token ? await verifyAccessToken(token) : null
  const submissions = payload ? await listMySubmissions(payload.userId) : []
  const { musicMaxSizeMb } = await getUploadLimits()

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-8 py-8 sm:py-12">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Upload de música</h1>
        <p className="mt-1 text-sm text-gate-blue">
          Envie sua faixa para revisão. Ela só aparece no catálogo depois de aprovada pela equipe.
        </p>
      </div>

      <ArtistTrackForm maxAudioSizeMb={musicMaxSizeMb} />

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
