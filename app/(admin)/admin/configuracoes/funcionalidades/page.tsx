import type { Metadata } from 'next'
import Link from 'next/link'
import { getFeatureFlags } from '@/lib/settings/feature-flags'
import { FeatureFlagsPanel } from './feature-flags-panel'

export const metadata: Metadata = { title: 'Funcionalidades' }
export const dynamic = 'force-dynamic'

export default async function AdminFuncionalidadesPage() {
  const flags = await getFeatureFlags()

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <Link href="/admin/configuracoes" className="text-xs text-neutral-500 hover:text-neutral-300">
          ← Configurações
        </Link>
        <h1 className="text-xl font-semibold text-white mt-2">Funcionalidades</h1>
        <p className="text-sm text-neutral-500 mt-1 max-w-xl">
          Liga/desliga ações do site em tempo real, sem precisar de deploy. Desligar uma
          funcionalidade esconde o botão/formulário correspondente e bloqueia a API.
        </p>
      </div>

      <FeatureFlagsPanel initialFlags={flags} />
    </div>
  )
}
