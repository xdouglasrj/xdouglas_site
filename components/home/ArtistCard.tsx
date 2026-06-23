import type { MockArtist } from '@/data/mockArtists'

function formatFollowers(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`
  return String(n)
}

interface ArtistCardProps {
  artist: MockArtist
}

export function ArtistCard({ artist }: ArtistCardProps) {
  const initial = artist.name[0]

  return (
    <div className="group flex flex-col items-center rounded-2xl border border-white/8 bg-[#111827] p-6 text-center transition hover:border-white/15 hover:bg-[#111827]/80">
      {/* Avatar placeholder */}
      <div className="relative mb-4 flex h-20 w-20 items-center justify-center rounded-full border border-[#4F8CFF]/30 bg-gradient-to-br from-[#4F8CFF]/20 to-[#67E8F9]/10">
        <span className="font-['Space_Grotesk'] text-2xl font-bold text-[#4F8CFF]">{initial}</span>
        {/* Anel animado */}
        <span className="absolute inset-0 rounded-full border border-[#4F8CFF]/20 transition group-hover:border-[#4F8CFF]/50" />
      </div>

      <h3 className="mb-1 font-['Manrope'] text-base font-bold text-white">{artist.name}</h3>
      <p className="mb-3 text-xs text-[#67E8F9]">{artist.genre}</p>
      <p className="mb-4 text-xs leading-relaxed text-[#94A3B8] line-clamp-2">{artist.description}</p>

      <div className="flex w-full items-center justify-between border-t border-white/8 pt-4 text-xs text-[#94A3B8]">
        <span className="flex items-center gap-1.5">
          <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/>
          </svg>
          {formatFollowers(artist.followers)} seguidores
        </span>
        <span className="flex items-center gap-1.5">
          <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"/>
          </svg>
          {artist.tracks} músicas
        </span>
      </div>

      <div className="mt-3 flex items-center gap-1 text-xs text-[#94A3B8]">
        <svg className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
          <path strokeLinecap="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
        </svg>
        {artist.location}
      </div>
    </div>
  )
}
