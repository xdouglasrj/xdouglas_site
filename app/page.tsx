import type { Metadata } from 'next'
import { VitrineHeader } from '@/components/layout/VitrineHeader'
import PortfolioCarousel from '@/components/portfolio/PortfolioCarousel'
import DevelopmentProjects from '@/components/portfolio/DevelopmentProjects'

export const metadata: Metadata = {
  title: 'xDouglas — Sites e projetos digitais',
  description: 'Exposição dos sites e projetos digitais criados por Douglas.',
  robots: { index: true, follow: true },
}

export default function RootPage() {
  return (
    <div className="min-h-dvh bg-gate-bg overflow-x-hidden">
      <a
        href="#vitrine-conteudo"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-white focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-black focus:outline-none focus:ring-2 focus:ring-gate-pink"
      >
        Pular para o conteúdo
      </a>
      <VitrineHeader />
      <main
        id="vitrine-conteudo"
        className="mx-auto max-w-[90rem] px-4 sm:px-8 lg:px-[clamp(1rem,5vw,5rem)] pb-12 sm:pb-16"
      >
        <section className="pt-8 sm:pt-12 lg:pt-16">
          <p className="text-[0.75rem] font-semibold uppercase tracking-[0.14em] text-gate-blue">
            Portfólio — xDouglas
          </p>
          <h1
            className="mt-3 max-w-[18ch] font-display text-[clamp(2.5rem,7vw,6.75rem)] font-semibold leading-[0.92] tracking-[-0.03em] text-white"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Sites e projetos digitais criados por Douglas.
          </h1>
          <p className="mt-4 max-w-[42rem] text-[clamp(1rem,1.4vw,1.125rem)] leading-[1.6] text-gate-blue">
            Uma seleção de trabalhos finalizados — cada capa é uma captura real da página do projeto.
          </p>
        </section>

        <section aria-label="Projetos em destaque" className="mt-10 sm:mt-14">
          <PortfolioCarousel />
        </section>
        <DevelopmentProjects />
      </main>
    </div>
  )
}
