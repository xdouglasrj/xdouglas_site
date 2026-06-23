'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAnalyticsContext } from '@/components/analytics/analytics-provider'

// ============================================================
// Constante compartilhada com o AnalyticsProvider
// ============================================================

const CONSENT_KEY = 'xd_consent'

// ============================================================
// ConsentBanner
//
// Estratégia anti-flash:
//   - Renderiza nada até o primeiro useEffect (SSR + hidratação)
//   - Lê localStorage no efeito e decide se exibe
//   - Se já tem consentimento → nunca aparece
//   - Se não tem → aparece com animação suave
//
// Não aparece em /admin (não é necessário e polui o painel)
// ============================================================

export function ConsentBanner() {
  const pathname = usePathname()
  const { giveConsent, revokeConsent } = useAnalyticsContext()

  // 'pending' = ainda não leu o localStorage (SSR / hidratação)
  // 'show'    = precisa mostrar o banner
  // 'hidden'  = não mostrar (já decidiu ou está no /admin)
  const [visibility, setVisibility] = useState<'pending' | 'show' | 'hidden'>('pending')

  useEffect(() => {
    // Não exibe no painel admin
    if (pathname.startsWith('/admin')) {
      setVisibility('hidden')
      return
    }

    const existing = localStorage.getItem(CONSENT_KEY)
    setVisibility(existing !== null ? 'hidden' : 'show')
  }, [pathname])

  function handleAccept() {
    setVisibility('hidden')
    giveConsent()
  }

  function handleDecline() {
    setVisibility('hidden')
    // Persiste a recusa para não mostrar novamente
    localStorage.setItem(CONSENT_KEY, 'false')
    revokeConsent()
  }

  // Não renderiza nada até a hidratação completar — evita flash
  if (visibility !== 'show') return null

  return (
    <div
      role="dialog"
      aria-modal="false"
      aria-label="Aviso de cookies e privacidade"
      aria-live="polite"
      className="fixed bottom-0 left-0 right-0 z-50 p-4 sm:p-6 animate-in slide-in-from-bottom-4 duration-300"
    >
      <div className="max-w-3xl mx-auto rounded-xl border border-neutral-700 bg-neutral-900/95 backdrop-blur-sm shadow-2xl shadow-black/50 p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row gap-4 sm:items-start">

          {/* Ícone */}
          <div className="shrink-0 hidden sm:flex w-8 h-8 rounded-lg bg-neutral-800 items-center justify-center">
            <svg
              className="w-4 h-4 text-neutral-400"
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M8 1a7 7 0 100 14A7 7 0 008 1z" />
              <path d="M8 5v4M8 11v.5" />
            </svg>
          </div>

          {/* Texto */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white">
              Cookies e privacidade
            </p>
            <p className="mt-1 text-xs text-neutral-400 leading-relaxed">
              Usamos cookies para entender como você usa a plataforma e melhorar sua experiência.
              Nenhum dado pessoal identificável é armazenado.{' '}
              <Link
                href="/privacidade"
                className="text-neutral-300 underline hover:text-white transition-colors"
              >
                Política de Privacidade
              </Link>
            </p>
          </div>

          {/* Botões */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleDecline}
              className="px-3 py-1.5 text-xs font-medium text-neutral-400 hover:text-white border border-neutral-700 hover:border-neutral-500 rounded-lg transition-colors"
            >
              Recusar
            </button>
            <button
              onClick={handleAccept}
              className="px-4 py-1.5 text-xs font-medium text-white bg-rose-600 hover:bg-rose-500 active:bg-rose-700 rounded-lg transition-colors"
            >
              Aceitar
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
