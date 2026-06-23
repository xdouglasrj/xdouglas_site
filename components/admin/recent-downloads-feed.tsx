interface RecentDownload {
  id: string
  country: string | null
  city: string | null
  device: string | null
  createdAt: string
  track: { title: string; slug: string }
}

interface RecentDownloadsFeedProps {
  downloads: RecentDownload[]
}

function timeAgo(isoStr: string): string {
  const diff = Date.now() - new Date(isoStr).getTime()
  const minutes = Math.floor(diff / 60_000)
  if (minutes < 1) return 'agora'
  if (minutes < 60) return `${minutes}min atrás`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h atrás`
  return `${Math.floor(hours / 24)}d atrás`
}

const DEVICE_ICON: Record<string, string> = {
  mobile: '📱',
  desktop: '💻',
  tablet: '📟',
}

export function RecentDownloadsFeed({ downloads }: RecentDownloadsFeedProps) {
  if (downloads.length === 0) {
    return (
      <p className="text-sm text-neutral-600 py-8 text-center">
        Nenhum download ainda
      </p>
    )
  }

  return (
    <div className="divide-y divide-neutral-800">
      {downloads.map((d) => (
        <div key={d.id} className="flex items-start gap-3 py-3">
          {/* Ícone de device */}
          <span className="text-base shrink-0" aria-hidden="true">
            {DEVICE_ICON[d.device ?? ''] ?? '🌐'}
          </span>

          <div className="flex-1 min-w-0">
            <p className="text-sm text-neutral-300 truncate">{d.track.title}</p>
            <p className="text-xs text-neutral-600 mt-0.5">
              {[d.city, d.country].filter(Boolean).join(', ') || 'Localização desconhecida'}
            </p>
          </div>

          <span className="text-xs text-neutral-600 shrink-0 tabular-nums">
            {timeAgo(d.createdAt)}
          </span>
        </div>
      ))}
    </div>
  )
}
