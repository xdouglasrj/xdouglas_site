import type { Metadata } from 'next'
import { Suspense } from 'react'
import { LoginForm } from './login-form'

export const metadata: Metadata = {
  title: 'Acesso admin',
  robots: { index: false, follow: false },
}

export default function AdminLoginPage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 bg-neutral-950">
      {/* Logo / identidade */}
      <div className="mb-8 text-center">
        <span className="text-2xl font-bold tracking-tight text-white">
          x<span className="text-rose-500">Douglas</span>
        </span>
        <p className="mt-1 text-sm text-neutral-500">Painel administrativo</p>
      </div>

      {/* Card de login */}
      <div className="w-full max-w-sm">
        <div className="rounded-xl border border-neutral-800 bg-neutral-900 px-6 py-8">
          <h1 className="text-base font-semibold text-white mb-6">
            Entrar
          </h1>
          <Suspense fallback={<div className="text-sm text-neutral-500">Carregando…</div>}>
            <LoginForm />
          </Suspense>
        </div>
      </div>

      {/* Rodapé discreto */}
      <p className="mt-8 text-xs text-neutral-700">
        Área restrita · xDouglas © {new Date().getFullYear()}
      </p>
    </main>
  )
}
