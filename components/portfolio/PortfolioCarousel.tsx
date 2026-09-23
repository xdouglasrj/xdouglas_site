'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import PortfolioCard from './PortfolioCard'
import { publicPortfolioItems } from '@/app/data/portfolio'

export default function PortfolioCarousel() {
  const items = publicPortfolioItems
  const scrollerRef = useRef<HTMLDivElement>(null)
  const [canPrev, setCanPrev] = useState(false)
  const [canNext, setCanNext] = useState(false)

  const update = useCallback(() => {
    const el = scrollerRef.current
    if (!el) return
    const { scrollLeft, scrollWidth, clientWidth } = el
    setCanPrev(scrollLeft > 8)
    setCanNext(scrollLeft + clientWidth < scrollWidth - 8)
  }, [])

  useEffect(() => {
    update()
    const el = scrollerRef.current
    if (!el) return
    el.addEventListener('scroll', update, { passive: true })
    window.addEventListener('resize', update)
    return () => {
      el.removeEventListener('scroll', update)
      window.removeEventListener('resize', update)
    }
  }, [update])

  useEffect(() => {
    // re-check after mount when images load
    const t = setTimeout(update, 300)
    return () => clearTimeout(t)
  }, [update])

  const scrollByCard = useCallback(
    (dir: 1 | -1) => {
      const el = scrollerRef.current
      if (!el) return
      const first = el.firstElementChild as HTMLElement | null
      const gap = 24 // matches gap-6
      const cardW = first ? first.offsetWidth + gap : el.clientWidth * 0.85
      const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      el.scrollBy({ left: dir * cardW, behavior: reduced ? 'auto' : 'smooth' })
    },
    [],
  )

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'ArrowRight') {
        e.preventDefault()
        scrollByCard(1)
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault()
        scrollByCard(-1)
      } else if (e.key === 'Home') {
        e.preventDefault()
        scrollerRef.current?.scrollTo({ left: 0, behavior: 'smooth' })
      } else if (e.key === 'End') {
        e.preventDefault()
        const el = scrollerRef.current
        if (el) el.scrollTo({ left: el.scrollWidth, behavior: 'smooth' })
      }
    },
    [scrollByCard],
  )

  if (items.length === 0) {
    return (
      <div className="rounded-[1.75rem] border border-[#2b2b31] bg-[#151519] px-6 py-12 text-center">
        <p className="text-sm text-[#a4a1a8]">Nenhum projeto público para exibir.</p>
      </div>
    )
  }

  const showControls = items.length > 1

  return (
    <div className="relative overflow-hidden">
      <div
        ref={scrollerRef}
        role="region"
        aria-roledescription="carousel"
        aria-label="Projetos em destaque"
        tabIndex={0}
        onKeyDown={onKeyDown}
        className="flex snap-x snap-mandatory gap-[clamp(0.875rem,2vw,1.5rem)] overflow-x-auto overflow-y-hidden scroll-pb-2 overscroll-x-contain px-4 sm:px-8 lg:px-0 pb-4 pt-2 -mx-4 sm:-mx-8 lg:mx-0 pr-[12vw] sm:pr-[8vw] lg:pr-[10vw] motion-safe:scroll-smooth motion-reduce:scroll-auto focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#0b0b0d] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {items.map((item, i) => (
          <div
            key={item.slug}
            role="group"
            aria-roledescription="slide"
            aria-label={`${i + 1} de ${items.length}: ${item.name}`}
            className="shrink-0 snap-start snap-always w-[85vw] max-w-[360px] sm:w-[420px] md:w-[52%] lg:w-[38%] xl:w-[32%]"
          >
            <PortfolioCard {...item} />
          </div>
        ))}
      </div>

      {showControls && (
        <>
          <button
            type="button"
            onClick={() => scrollByCard(-1)}
            disabled={!canPrev}
            aria-label="Projeto anterior"
            className="absolute left-2 sm:left-2 lg:left-3 top-1/2 hidden h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-[#f1efe9] text-[#0b0b0d] shadow-lg transition-opacity duration-180 sm:inline-flex disabled:pointer-events-none disabled:opacity-30 enabled:hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#0b0b0d]"
          >
            <span aria-hidden className="text-xl leading-none">
              ‹
            </span>
          </button>
          <button
            type="button"
            onClick={() => scrollByCard(1)}
            disabled={!canNext}
            aria-label="Próximo projeto"
            className="absolute right-2 sm:right-2 lg:right-3 top-1/2 hidden h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-[#f1efe9] text-[#0b0b0d] shadow-lg transition-opacity duration-180 sm:inline-flex disabled:pointer-events-none disabled:opacity-30 enabled:hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#0b0b0d]"
          >
            <span aria-hidden className="text-xl leading-none">
              ›
            </span>
          </button>
        </>
      )}
    </div>
  )
}
