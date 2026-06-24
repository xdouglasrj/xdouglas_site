import type { Metadata } from 'next'
import { Allison, Manrope, Space_Grotesk } from 'next/font/google'
import { AnalyticsProvider } from '@/components/analytics/analytics-provider'
import { ConsentBanner } from '@/components/consent/consent-banner'
import './globals.css'

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-space-grotesk',
})

const manrope = Manrope({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-manrope',
})

const allison = Allison({
  subsets: ['latin'],
  weight: ['400'],
  variable: '--font-allison',
})

const TEMA_ANTI_FLASH = `
(function () {
  try {
    var salvo = localStorage.getItem('xd_tema');
    var sistema = window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', salvo || sistema);
  } catch (e) {
    document.documentElement.setAttribute('data-theme', 'dark');
  }
})();
`

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
    <html
      lang="pt-BR"
      data-theme="dark"
      suppressHydrationWarning
      className={`${spaceGrotesk.variable} ${manrope.variable} ${allison.variable}`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: TEMA_ANTI_FLASH }} />
      </head>
      <body className="bg-neutral-950 text-white antialiased" suppressHydrationWarning>
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
