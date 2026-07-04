import type { Metadata } from 'next'
import Link from 'next/link'
import { IconSidebar } from '@/components/layout/icon-sidebar'
import { PublicHeader } from '@/components/layout/public-header'
import { Feed } from '@/components/social/feed'
import { TrackCard, toPlayerTrack } from '@/components/music/track-card'
import { getCurrentUserBasics } from '@/lib/auth/current-user'
import { getCurrentRole } from '@/lib/auth/role'
import { listLatestTracks } from '@/lib/tracks/queries'
import { listHighlightedTracks } from '@/lib/tracks/highlighted-queries'
import type { TrackPublic } from '@/lib/tracks/types'
import { getTrending, type TrendingEntry } from '@/lib/trending'
import { getContinueListening, type ContinueListeningEntry } from '@/lib/social/playback-progress'
import { listEventsWithinDays, type ArtistEventPublic } from '@/lib/events/events'

export const metadata: Metadata = {
  title: 'Início',
  robots: { index: true, follow: true },
}

const LATEST_TRACKS_LIMIT = 10

const TRENDING_HOME_LIMIT = 5

const HIGHLIGHTED_HOME_LIMIT = 6

const AGENDA_HOME_WINDOW_DAYS = 30

const AGENDA_HOME_LIMIT = 5

export default async function InicioPage() {
  const [user, role, latestTracks, trendingWeek, highlightedTracks, upcomingAgenda] = await Promise.all([
    getCurrentUserBasics(),
    getCurrentRole(),
    listLatestTracks(LATEST_TRACKS_LIMIT),
    getTrending({ period: 'week' }).then((e) => e.slice(0, TRENDING_HOME_LIMIT)).catch(() => [] as TrendingEntry[]),
    listHighlightedTracks(HIGHLIGHTED_HOME_LIMIT).catch(() => [] as TrackPublic[]),
    listEventsWithinDays(AGENDA_HOME_WINDOW_DAYS, AGENDA_HOME_LIMIT).catch(() => [] as ArtistEventPublic[]),
  ])
  const isLoggedIn = !!user
  const isAdmin = user?.role === 'ADMIN'
  const canDownload = role !== 'GUEST' && role !== null
  // Fila do player global — tocar uma faixa enfileira os lançamentos
  const playerQueue = latestTracks.map(toPlayerTrack)

  // "Continue ouvindo" (V3 Plano 17) — só para logado, reusa PlaybackProgress
  const continueListening = user
    ? await getContinueListening(user.id).catch(() => [])
    : []

  if (isLoggedIn) {
    return (
      <div className="min-h-screen bg-gate-bg">
        <IconSidebar isAdmin={isAdmin} hasUploads={user?.hasUploads ?? false} photoUrl={user?.photoUrl} handle={user?.handle} />

        <main className="md:ml-16 md:pt-20 px-4 sm:px-8 py-8 sm:py-12 flex flex-col items-center">
          <h1 className="text-2xl font-bold text-white text-center">Últimos lançamentos</h1>
          <p className="mt-2 max-w-md text-sm text-gate-blue text-center">
            Veja o que a comunidade está postando, ou use o ícone de música na barra lateral
            para explorar por gênero.
          </p>

          <ContinueListeningSection entries={continueListening} canDownload={canDownload} />

          <AgendaHomeSection events={upcomingAgenda} />

          <HighlightedSection tracks={highlightedTracks} canDownload={canDownload} isLoggedIn={isLoggedIn} />

          <TrendingHomeSection entries={trendingWeek} canDownload={canDownload} isLoggedIn={isLoggedIn} />

          {latestTracks.length > 0 && (
            <section className="mt-8 w-full max-w-3xl">
              <h2 className="text-sm font-bold uppercase tracking-widest text-gate-blue">
                Músicas mais recentes
              </h2>
              <div className="mt-3 divide-y divide-gate-azure/30 rounded-xl border border-gate-azure overflow-hidden">
                {latestTracks.map((track) => (
                  <TrackCard key={track.id} track={track} canDownload={canDownload} isLoggedIn={isLoggedIn} queue={playerQueue} />
                ))}
              </div>
            </section>
          )}

          <Link
            href="/musicas-recentes"
            className="mt-6 inline-block rounded-lg border border-gate-azure px-5 py-2.5 text-sm font-semibold text-white transition hover:border-gate-pink hover:text-gate-pink"
          >
            Ver todas as músicas
          </Link>

          <Feed />
        </main>
      </div>
    )
  }

  // Visitante anônimo — home pública
  return (
    <div className="min-h-screen bg-gate-bg">
      <PublicHeader />

      <main className="pt-14 md:pt-20 px-4 sm:px-8 py-8 sm:py-12 flex flex-col items-center">
        <h1 className="text-2xl font-bold text-white text-center">Últimos lançamentos</h1>
        <p className="mt-2 max-w-md text-sm text-gate-blue text-center">
          Explore a produção musical da comunidade. Faça login para baixar, curtir e comentar.
        </p>

        <AgendaHomeSection events={upcomingAgenda} />

        <HighlightedSection tracks={highlightedTracks} canDownload={false} isLoggedIn={false} />

        <TrendingHomeSection entries={trendingWeek} canDownload={false} isLoggedIn={false} />

        {latestTracks.length > 0 && (
          <section className="mt-8 w-full max-w-3xl">
            <h2 className="text-sm font-bold uppercase tracking-widest text-gate-blue">
              Músicas mais recentes
            </h2>
            <div className="mt-3 divide-y divide-gate-azure/30 rounded-xl border border-gate-azure overflow-hidden">
              {latestTracks.map((track) => (
                <TrackCard key={track.id} track={track} canDownload={false} isLoggedIn={false} queue={playerQueue} />
              ))}
            </div>
          </section>
        )}

        <Link
          href="/musicas-recentes"
          className="mt-6 inline-block rounded-lg border border-gate-azure px-5 py-2.5 text-sm font-semibold text-white transition hover:border-gate-pink hover:text-gate-pink"
        >
          Ver todas as músicas
        </Link>
      </main>
    </div>
  )
}

// ── Seção "Continue ouvindo" (V3 Plano 17) ───────────────────
// Faixas com progresso salvo (Plano 11) entre 5% e 95% — retoma direto
// do ponto salvo ao clicar em tocar (o player já busca o progresso).
// Só aparece para logado; se não houver progresso, a seção não renderiza.

function ContinueListeningSection({
  entries,
  canDownload,
}: {
  entries: ContinueListeningEntry[]
  canDownload: boolean
}) {
  if (entries.length === 0) return null

  const queue = entries.map((e) => toPlayerTrack(e.track))

  return (
    <section className="mt-8 w-full max-w-3xl">
      <h2 className="text-sm font-bold uppercase tracking-widest text-gate-blue">
        Continue ouvindo
      </h2>
      <div className="mt-3 divide-y divide-gate-azure/30 rounded-xl border border-gate-azure overflow-hidden">
        {entries.map((entry) => (
          <TrackCard
            key={entry.track.id}
            track={entry.track}
            canDownload={canDownload}
            isLoggedIn
            queue={queue}
          />
        ))}
      </div>
    </section>
  )
}

// ── Seção "Em destaque" (V3 Plano 13) ────────────────────────
// Faixas com destaque PAGO ativo (pontos). Distinta do trending
// (algorítmico) e do pin do admin (editorial). Some sozinha quando
// os destaques expiram (filtro por endsAt na query).

function HighlightedSection({
  tracks,
  canDownload,
  isLoggedIn,
}: {
  tracks: TrackPublic[]
  canDownload: boolean
  isLoggedIn: boolean
}) {
  if (tracks.length === 0) return null

  const queue = tracks.map(toPlayerTrack)

  return (
    <section className="mt-8 w-full max-w-3xl">
      <h2 className="text-sm font-bold uppercase tracking-widest text-gate-blue">
        ⭐ Em destaque
      </h2>
      <div className="mt-3 divide-y divide-gate-azure/30 rounded-xl border border-gate-azure overflow-hidden">
        {tracks.map((track) => (
          <TrackCard
            key={track.id}
            track={track}
            canDownload={canDownload}
            isLoggedIn={isLoggedIn}
            queue={queue}
            isHighlighted
          />
        ))}
      </div>
    </section>
  )
}

// ── Seção "Em Alta esta semana" (V3 Plano 4) ─────────────────

function TrendingHomeSection({ entries, canDownload, isLoggedIn }: { entries: TrendingEntry[]; canDownload: boolean; isLoggedIn: boolean }) {
  if (entries.length === 0) return null

  const queue = entries.map((e) => toPlayerTrack(e.track))

  return (
    <section className="mt-8 w-full max-w-3xl">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold uppercase tracking-widest text-gate-blue">
          📈 Em Alta esta semana
        </h2>
        <Link href="/trending" className="text-xs font-semibold text-gate-pink transition hover:opacity-80">
          Ver tudo →
        </Link>
      </div>
      <div className="mt-3 divide-y divide-gate-azure/30 rounded-xl border border-gate-azure overflow-hidden">
        {entries.map((entry) => (
          <div key={entry.track.id} className="flex items-start">
            <span
              className={`w-9 shrink-0 pt-6 text-right text-lg font-bold tabular-nums ${
                entry.position <= 3 ? 'text-gate-pink' : 'text-gate-blue'
              }`}
              aria-label={`Posição ${entry.position}`}
            >
              {entry.position}
            </span>
            <div className="min-w-0 flex-1">
              <TrackCard track={entry.track} canDownload={canDownload} isLoggedIn={isLoggedIn} queue={queue} />
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

// ── Seção "Agenda" (V3 Plano 18) ─────────────────────────────
// Compacta: só aparece quando há evento publicado nos próximos 30 dias.

function AgendaHomeSection({ events }: { events: ArtistEventPublic[] }) {
  if (events.length === 0) return null

  return (
    <section className="mt-8 w-full max-w-3xl">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold uppercase tracking-widest text-gate-blue">🗓️ Agenda</h2>
        <Link href="/eventos" className="text-xs font-semibold text-gate-pink transition hover:opacity-80">
          Ver tudo →
        </Link>
      </div>
      <div className="mt-3 divide-y divide-gate-azure/30 rounded-xl border border-gate-azure overflow-hidden">
        {events.map((event) => (
          <Link
            key={event.id}
            href={`/artista/${event.artist.slug}`}
            className="flex items-center justify-between gap-3 px-4 py-3 transition hover:bg-white/5"
          >
            <div className="min-w-0">
              <p className="text-sm font-medium text-white truncate">{event.title}</p>
              <p className="text-xs text-gate-blue">
                {event.artist.name} ·{' '}
                {new Date(event.startsAt).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                {event.city && ` · ${event.city}`}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}
