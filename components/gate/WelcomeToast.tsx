'use client'

import { useEffect, useState } from 'react'

interface WelcomeToastProps {
  name: string
  firstToday: boolean
}

export function WelcomeToast({ name, firstToday }: WelcomeToastProps) {
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    // Limpa os parâmetros da URL na barra de endereço sem disparar
    // nova navegação/re-render (evitaria desmontar o popup antes da hora)
    window.history.replaceState({}, '', '/inicio')

    const timer = setTimeout(() => setVisible(false), 4000)
    return () => clearTimeout(timer)
  }, [])

  if (!visible) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={() => setVisible(false)}
      />
      <div className="relative w-full max-w-sm rounded-2xl border border-gate-pink/50 bg-gate-bg px-8 py-8 text-center shadow-2xl shadow-gate-pink/20">
        <div className="mb-4 flex justify-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gate-pink/15">
            <svg className="h-7 w-7 text-gate-pink" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
        </div>
        <h2 className="text-xl font-bold text-white">
          {firstToday ? 'Bem-vindo' : 'Bem-vindo de volta'}
          {name ? `, ${name}` : ''}
        </h2>
      </div>
    </div>
  )
}
