import type { Metadata } from 'next'
import { WaitlistForm } from './waitlist-form'

export const metadata: Metadata = {
  title: 'Lista de espera',
  description: 'Entre na lista de espera e seja um dos primeiros a acessar a plataforma xDouglas.',
}

export default function EsperaPage() {
  return (
    <main className="max-w-lg mx-auto px-4 py-16">
      {/* Header */}
      <div className="mb-8 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-rose-800/60 bg-rose-950/40 text-rose-400 text-xs font-medium mb-4">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
          Acesso antecipado
        </div>
        <h1 className="text-2xl font-bold text-white">Lista de espera</h1>
        <p className="mt-2 text-sm text-neutral-400 leading-relaxed">
          A plataforma está em desenvolvimento. Cadastre-se para ser avisado quando abrir e receber prioridade no acesso.
        </p>
      </div>

      {/* Card com formulário */}
      <div className="rounded-xl border border-neutral-800 bg-neutral-900 px-6 py-8">
        <WaitlistForm />
      </div>

      {/* Rodapé LGPD */}
      <p className="mt-6 text-xs text-neutral-700 text-center leading-relaxed">
        Seus dados são tratados conforme nossa{' '}
        <a href="/privacidade" className="underline hover:text-neutral-500 transition-colors">
          Política de Privacidade
        </a>
        . Você pode solicitar remoção a qualquer momento.
      </p>
    </main>
  )
}
