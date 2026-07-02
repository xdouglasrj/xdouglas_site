import Image from 'next/image'
import Link from 'next/link'
import { Topbar } from '@/components/layout/topbar'

// Cabeçalho para visitante anônimo nas páginas públicas de música/gênero/
// artista (§3.1/§3.12 do MAPA-E-PLANO-XDOUGLAS.md) — sem o trilho de
// navegação autenticado (sem sentido pra quem não tem conta), só logo +
// busca + botão de entrar.
export function PublicHeader() {
  return (
    <>
      {/* Mobile */}
      <header className="sticky top-0 z-50 flex h-14 items-center justify-between border-b border-gate-azure bg-gate-bg px-4 md:hidden">
        <Link href="/" aria-label="xDouglas">
          <Image
            src="/brand/xdouglas-logo.png"
            alt="xDouglas"
            width={1200}
            height={675}
            priority
            className="h-8 w-auto object-contain"
          />
        </Link>
        <Link
          href="/?login=1"
          className="rounded-md bg-gate-pink px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90"
        >
          Entrar
        </Link>
      </header>

      {/* Desktop */}
      <Topbar isLoggedIn={false} />
    </>
  )
}
