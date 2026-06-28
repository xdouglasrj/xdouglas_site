import type { UserStatsRow } from '@/lib/admin/user-stats'
import { PlanToggle } from './plan-toggle'

function formatMb(bytes: number): string {
  return (bytes / (1024 * 1024)).toFixed(1).replace(/\.0$/, '')
}

export function UserStatsPanel({ rows }: { rows: UserStatsRow[] }) {
  if (rows.length === 0) {
    return (
      <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-12 text-center">
        <p className="text-neutral-500 text-sm">Nenhum usuário com atividade ainda.</p>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-neutral-800 bg-neutral-900 overflow-x-auto">
      <table className="w-full text-sm whitespace-nowrap">
        <thead>
          <tr className="border-b border-neutral-800">
            <th className="text-left px-4 py-3 text-xs font-medium text-neutral-500 uppercase tracking-wide">Usuário</th>
            <th className="text-center px-4 py-3 text-xs font-medium text-neutral-500 uppercase tracking-wide">Plano</th>
            <th className="text-right px-4 py-3 text-xs font-medium text-neutral-500 uppercase tracking-wide">Músicas</th>
            <th className="text-right px-4 py-3 text-xs font-medium text-neutral-500 uppercase tracking-wide">Espaço usado</th>
            <th className="text-right px-4 py-3 text-xs font-medium text-neutral-500 uppercase tracking-wide">Curtidas</th>
            <th className="text-right px-4 py-3 text-xs font-medium text-neutral-500 uppercase tracking-wide">Comentários</th>
            <th className="text-right px-4 py-3 text-xs font-medium text-neutral-500 uppercase tracking-wide">Seguidores</th>
            <th className="text-right px-4 py-3 text-xs font-medium text-neutral-500 uppercase tracking-wide">Seguindo</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-800">
          {rows.map((row) => {
            const pct = row.storageQuotaBytes > 0
              ? Math.min(100, Math.round((row.storageUsedBytes / row.storageQuotaBytes) * 100))
              : 0
            return (
              <tr key={row.id} className="hover:bg-neutral-800/40 transition-colors">
                <td className="px-4 py-3">
                  <p className="font-medium text-neutral-200">{row.displayName}</p>
                  {row.handle && <p className="text-xs text-neutral-600">@{row.handle}</p>}
                </td>
                <td className="px-4 py-3 text-center">
                  <PlanToggle userId={row.id} plan={row.plan} />
                </td>
                <td className="px-4 py-3 text-right font-semibold text-white tabular-nums">
                  {row.trackCount.toLocaleString('pt-BR')}
                </td>
                <td className="px-4 py-3 text-right text-neutral-300 tabular-nums">
                  {formatMb(row.storageUsedBytes)}MB / {formatMb(row.storageQuotaBytes)}MB
                  <span className="ml-1.5 text-neutral-600">({pct}%)</span>
                </td>
                <td className="px-4 py-3 text-right text-neutral-300 tabular-nums">
                  {row.likeCount.toLocaleString('pt-BR')}
                </td>
                <td className="px-4 py-3 text-right text-neutral-300 tabular-nums">
                  {row.commentCount.toLocaleString('pt-BR')}
                </td>
                <td className="px-4 py-3 text-right text-neutral-300 tabular-nums">
                  {row.followerCount.toLocaleString('pt-BR')}
                </td>
                <td className="px-4 py-3 text-right text-neutral-300 tabular-nums">
                  {row.followingCount.toLocaleString('pt-BR')}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
