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
  async headers() {
    return [
      {
        source: '/(.*)',
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
}

export default nextConfig
