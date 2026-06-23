'use client'

import { useState, useCallback } from 'react'
import { mockTracks } from '@/data/mockTracks'
import { MusicRow } from './MusicCard'

const SIZES = [10, 20, 30] as const
type Size = typeof SIZES[number]

const COL_HEADERS = [
  { label: '#',         cls: 'text-center' },
  { label: '',          cls: '' },
  { label: 'Música',    cls: '' },
  { label: 'Gênero',   cls: '' },
  { label: 'Publicado', cls: '' },
  { label: 'Formato',  cls: '' },
  { label: 'Downloads', cls: 'text-right' },
  { label: 'Plays',    cls: 'text-right' },
  { label: '',          cls: '' },
]

export function MusicGrid() {
  const [count, setCount] = useState<Size>(10)
  const [playCounts, setPlayCounts] = useState<number[]>(
    mockTracks.map((t) => t.plays)
  )

  const increment = useCallback((index: number) => {
    setPlayCounts((prev) => {
      const next = [...prev]
      next[index] = next[index] + 1
      return next
    })
  }, [])

  const visible = mockTracks.slice(0, count)

  return (
    <section className="bg-[#080808] py-20 px-4 md:px-8">
      <div className="mx-auto max-w-7xl">

        {/* Cabeçalho da seção */}
        <div className="mb-8 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="mb-1 text-[10px] font-bold uppercase tracking-[.18em] text-[#e8365d]">Catálogo</p>
            <h2 className="font-['Manrope'] text-3xl font-extrabold tracking-tight text-white md:text-4xl">
              Descubra novos sons
            </h2>
          </div>
          <p className="text-sm text-[#555]">
            Exibindo {count} de {mockTracks.length} músicas
          </p>
        </div>

        {/* Cabeçalho das colunas */}
        <div
          className="mb-1 grid px-3 pb-2 border-b border-[#181818]"
          style={{ gridTemplateColumns: '32px 36px 1fr 108px 88px 68px 72px 64px 52px' }}
        >
          {COL_HEADERS.map((h, i) => (
            <p
              key={i}
              className={`text-[9px] font-bold uppercase tracking-[.13em] text-[#333] ${h.cls}`}
            >
              {h.label}
            </p>
          ))}
        </div>

        {/* Lista */}
        <div className="flex flex-col gap-[2px]">
          {visible.map((track, i) => (
            <MusicRow
              key={track.id}
              track={track}
              index={i}
              playCount={playCounts[i]}
              onPlayCountIncrement={() => increment(i)}
            />
          ))}
        </div>

        {/* Separador */}
        <div className="my-6 h-px bg-[#131313]" />

        {/* Seletor de quantidade — moderno, só a opção ativa aparece */}
        <div className="flex items-center justify-between">
          <p className="text-[11px] text-[#383838]">Músicas por página</p>
          <div className="flex items-center gap-[2px] rounded-lg border border-[#1c1c1c] bg-[#0f0f0f] p-[3px]">
            {SIZES.map((s) => (
              <button
                key={s}
                onClick={() => setCount(s)}
                className={`rounded-md px-[13px] py-[5px] text-[11px] font-bold transition-all ${
                  count === s
                    ? 'bg-[#e8365d] text-white'
                    : 'bg-transparent text-[#383838] hover:text-[#888]'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

      </div>
    </section>
  )
}
