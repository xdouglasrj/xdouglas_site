import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { IconSidebar } from '@/components/layout/icon-sidebar'
import { getCurrentUserBasics } from '@/lib/auth/current-user'
import { getCurrentRole } from '@/lib/auth/role'
import { Avatar } from '@/components/ui/avatar'
import { searchUsers } from '@/lib/social/search'
import { searchTracks, hasAnyTrackFilter, type TrackSearchFilters } from '@/lib/tracks/search'
import { TrackCard, toPlayerTrack } from '@/components/music/track-card'
import { TRACK_GENRES } from '@/lib/tracks/genres'
import { TRACK_MOODS, MUSICAL_KEYS, isValidMood, isValidKey, normalizeTag } from '@/lib/tracks/moods'
import { TRACK_KINDS, TRACK_KIND_LABELS, isValidTrackKind, DURATION_BUCKETS, isValidDurationBucketId } from '@/lib/tracks/track-kinds'

export const metadata: Metadata = {
  title: 'Busca',
  robots: { index: false, follow: false },
}

export const dynamic = 'force-dynamic'

interface PageProps {
  searchParams: Promise<{
    q?: string
    genero?: string
    mood?: string
    tom?: string
    bpmMin?: string
    bpmMax?: string
    tag?: string
    tipo?: string
    duracao?: string
  }>
}

function parseBpm(raw: string | undefined): number | null {
  const n = Number(raw)
  return Number.isInteger(n) && n >= 40 && n <= 300 ? n : null
}

export default async function BuscaPage({ searchParams }: PageProps) {
  const user = await getCurrentUserBasics()
  if (!user) redirect('/inicio')

  const params = await searchParams
  const query = params.q?.trim() ?? ''

  // Filtros validados contra as listas fixas (whitelist)
  const filters: TrackSearchFilters = {
    q: query || null,
    genre: params.genero && (TRACK_GENRES as readonly string[]).includes(params.genero) ? params.genero : null,
    mood: params.mood && isValidMood(params.mood) ? params.mood : null,
    key: params.tom && isValidKey(params.tom) ? params.tom : null,
    bpmMin: parseBpm(params.bpmMin),
    bpmMax: parseBpm(params.bpmMax),
    tag: params.tag ? normalizeTag(params.tag) : null,
    kind: params.tipo && isValidTrackKind(params.tipo) ? params.tipo : null,
    durationBucket: params.duracao && isValidDurationBucketId(params.duracao) ? params.duracao : null,
  }
  const hasFilters = !!(
    filters.genre || filters.mood || filters.key || filters.bpmMin || filters.bpmMax ||
    filters.tag || filters.kind || filters.durationBucket
  )

  const [users, tracks, role] = await Promise.all([
    query ? searchUsers(query) : Promise.resolve([]),
    hasAnyTrackFilter(filters) ? searchTracks(filters) : Promise.resolve([]),
    getCurrentRole(),
  ])
  const canDownload = role !== null && role !== 'GUEST'
  const playerQueue = tracks.map(toPlayerTrack)

  const selectClass =
    'w-full rounded-lg border border-gate-azure bg-gate-bg px-3 py-2 text-sm text-white outline-none transition focus:border-gate-pink'

  return (
    <div className="min-h-screen bg-gate-bg">
      <IconSidebar
        isAdmin={user.role === 'ADMIN'}
        hasUploads={user.hasUploads}
        photoUrl={user.photoUrl}
        handle={user.handle}
      />

      <main className="md:ml-16 md:pt-20 px-4 sm:px-8 py-8 sm:py-12">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-2xl font-bold text-white mb-6">Busca</h1>

          <form method="GET" className="mb-8">
            <div className="flex gap-2">
              <input
                type="text"
                name="q"
                defaultValue={query}
                placeholder="Música, artista, produtor ou @usuário..."
                autoFocus
                className="flex-1 rounded-lg border border-gate-azure bg-white/5 px-4 py-3 text-sm text-white placeholder-white/30 outline-none transition focus:border-gate-pink focus:ring-1 focus:ring-gate-pink/40"
              />
              <button
                type="submit"
                className="rounded-lg bg-gate-pink px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90"
              >
                Buscar
              </button>
            </div>

            {/* Filtros DJ colapsáveis (V3 Plano 5) */}
            <details className="mt-3 rounded-lg border border-gate-azure bg-white/[0.03]" open={hasFilters}>
              <summary className="cursor-pointer select-none px-4 py-2.5 text-xs font-semibold uppercase tracking-widest text-gate-blue transition hover:text-gate-pink">
                Filtros {hasFilters ? '· ativos' : ''}
              </summary>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 border-t border-gate-azure/50 p-4">
                <div>
                  <label htmlFor="f-genero" className="mb-1 block text-[10px] font-medium uppercase tracking-wider text-gate-blue">Gênero</label>
                  <select id="f-genero" name="genero" defaultValue={filters.genre ?? ''} className={selectClass}>
                    <option value="">Todos</option>
                    {TRACK_GENRES.map((g) => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="f-mood" className="mb-1 block text-[10px] font-medium uppercase tracking-wider text-gate-blue">Mood</label>
                  <select id="f-mood" name="mood" defaultValue={filters.mood ?? ''} className={selectClass}>
                    <option value="">Todos</option>
                    {TRACK_MOODS.map((m) => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="f-tom" className="mb-1 block text-[10px] font-medium uppercase tracking-wider text-gate-blue">Tom</label>
                  <select id="f-tom" name="tom" defaultValue={filters.key ?? ''} className={selectClass}>
                    <option value="">Todos</option>
                    {MUSICAL_KEYS.map((k) => (
                      <option key={k} value={k}>{k}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="f-bpm-min" className="mb-1 block text-[10px] font-medium uppercase tracking-wider text-gate-blue">BPM mín.</label>
                  <input id="f-bpm-min" type="number" name="bpmMin" min={40} max={300} defaultValue={filters.bpmMin ?? ''} placeholder="40" className={selectClass} />
                </div>
                <div>
                  <label htmlFor="f-bpm-max" className="mb-1 block text-[10px] font-medium uppercase tracking-wider text-gate-blue">BPM máx.</label>
                  <input id="f-bpm-max" type="number" name="bpmMax" min={40} max={300} defaultValue={filters.bpmMax ?? ''} placeholder="300" className={selectClass} />
                </div>
                <div>
                  <label htmlFor="f-tag" className="mb-1 block text-[10px] font-medium uppercase tracking-wider text-gate-blue">Tag</label>
                  <input id="f-tag" type="text" name="tag" defaultValue={filters.tag ?? ''} placeholder="ex.: remix" className={selectClass} />
                </div>
                <div>
                  <label htmlFor="f-tipo" className="mb-1 block text-[10px] font-medium uppercase tracking-wider text-gate-blue">Tipo</label>
                  <select id="f-tipo" name="tipo" defaultValue={filters.kind ?? ''} className={selectClass}>
                    <option value="">Todos</option>
                    {TRACK_KINDS.map((k) => (
                      <option key={k} value={k}>{TRACK_KIND_LABELS[k]}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="f-duracao" className="mb-1 block text-[10px] font-medium uppercase tracking-wider text-gate-blue">Duração</label>
                  <select id="f-duracao" name="duracao" defaultValue={filters.durationBucket ?? ''} className={selectClass}>
                    <option value="">Todas</option>
                    {DURATION_BUCKETS.map((b) => (
                      <option key={b.id} value={b.id}>{b.label}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex items-center gap-3 px-4 pb-4">
                <button
                  type="submit"
                  className="rounded-md bg-gate-pink px-4 py-2 text-xs font-semibold text-white transition hover:opacity-90"
                >
                  Aplicar filtros
                </button>
                {hasFilters && (
                  <Link href={query ? `/busca?q=${encodeURIComponent(query)}` : '/busca'} className="text-xs text-gate-blue transition hover:text-gate-pink">
                    Limpar filtros
                  </Link>
                )}
              </div>
            </details>
          </form>

          {/* Resultados — músicas */}
          {tracks.length > 0 && (
            <section className="mb-8">
              <h2 className="mb-3 text-sm font-bold uppercase tracking-widest text-gate-blue">
                Músicas ({tracks.length})
              </h2>
              <div className="flex flex-col gap-3">
                {tracks.map((track) => (
                  <TrackCard key={track.id} track={track} canDownload={canDownload} isLoggedIn={role !== null} queue={playerQueue} />
                ))}
              </div>
            </section>
          )}

          {(query || hasFilters) && tracks.length === 0 && (
            <p className="mb-8 text-sm text-white/40 text-center py-4">
              Nenhuma música encontrada com esses filtros.
            </p>
          )}

          {/* Resultados — usuários */}
          {users.length > 0 && (
            <section>
              <h2 className="mb-3 text-sm font-bold uppercase tracking-widest text-gate-blue">
                Usuários ({users.length})
              </h2>
              <ul className="divide-y divide-gate-azure/40 rounded-lg border border-gate-azure bg-white/5">
                {users.map((u) => (
                  <li key={u.id}>
                    <Link
                      href={`/perfil/${u.handle}`}
                      className="flex items-center gap-3 p-4 transition hover:bg-white/5"
                    >
                      <Avatar
                        photoUrl={u.photoUrl ?? null}
                        alt={u.displayName}
                        size={40}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-white truncate">{u.displayName}</p>
                        <p className="text-xs text-gate-blue truncate">@{u.handle}</p>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {query && users.length === 0 && (
            <p className="text-sm text-white/40 text-center py-4">
              Nenhum usuário encontrado para &quot;{query}&quot;.
            </p>
          )}
        </div>
      </main>
    </div>
  )
}
