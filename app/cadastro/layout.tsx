import Link from 'next/link'
import { Breadcrumbs } from '@/components/ui/breadcrumbs'

export default function CadastroLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <main className="min-h-screen bg-gate-bg px-4 py-12 sm:py-20">
      <div className="mx-auto w-full max-w-lg">
        <Link href="/" className="font-logo mb-10 block text-center text-4xl text-white">
          xDouglas
        </Link>
        <Breadcrumbs className="justify-center" />
        {children}
      </div>
    </main>
  )
}
