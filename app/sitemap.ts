import type { MetadataRoute } from 'next'
import { prisma } from '@/lib/prisma'

const SITE_URL = 'https://xdouglas.com.br'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [tracks, artists] = await Promise.all([
    prisma.track.findMany({
      where: { published: true },
      select: { slug: true, updatedAt: true },
    }),
    prisma.artist.findMany({
      where: { active: true, tracks: { some: { published: true } } },
      select: { slug: true, updatedAt: true },
    }),
  ])

  return [
    {
      url: SITE_URL,
      lastModified: new Date(),
      priority: 1,
    },
    ...tracks.map((track) => ({
      url: `${SITE_URL}/musicas/${track.slug}`,
      lastModified: track.updatedAt,
      priority: 0.8,
    })),
    ...artists.map((artist) => ({
      url: `${SITE_URL}/artista/${artist.slug}`,
      lastModified: artist.updatedAt,
      priority: 0.7,
    })),
  ]
}
