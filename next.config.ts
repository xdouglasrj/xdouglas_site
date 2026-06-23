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
  serverExternalPackages: ['@prisma/client', 'bcryptjs', 'sharp'],
}

export default nextConfig
