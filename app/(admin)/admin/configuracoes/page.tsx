import type { Metadata } from 'next'
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

      <SeedFictionalContentCard />
    </div>
  )
}
