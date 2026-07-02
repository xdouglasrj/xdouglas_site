'use client'

import { useEffect, useRef, useState } from 'react'
import { useAdsContext } from './ad-provider'
import { AD_SLOTS, type AdSlotKey } from '@/lib/ads/config'

declare global {
  interface Window {
    adsbygoogle?: unknown[]
  }
}

interface AdSlotProps {
  slot: AdSlotKey
  className?: string
}

const ADSENSE_CLIENT_ID = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID

// ============================================================
// AdSlot
//
// Reserva o espaço (width/height fixos) antes de qualquer coisa
// carregar — evita layout shift (CLS). Só monta o <ins> do anúncio
// quando o slot entra no viewport (IntersectionObserver), e só se
// ads estiver habilitado (env + admin + consentimento) e o slot
// tiver um ID configurado pelo admin.
// ============================================================

export function AdSlot({ slot, className }: AdSlotProps) {
  const { enabled, slots } = useAdsContext()
  const slotId = slots[slot]
  const def = AD_SLOTS[slot]

  const containerRef = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)
  const pushedRef = useRef(false)

  useEffect(() => {
    if (!enabled || !slotId) return
    const el = containerRef.current
    if (!el) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true)
          observer.disconnect()
        }
      },
      { rootMargin: '200px' }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [enabled, slotId])

  useEffect(() => {
    if (!visible || pushedRef.current) return
    try {
      window.adsbygoogle = window.adsbygoogle || []
      window.adsbygoogle.push({})
      pushedRef.current = true
    } catch {
      // Provedor pode não estar carregado ainda — sem retry, próxima
      // renderização do slot tenta de novo.
    }
  }, [visible])

  if (!enabled || !slotId) return null

  return (
    <div
      ref={containerRef}
      data-ad-slot-key={slot}
      className={className}
      style={{ width: def.width, height: def.height, minWidth: def.width, minHeight: def.height }}
    >
      {visible && (
        <ins
          className="adsbygoogle"
          style={{ display: 'block', width: def.width, height: def.height }}
          data-ad-client={ADSENSE_CLIENT_ID}
          data-ad-slot={slotId}
        />
      )}
    </div>
  )
}
