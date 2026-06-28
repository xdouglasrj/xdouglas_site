import type { Metadata } from 'next'
import Link from 'next/link'
import { getUploadLimits } from '@/lib/settings/upload-limits'
import { getContentExpirationHours } from '@/lib/settings/content-expiration'
import { getVinhetaKey, getVinhetaDownloadKey } from '@/lib/settings/vinheta'
import { UploadLimitsCard } from './upload-limits-card'
import { ContentExpirationCard } from './content-expiration-card'
import { VinhetaCard } from './vinheta-card'
import { SeedFictionalContentCard } from './seed-fictional-content-card'

export const metadata: Metadata = { title: 'Configurações' }
export const dynamic = 'force-dynamic'

export default async function AdminConfiguracoesPage() {
  const [limits, expirationHours, vinhetaKey, vinhetaDownloadKey] = await Promise.all([
    getUploadLimits(),
    getContentExpirationHours(),
    getVinhetaKey(),
    getVinhetaDownloadKey(),
  ])

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-white">Configurações</h1>
      </div>

      <UploadLimitsCard
        initialMusicMaxSizeMb={limits.musicMaxSizeMb}
        initialPodcastMaxSizeMb={limits.podcastMaxSizeMb}
        initialPodcastEnabled={limits.podcastEnabled}
      />

      <ContentExpirationCard initialHours={expirationHours} />

      <VinhetaCard initialVinhetaKey={vinhetaKey} initialVinhetaDownloadKey={vinhetaDownloadKey} />

      <Link
        href="/admin/configuracoes/permissoes"
        className="mt-6 block rounded-xl border border-amber-800/60 bg-amber-950/20 p-5 transition hover:bg-amber-950/30"
      >
        <h2 className="text-sm font-semibold text-white">Permissões de moderador (teste)</h2>
        <p className="mt-1 text-xs text-neutral-400 max-w-md">
          Página de revisão para acertar a lista de permissões antes de criar o papel de
          moderador de verdade. Busque um usuário e veja a grade de permissões — nada é
          salvo ainda.
        </p>
        <span className="mt-3 inline-block text-xs font-medium text-amber-300">Abrir →</span>
      </Link>

      <SeedFictionalContentCard />
    </div>
  )
}
