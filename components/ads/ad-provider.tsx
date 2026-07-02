'use client'

import Script from 'next/script'
import { createContext, useContext, type ReactNode } from 'react'
import { useAnalyticsContext } from '@/components/analytics/analytics-provider'

// ============================================================
// Contexto
// ============================================================

interface AdsContextValue {
  // já combina o feature flag (env + admin) com o consentimento do usuário —
  // o AdSlot só precisa checar isso + se tem um slot ID configurado.
  enabled: boolean
  slots: Record<string, string>
}

const AdsContext = createContext<AdsContextValue>({ enabled: false, slots: {} })

const ADSENSE_CLIENT_ID = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID

// ============================================================
// Provider
//
// `enabled` chega do server (layout raiz) já combinando o kill switch
// (NEXT_PUBLIC_ADS_ENABLED) com o toggle do admin (app_settings.featureFlags.ads).
// Aqui só falta cruzar com o consentimento de publicidade do usuário.
// ============================================================

interface AdProviderProps {
  enabled: boolean
  slots: Record<string, string>
  children: ReactNode
}

export function AdProvider({ enabled, slots, children }: AdProviderProps) {
  const { hasAdConsent } = useAnalyticsContext()

  const adsAllowed = enabled && hasAdConsent
  const shouldLoadScript = adsAllowed && Boolean(ADSENSE_CLIENT_ID)

  return (
    <AdsContext.Provider value={{ enabled: adsAllowed, slots }}>
      {children}
      {shouldLoadScript && (
        <Script
          src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT_ID}`}
          strategy="lazyOnload"
          crossOrigin="anonymous"
        />
      )}
    </AdsContext.Provider>
  )
}

// ============================================================
// Hook
// ============================================================

export function useAdsContext(): AdsContextValue {
  return useContext(AdsContext)
}
