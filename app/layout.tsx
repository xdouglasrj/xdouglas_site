import type { Metadata } from 'next'
import { AnalyticsProvider } from '@/components/analytics/analytics-provider'
import { ConsentBanner } from '@/components/consent/consent-banner'
import './globals.css'

export const metadata: Metadata = {
  title: {
    default: 'xDouglas está de volta',
    template: '%s | xDouglas',
  },
  description:
    'Plataforma privada para produtores, DJs e artistas. Música, cultura e comunidade.',
  robots: {
    index: false,
    follow: false,
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR">
      <body className="bg-neutral-950 text-white antialiased">
        <AnalyticsProvider>
          {children}
          {/*
            ConsentBanner vive dentro do AnalyticsProvider para ter
            acesso a giveConsent() e revokeConsent() via contexto.
            O banner suprime a si mesmo em /admin e quando o usuário
            já decidiu (localStorage xd_consent existe).
          */}
          <ConsentBanner />
        </AnalyticsProvider>
      </body>
    </html>
  )
}
