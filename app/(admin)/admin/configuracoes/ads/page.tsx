import type { Metadata } from 'next'
import Link from 'next/link'
import { getAdsSettings } from '@/lib/settings/ads'
import { AD_SLOTS } from '@/lib/ads/config'
import { AdsSettingsCard } from './ads-settings-card'

export const metadata: Metadata = { title: 'Publicidade' }
export const dynamic = 'force-dynamic'

export default async function AdminAdsPage() {
  const settings = await getAdsSettings()

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <Link href="/admin/configuracoes" className="text-xs text-neutral-500 hover:text-neutral-300">
          ← Configurações
        </Link>
        <h1 className="text-xl font-semibold text-white mt-2">Publicidade (ads)</h1>
        <p className="text-sm text-neutral-500 mt-1 max-w-xl">
          Liga/desliga os anúncios e configura os IDs de slot sem precisar de deploy.
          Exige também a env var <code className="text-neutral-400">NEXT_PUBLIC_ADS_ENABLED=true</code>{' '}
          — se ela estiver desligada em produção, este toggle não tem efeito (kill switch de
          infraestrutura, mais rápido que esperar um deploy reverter).
        </p>
      </div>

      <AdsSettingsCard
        initialEnabled={settings.enabled}
        initialSlots={settings.slots}
        slotDefinitions={AD_SLOTS}
      />
    </div>
  )
}
