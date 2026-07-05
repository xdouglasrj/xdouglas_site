import type { Metadata } from 'next'
import Link from 'next/link'
import { getTrending, type TrendingPeriod, type TrendingEntry } from '@/lib/trending'
import { getCurrentRole } from '@/lib/auth/role'
import { TrackCard } from '@/components/music/track-card'
import { toPlayerTrack } from '@/lib/tracks/to-player-track'
import { TRACK_GENRES } from '@/lib/tracks/genres'

// A agregação fica no cache de 1h do getTrending (unstable_cache);
// a página revalida no mesmo ritmo.
export const revalidate = 3600

export const metadata: Metadata = {
  title: 'Em Alta',
  description:
    'As músicas mais ouvidas, curtidas e repostadas da comunidade xDouglas — por semana, mês e desde sempre.',
  robots: { index: true, follow: true },
}

const PERIODS: { key: TrendingPeriod; label: string }[] = [
  { key: 'week', label: 'Esta semana' },
  { key: 'month', label: 'Este mês' },
  { key: 'all', label: 'Sempre' },
]

interface PageProps {
  searchParams: Promise<{ tab?: string; periodo?: string; genero?: string }>
}

export default async function TrendingPage({ searchParams }: PageProps) {
  const { tab: tabParam, periodo, genero } = await searchParams

  const tab = tabParam === 'underground' ? 'underground' : 'geral'
  const period: TrendingPeriod = periodo === 'month' ? 'month' : periodo === 'all' ? 'all' : 'week'
  const genre = genero && (TRACK_GENRES as readonly string[]).includes(genero) ? genero : null

  const [entries, role] = await Promise.all([
    getTrending({ period, genre, underground: tab === 'underground' }),
    getCurrentRole(),
  ])
  const canDownload = role !== null && role !== 'GUEST'
  const playerQueue = entries.map((e) => toPlayerTrack(e.track))

  // Monta a URL preservando os outros filtros
  function href(next: { tab?: string; periodo?: string; genero?: string | null }) {
    const params = new URLSearchParams()
    const t = next.tab ?? tab
    const p = next.periodo ?? period
    const g = next.genero === undefined ? genre : next.genero
    if (t !== 'geral') params.set('tab', t)
    if (p !== 'week') params.set('periodo', p)
    if (g) params.set('genero', g)
    const qs = params.toString()
    return qs ? `/trending?${qs}` : '/trending'
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-8 py-8 sm:py-12">
      <h1 className="text-2xl font-bold text-white">Em Alta</h1>
      <p className="mt-2 text-sm text-gate-blue">
        As músicas que a comunidade mais está ouvindo, curtindo e repostando.
      </p>

      {/* Abas: Em Alta / Underground */}
      <div className="mt-6 flex items-center gap-2 border-b border-gate-azure">
        <TabLink href={href({ tab: 'geral' })} active={tab === 'geral'}>
          Em Alta
        </TabLink>
        <TabLink href={href({ tab: 'underground' })} active={tab === 'underground'}>
          Underground
        </TabLink>
      </div>

      {/* Filtros de período */}
      <div className="mt-4 flex flex-wrap items-center gap-2">
        {PERIODS.map((p) => (
          <Link
            key={p.key}
            href={href({ periodo: p.key })}
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
              period === p.key
                ? 'bg-gate-pink text-white'
                : 'border border-gate-azure text-gate-blue hover:border-gate-pink hover:text-gate-pink'
            }`}
          >
            {p.label}
          </Link>
        ))}
      </div>

      {/* Filtro de gênero */}
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Link
          href={href({ genero: null })}
          className={`rounded-full px-3 py-1.5 text-xs transition ${
            genre === null
              ? 'border border-gate-pink text-gate-pink'
              : 'border border-gate-azure text-gate-blue hover:border-gate-pink hover:text-gate-pink'
          }`}
        >
          Todos os gêneros
        </Link>
        {TRACK_GENRES.map((g) => (
          <Link
            key={g}
            href={href({ genero: g })}
            className={`rounded-full px-3 py-1.5 text-xs transition ${
              genre === g
                ? 'border border-gate-pink text-gate-pink'
                : 'border border-gate-azure text-gate-blue hover:border-gate-pink hover:text-gate-pink'
            }`}
          >
            {g}
          </Link>
        ))}
      </div>

      {/* Ranking */}
      {entries.length === 0 ? (
        <p className="mt-10 text-sm text-gate-blue">
          Ainda não há atividade suficiente neste período{genre ? ` em ${genre}` : ''}.
          {tab === 'underground' && ' Os artistas underground aparecem aqui assim que ganharem plays.'}
        </p>
      ) : (
        <ol className="mt-6 flex flex-col gap-3">
          {entries.map((entry) => (
            <li key={entry.track.id} className="flex items-start gap-3">
              <span
                className={`w-8 shrink-0 pt-4 text-right text-lg font-bold tabular-nums ${
                  entry.position <= 3 ? 'text-gate-pink' : 'text-gate-blue'
                }`}
                aria-label={`Posição ${entry.position}`}
              >
                {entry.position}
              </span>
              <div className="min-w-0 flex-1">
                <TrackCard track={entry.track} canDownload={canDownload} isLoggedIn={role !== null} queue={playerQueue} />
                <StatsRow entry={entry} />
              </div>
            </li>
          ))}
        </ol>
      )}
    </div>
  )
}

// ── Sub-componentes ───────────────────────────────────────────

function TabLink({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className={`px-4 py-2.5 text-sm font-semibold transition-colors border-b-2 -mb-px ${
        active
          ? 'border-gate-pink text-gate-pink'
          : 'border-transparent text-gate-blue hover:text-white'
      }`}
      aria-current={active ? 'page' : undefined}
    >
      {children}
    </Link>
  )
}

function StatsRow({ entry }: { entry: TrendingEntry }) {
  const { plays, likes, reposts, comments } = entry.stats
  const parts = [
    `${plays.toLocaleString('pt-BR')} play${plays !== 1 ? 's' : ''}`,
    `${likes.toLocaleString('pt-BR')} curtida${likes !== 1 ? 's' : ''}`,
    `${reposts.toLocaleString('pt-BR')} repost${reposts !== 1 ? 's' : ''}`,
    `${comments.toLocaleString('pt-BR')} comentário${comments !== 1 ? 's' : ''}`,
  ]
  return <p className="mt-1 px-1 text-[11px] text-white/30">{parts.join(' · ')}</p>
}
