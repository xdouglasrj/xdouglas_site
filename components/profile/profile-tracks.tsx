import Link from 'next/link'

interface ProfileTrack {
  slug: string
  title: string
  genre: string | null
  coverUrl: string | null
}

export function ProfileTracks({ tracks }: { tracks: ProfileTrack[] }) {
  if (tracks.length === 0) return null

  return (
    <section className="mt-6 rounded-lg border border-gate-azure bg-white/5 p-5">
      <h2 className="text-xs font-bold uppercase tracking-widest text-gate-blue">
        Músicas publicadas ({tracks.length})
      </h2>
      <ul className="mt-3 flex flex-col gap-2">
        {tracks.map((track) => (
          <li key={track.slug}>
            <Link
              href={`/musicas/${track.slug}`}
              className="flex items-center gap-3 rounded-md px-2 py-2 -mx-2 transition hover:bg-white/5"
            >
              <div className="relative w-10 h-10 shrink-0 rounded overflow-hidden bg-white/10 border border-gate-azure">
                {track.coverUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={track.coverUrl} alt={track.title} className="w-full h-full object-cover" />
                ) : null}
              </div>
              <div className="min-w-0">
                <p className="text-sm text-white/90 truncate">{track.title}</p>
                {track.genre && <p className="text-xs text-gate-blue truncate">{track.genre}</p>}
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}
