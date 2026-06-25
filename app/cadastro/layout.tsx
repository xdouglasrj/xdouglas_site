import { BrandBar } from '@/components/layout/brand-bar'
import { Breadcrumbs } from '@/components/ui/breadcrumbs'

export default function CadastroLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <main className="min-h-screen bg-gate-bg pt-14 px-4 pb-12 sm:pb-20">
      <BrandBar />
      <div className="mx-auto w-full max-w-lg pt-12 sm:pt-20">
        <Breadcrumbs className="justify-center" />
        {children}
      </div>
    </main>
  )
}
