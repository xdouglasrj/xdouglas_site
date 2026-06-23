import Link from 'next/link'

export function PublicHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-neutral-800/60 bg-neutral-950/90 backdrop-blur-sm">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
        {/* Logo — mantém o usuário na área logada, não volta para o portão de login */}
        <Link
          href="/inicio"
          className="text-lg font-bold tracking-tight text-white hover:opacity-80 transition-opacity"
        >
          x<span className="text-rose-500">Douglas</span>
        </Link>

        {/* Nav */}
        <nav className="flex items-center gap-1">
          <Link
            href="/musicas"
            className="px-3 py-1.5 text-sm text-neutral-400 hover:text-white rounded-md hover:bg-neutral-800 transition-colors"
          >
            Músicas
          </Link>
          <Link
            href="/espera"
            className="ml-2 px-3 py-1.5 text-sm font-medium text-white bg-rose-600 hover:bg-rose-500 rounded-md transition-colors"
          >
            Entrar na lista
          </Link>
        </nav>
      </div>
    </header>
  )
}
