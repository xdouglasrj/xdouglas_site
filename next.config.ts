import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        // Cloudflare R2 via CDN público (capas de músicas)
        protocol: 'https',
        hostname: process.env.R2_PUBLIC_HOSTNAME || 'pub-placeholder.r2.dev',
        pathname: '/**',
      },
    ],
  },

  // Headers de segurança padrão
  //
  // V3 Plano 8 — /embed/* precisa ser embutível em <iframe> de qualquer
  // site (é o ponto inteiro do player embedável), então essa rota NÃO
  // recebe X-Frame-Options: DENY. Em vez disso, ganha sua própria CSP
  // com frame-ancestors * (equivalente liberal e explícito, e que os
  // navegadores modernos priorizam sobre X-Frame-Options quando ambos
  // existem). O resto do site continua bloqueando iframe normalmente.
  async headers() {
    return [
      {
        // Exclui /embed/* explicitamente do catch-all (em vez de confiar em
        // "regra mais específica sobrescreve" — o Next.js aplica headers de
        // TODAS as entradas cujo source combine com a rota, então sem essa
        // exclusão o /embed/* receberia X-Frame-Options: DENY desta regra
        // ALÉM da CSP liberada na regra abaixo, quebrando o iframe).
        source: '/((?!embed/).*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
      {
        source: '/embed/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
          { key: 'Content-Security-Policy', value: 'frame-ancestors *' },
        ],
      },
    ]
  },

  // Variáveis que o Edge Middleware pode acessar (sem expor ao client)
  serverExternalPackages: ['@prisma/client', 'bcryptjs', 'sharp', 'ffmpeg-static'],

  // O binário do ffmpeg-static não é "importado" via require/import normal
  // (é referenciado por caminho de arquivo), então o file tracing do Next
  // não inclui ele sozinho na função serverless — força a inclusão aqui.
  // Só a rota de download carrega esse peso extra, não o resto do site.
  outputFileTracingIncludes: {
    '/api/download': ['./node_modules/ffmpeg-static/**'],
    '/ian-raposo/api/media/[id]': ['./public/ian-raposo-media/**'],
  },

  // Catálogo foi renomeado para "Músicas recentes" — preserva links antigos
  async redirects() {
    return [
      {
        source: '/musicas',
        destination: '/musicas-recentes',
        permanent: true,
      },
    ]
  },

  async rewrites() {
    return [
      { source: '/ian-raposo', destination: '/ian-raposo-static/index.html' },
      { source: '/ian-raposo/pinturas', destination: '/ian-raposo-static/index.html' },
      { source: '/ian-raposo/desenhos', destination: '/ian-raposo-static/index.html' },
      { source: '/ian-raposo/obra/:id', destination: '/ian-raposo-static/index.html' },
      { source: '/ian-raposo/sobre', destination: '/ian-raposo-static/index.html' },
      { source: '/ian-raposo/curso', destination: '/ian-raposo-static/index.html' },
      { source: '/ian-raposo/contato', destination: '/ian-raposo-static/index.html' },
      { source: '/aura-leblon', destination: '/aura-leblon-static/index.html' },
      { source: '/aura-leblon/cardapio', destination: '/aura-leblon-static/index.html' },
      { source: '/aura-leblon/menu', destination: '/aura-leblon-static/index.html' },
      { source: '/cheirinho-bom', destination: '/cheirinho-bom-static/index.html' },
    ]
  },
}

export default nextConfig
