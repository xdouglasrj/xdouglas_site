import type { Metadata } from 'next'
import { getUserStatsPanel } from '@/lib/admin/user-stats'
import { UserStatsPanel } from './user-stats-panel'

export const metadata: Metadata = { title: 'Usuários' }
export const dynamic = 'force-dynamic'

export default async function AdminUsuariosPage() {
  const userStats = await getUserStatsPanel()

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-xl font-semibold text-white">Usuários</h1>
        <p className="text-sm text-neutral-500 mt-0.5">
          {userStats.length} usuário{userStats.length !== 1 ? 's' : ''} com atividade
        </p>
      </div>

      <UserStatsPanel rows={userStats} />
    </div>
  )
}
