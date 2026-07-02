'use client'

import { Suspense, createContext, useCallback, useContext, useEffect, useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { GateLoginModal } from '@/components/gate/GateLoginModal'
import { GateSignupModal } from '@/components/gate/GateSignupModal'
import { GateInviteModal } from '@/components/gate/GateInviteModal'
import { safeNextPath } from '@/lib/auth/safe-next-path'

type ModalStep = 'login' | 'signup' | 'invite' | null

interface AuthPopupContextValue {
  openLogin: (next?: string | null) => void
}

const AuthPopupContext = createContext<AuthPopupContextValue | null>(null)

// Qualquer botão "Entrar" do site chama isso em vez de navegar para uma
// página de login dedicada — o popup de auth vive uma vez no layout raiz.
export function useAuthPopup() {
  const ctx = useContext(AuthPopupContext)
  if (!ctx) throw new Error('useAuthPopup precisa estar dentro de <AuthPopupProvider>')
  return ctx
}

export function AuthPopupProvider({ children }: { children: React.ReactNode }) {
  const [step, setStep] = useState<ModalStep>(null)
  const [nextPath, setNextPath] = useState<string | null>(null)

  const openLogin = useCallback((next?: string | null) => {
    setNextPath(safeNextPath(next))
    setStep('login')
  }, [])

  const close = useCallback(() => {
    setStep(null)
    setNextPath(null)
  }, [])

  return (
    <AuthPopupContext.Provider value={{ openLogin }}>
      {children}

      <Suspense fallback={null}>
        <AuthPopupUrlSync onOpenLogin={openLogin} />
      </Suspense>

      <GateLoginModal
        isOpen={step === 'login'}
        onClose={close}
        onSignupClick={() => setStep('signup')}
        next={nextPath}
      />
      <GateSignupModal
        isOpen={step === 'signup'}
        onClose={close}
        onLoginClick={() => setStep('login')}
        onInviteClick={() => setStep('invite')}
      />
      <GateInviteModal
        isOpen={step === 'invite'}
        onClose={close}
        onLoginClick={() => setStep('login')}
      />
    </AuthPopupContext.Provider>
  )
}

// `?login=1&next=...` em qualquer página pública abre o popup automaticamente
// (usado pelo middleware ao proteger rota logada) e depois limpa a URL.
function AuthPopupUrlSync({ onOpenLogin }: { onOpenLogin: (next?: string | null) => void }) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (searchParams.get('login') !== '1') return

    onOpenLogin(searchParams.get('next'))

    const params = new URLSearchParams(searchParams)
    params.delete('login')
    params.delete('next')
    const query = params.toString()
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return null
}
