import type { MetadataRoute } from 'next'

const SITE_URL = 'https://xdouglas.com.br'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: ['/musicas', '/generos', '/artista'],
      disallow: [
        '/admin',
        '/api',
        '/forum',
        '/loja',
        '/perfil',
        '/comentarios',
        '/suporte',
        '/notificacoes',
        '/biblioteca',
        '/upload',
        '/minhas-musicas',
      ],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  }
}
