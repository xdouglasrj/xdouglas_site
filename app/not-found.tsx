import Link from 'next/link'

export default function NotFound() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 text-center bg-neutral-950">
      <p className="text-6xl font-bold text-neutral-800 mb-4">404</p>
      <h1 className="text-xl font-semibold text-white mb-2">
        Página não encontrada
      </h1>
      <p className="text-sm text-neutral-500 mb-8 max-w-xs">
        A faixa que você procura não existe ou foi removida.
      </p>
      <Link
        href="/musicas"
        className="px-5 py-2.5 text-sm font-medium text-white bg-rose-600 hover:bg-rose-500 rounded-lg transition-colors"
      >
        Voltar ao catálogo
      </Link>
    </main>
  )
}
