import Image from 'next/image'
import Link from 'next/link'

export function BrandBar() {
  return (
    <header className="fixed inset-x-0 top-0 z-50 flex h-14 items-center justify-center border-b border-gate-azure bg-gate-bg">
      <Link href="/inicio" aria-label="xDouglas" className="flex items-center">
        <Image
          src="/brand/xdouglas-logo.png"
          alt="xDouglas"
          width={1200}
          height={675}
          priority
          className="h-8 w-auto object-contain"
        />
      </Link>
    </header>
  )
}
