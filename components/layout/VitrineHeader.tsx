import Link from 'next/link'
import Image from 'next/image'

export function VitrineHeader() {
  return (
    <>
      <header className="sticky top-0 z-50 flex h-14 items-center justify-between border-b border-gate-azure bg-gate-bg px-4 md:hidden">
        <Link href="/inicio" aria-label="xDouglas — página inicial" className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gate-pink focus-visible:ring-offset-2 focus-visible:ring-offset-gate-bg rounded">
          <Image
            src="/brand/xdouglas-logo.png"
            alt="xDouglas"
            width={1200}
            height={675}
            priority
            className="h-8 w-auto object-contain"
          />
        </Link>
        <span className="text-xs font-medium tracking-wide text-gate-blue">Desenvolvedor Web | Produtor Musical</span>
      </header>

      <header className="hidden md:flex h-20 items-center justify-between border-b border-gate-azure bg-gate-bg px-6 lg:px-[clamp(1rem,5vw,5rem)]">
        <Link href="/inicio" aria-label="xDouglas — página inicial" className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gate-pink focus-visible:ring-offset-2 focus-visible:ring-offset-gate-bg rounded">
          <Image
            src="/brand/xdouglas-logo.png"
            alt="xDouglas"
            width={1200}
            height={675}
            priority
            className="h-10 w-auto object-contain"
          />
        </Link>
        <span className="text-sm font-medium tracking-wide text-gate-blue">Desenvolvedor Web | Produtor Musical</span>
      </header>
    </>
  )
}
