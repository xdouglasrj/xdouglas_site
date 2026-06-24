'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { useSearchParams } from 'next/navigation'
import { GateLoginModal } from '@/components/gate/GateLoginModal'
import { GateSignupModal } from '@/components/gate/GateSignupModal'
import { GateInviteModal } from '@/components/gate/GateInviteModal'
import { onLoginBroadcast } from '@/lib/auth/cross-tab-logout'
import { ThemeToggle } from '@/components/ui/theme-toggle'

type Modal = 'login' | 'signup' | 'invite' | null

export function GateContent() {
  const searchParams = useSearchParams()
  const [modal, setModal] = useState<Modal>(searchParams.get('login') ? 'login' : null)

  // Se outra aba fizer login, esta aba acompanha imediatamente —
  // recarrega para o Server Component reavaliar a sessão e redirecionar
  useEffect(() => onLoginBroadcast(() => { window.location.reload() }), [])

  return (
    <div className="flex min-h-screen flex-col bg-gate-bg">
      <div className="fixed right-4 top-4 z-10">
        <ThemeToggle />
      </div>

      <main className="flex flex-1 flex-col items-center justify-center gap-10 px-4 text-center">
        <Image
          src="/brand/xdouglas-logo.png"
          alt="xDouglas"
          width={1000}
          height={1000}
          priority
          className="h-[28rem] w-auto object-contain sm:h-[36rem] md:h-[42rem]"
        />

        <button
          onClick={() => setModal('login')}
          className="rounded-lg border border-gate-pink bg-gate-pink/10 px-10 py-3 text-base font-semibold text-white transition hover:bg-gate-pink hover:shadow-lg hover:shadow-gate-pink/30"
        >
          Entrar
        </button>
      </main>

      <footer className="border-t border-gate-azure px-4 py-6 text-center">
        <p className="text-xs text-gate-blue">
          © {new Date().getFullYear()} xDouglas · Comunidade musical independente
        </p>
      </footer>

      <GateLoginModal
        isOpen={modal === 'login'}
        onClose={() => setModal(null)}
        onSignupClick={() => setModal('signup')}
      />
      <GateSignupModal
        isOpen={modal === 'signup'}
        onClose={() => setModal(null)}
        onLoginClick={() => setModal('login')}
        onInviteClick={() => setModal('invite')}
      />
      <GateInviteModal
        isOpen={modal === 'invite'}
        onClose={() => setModal(null)}
        onLoginClick={() => setModal('login')}
      />
    </div>
  )
}
