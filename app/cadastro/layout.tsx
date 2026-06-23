import Link from 'next/link'

export default function CadastroLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <main className="min-h-screen bg-gate-bg px-4 py-12 sm:py-20">
      <div className="mx-auto w-full max-w-lg">
        <Link href="/" className="mb-10 block text-center">
          <span className="text-2xl font-light text-white">x</span>
          <span className="text-2xl font-semibold text-gate-pink">Douglas</span>
        </Link>
        {children}
      </div>
    </main>
  )
}
