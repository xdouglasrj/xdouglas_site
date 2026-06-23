'use client'

import { useState, useEffect, useRef } from 'react'
import { mockTracks } from '@/data/mockTracks'
import { mockArtists } from '@/data/mockArtists'

export function SearchBar() {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const q = query.toLowerCase().trim()

  const trackResults = q
    ? mockTracks.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          t.artist.toLowerCase().includes(q) ||
          t.genre.toLowerCase().includes(q)
      ).slice(0, 4)
    : []

  const artistResults = q
    ? mockArtists.filter(
        (a) =>
          a.name.toLowerCase().includes(q) ||
          a.genre.toLowerCase().includes(q) ||
          a.location.toLowerCase().includes(q)
      ).slice(0, 2)
    : []

  const hasResults = trackResults.length > 0 || artistResults.length > 0

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  return (
    <div ref={ref} className="relative w-full max-w-sm">
      <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3.5 py-2.5 transition focus-within:border-[#4F8CFF]/50">
        <svg className="h-4 w-4 shrink-0 text-[#94A3B8]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <circle cx="11" cy="11" r="8" /><path strokeLinecap="round" d="m21 21-4.35-4.35" />
        </svg>
        <input
          type="text"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setOpen(true) }}
          onFocus={() => setOpen(true)}
          placeholder="Buscar músicas, artistas..."
          className="w-full bg-transparent text-sm text-white placeholder-white/30 outline-none"
        />
        {query && (
          <button onClick={() => { setQuery(''); setOpen(false) }} className="text-[#94A3B8] hover:text-white">
            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {open && q && (
        <div className="absolute left-0 right-0 top-full z-40 mt-2 overflow-hidden rounded-xl border border-white/10 bg-[#0B0B0F] shadow-2xl shadow-black/60">
          {!hasResults && (
            <p className="px-4 py-5 text-center text-sm text-[#94A3B8]">Nenhum resultado para "{query}"</p>
          )}

          {trackResults.length > 0 && (
            <div>
              <p className="border-b border-white/5 px-4 py-2 text-xs font-semibold uppercase tracking-widest text-[#94A3B8]">Músicas</p>
              {trackResults.map((t) => (
                <div key={t.id} className="flex cursor-pointer items-center gap-3 px-4 py-3 transition hover:bg-white/5">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded bg-[#4F8CFF]/20 text-xs font-bold text-[#4F8CFF]">
                    {t.title[0]}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-white">{t.title}</p>
                    <p className="text-xs text-[#94A3B8]">{t.artist} · {t.genre}</p>
                  </div>
                  <span className="ml-auto shrink-0 text-xs text-[#94A3B8]">{t.duration}</span>
                </div>
              ))}
            </div>
          )}

          {artistResults.length > 0 && (
            <div className="border-t border-white/5">
              <p className="px-4 py-2 text-xs font-semibold uppercase tracking-widest text-[#94A3B8]">Artistas</p>
              {artistResults.map((a) => (
                <div key={a.id} className="flex cursor-pointer items-center gap-3 px-4 py-3 transition hover:bg-white/5">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#67E8F9]/20 text-xs font-bold text-[#67E8F9]">
                    {a.name[0]}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-white">{a.name}</p>
                    <p className="text-xs text-[#94A3B8]">{a.genre} · {a.location}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="border-t border-white/5 px-4 py-2.5">
            <p className="text-xs text-[#94A3B8]">
              Comunidade · DJs · Produtores · Beatmakers · <span className="text-[#4F8CFF]">em breve</span>
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
