'use client'

import { useEffect, useRef, useState } from 'react'

interface ShareButtonProps {
  trackId: string
  slug: string
  title: string
  artistName: string
  compact?: boolean
}

function getCanonicalUrl(slug: string): string {
  return `${window.location.origin}/musicas/${slug}`
}

export function ShareButton({ trackId, slug, title, artistName, compact = false }: ShareButtonProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const wrapperRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  function registerShare() {
    fetch(`/api/social/tracks/${trackId}/share`, { method: 'POST' }).catch(() => {})
  }

  async function handleShareClick() {
    const url = getCanonicalUrl(slug)

    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({ title: `${title} — ${artistName}`, url })
        registerShare()
      } catch {
        // usuário cancelou — não registra
      }
      return
    }

    setMenuOpen((v) => !v)
  }

  async function copyLink() {
    const url = getCanonicalUrl(slug)
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      registerShare()
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // clipboard indisponível — ignora
    }
  }

  function shareWhatsapp() {
    const url = getCanonicalUrl(slug)
    const text = encodeURIComponent(`${title} — ${artistName}\n${url}`)
    window.open(`https://wa.me/?text=${text}`, '_blank', 'noopener,noreferrer')
    registerShare()
    setMenuOpen(false)
  }

  function shareTwitter() {
    const url = getCanonicalUrl(slug)
    const text = encodeURIComponent(`${title} — ${artistName}`)
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${encodeURIComponent(url)}`, '_blank', 'noopener,noreferrer')
    registerShare()
    setMenuOpen(false)
  }

  return (
    <div ref={wrapperRef} className="relative">
      <button
        type="button"
        onClick={handleShareClick}
        className={[
          'flex items-center gap-1.5 shrink-0 transition-colors text-white/50 hover:text-gate-pink',
          compact ? 'px-2 py-1.5 text-xs' : 'px-3 py-1.5 text-sm',
        ].join(' ')}
        aria-label="Compartilhar"
      >
        <ShareIcon />
        <span>Compartilhar</span>
      </button>

      {menuOpen && (
        <div className="absolute bottom-full left-0 mb-2 w-56 rounded-lg border border-gate-azure bg-gate-bg p-2 shadow-xl z-20">
          <button
            type="button"
            onClick={shareWhatsapp}
            className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-white hover:bg-white/5 transition"
          >
            WhatsApp
          </button>
          <button
            type="button"
            onClick={shareTwitter}
            className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-white hover:bg-white/5 transition"
          >
            X (Twitter)
          </button>
          <button
            type="button"
            onClick={copyLink}
            className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-white hover:bg-white/5 transition"
          >
            {copied ? 'Link copiado!' : 'Copiar link'}
          </button>
        </div>
      )}
    </div>
  )
}

function ShareIcon() {
  return (
    <svg className="w-5 h-5 shrink-0" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="13" cy="3" r="2" />
      <circle cx="13" cy="13" r="2" />
      <circle cx="3" cy="8" r="2" />
      <path d="M4.7 7.1l6.6-3.2M4.7 8.9l6.6 3.2" />
    </svg>
  )
}
