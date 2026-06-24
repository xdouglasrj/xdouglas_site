import type { Metadata } from 'next'
import { Suspense } from 'react'
import { ResetPasswordForm } from './reset-password-form'

export const metadata: Metadata = {
  title: 'Redefinir senha',
  robots: { index: false, follow: false },
}

export default function ResetPasswordPage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 bg-gate-bg">
      <div className="mb-8 text-center">
        <span className="font-logo text-4xl text-white">xDouglas</span>
        <p className="mt-1 text-sm text-gate-blue">Recuperação de senha</p>
      </div>

      <div className="w-full max-w-sm">
        <div className="rounded-xl border border-gate-azure bg-gate-bg px-6 py-8">
          <h1 className="text-base font-semibold text-white mb-6">
            Criar nova senha
          </h1>
          <Suspense fallback={<div className="text-sm text-gate-blue">Carregando…</div>}>
            <ResetPasswordForm />
          </Suspense>
        </div>
      </div>

      <p className="mt-8 text-xs text-gate-blue/60">
        Área restrita · xDouglas © {new Date().getFullYear()}
      </p>
    </main>
  )
}
