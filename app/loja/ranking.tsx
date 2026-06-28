import Link from 'next/link'
import { Avatar } from '@/components/ui/avatar'
import { getLevelName } from '@/lib/points/levels'

interface RankedUser {
  id: string
  handle: string | null
  name: string | null
  artisticName: string | null
  photoUrl: string | null
  level: number
}

// XP nunca aparece aqui — só posição, nome e nível (que é o "título"
// público derivado do XP, ver app/perfil/[usuario]/page.tsx)
export function Ranking({
  users,
  viewerId,
  viewerRankPosition,
  viewerTotalXp,
}: {
  users: RankedUser[]
  viewerId: string
  viewerRankPosition: number
  viewerTotalXp: number
}) {
  const viewerInTop = users.some((u) => u.id === viewerId)

  return (
    <div className="mt-10">
      <h2 className="text-center text-sm font-bold uppercase tracking-widest text-gate-blue mb-4">Ranking</h2>
      <div className="max-w-md mx-auto rounded-lg border border-gate-azure bg-white/5 divide-y divide-gate-azure/40">
        {users.length === 0 ? (
          <p className="p-4 text-center text-xs text-white/40">Ainda não há ranking suficiente.</p>
        ) : (
          users.map((u, i) => (
            <Link
              key={u.id}
              href={u.handle ? `/perfil/${u.handle}` : '#'}
              className={`flex items-center gap-3 p-3 transition hover:bg-white/5 ${u.id === viewerId ? 'bg-gate-pink/10' : ''}`}
            >
              <span className="w-5 text-center text-sm font-bold text-white/40">{i + 1}</span>
              <Avatar photoUrl={u.photoUrl} alt={u.name ?? u.handle ?? ''} size={32} />
              <div className="flex-1">
                <p className="text-sm text-white">{u.artisticName || u.name || `@${u.handle}`}</p>
                <p className="text-xs text-white/40">{getLevelName(u.level)}</p>
              </div>
            </Link>
          ))
        )}

        {!viewerInTop && (
          <div className="flex items-center gap-3 p-3 bg-gate-pink/10">
            <span className="w-5 text-center text-sm font-bold text-white/40">{viewerRankPosition}º</span>
            <div className="flex-1">
              <p className="text-sm text-white">Você</p>
              <p className="text-xs text-white/40">{viewerTotalXp.toLocaleString('pt-BR')} XP (só você vê)</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
