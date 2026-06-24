import type { Metadata } from 'next'
import Link from 'next/link'
import { ForgotPasswordForm } from './forgot-password-form'

export const metadata: Metadata = {
  title: 'Esqueci minha senha',
  robots: { index: false, follow: false },
}

export default function ForgotPasswordPage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 bg-gate-bg">
      <div className="mb-8 text-center">
        <span className="font-logo text-4xl text-white">xDouglas</span>
        <p className="mt-1 text-sm text-gate-blue">Recuperação de senha</p>
      </div>

      <div className="w-full max-w-sm">
        <div className="rounded-xl border border-gate-azure bg-gate-bg px-6 py-8">
          <h1 className="text-base font-semibold text-white mb-2">
            Esqueci minha senha
          </h1>
          <p className="text-sm text-gate-blue mb-6">
            Informe seu email ou usuário. Se encontrarmos sua conta, enviaremos um link
            para você criar uma nova senha.
          </p>
          <ForgotPasswordForm />

          <Link
            href="/?login=1"
            className="mt-6 block text-center text-xs text-gate-blue transition-colors hover:text-gate-pink"
          >
            Voltar para o login
          </Link>
        </div>
      </div>

      <p className="mt-8 text-xs text-gate-blue/60">
        Área restrita · xDouglas © {new Date().getFullYear()}
      </p>
    </main>
  )
}
