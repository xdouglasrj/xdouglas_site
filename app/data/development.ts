export type DevelopmentItem = {
  slug: string
  name: string
  category: string
  description: string
  image: string
  href?: string
  external?: boolean
}

export const developmentItems: DevelopmentItem[] = [
  {
    slug: 'ian-raposo',
    name: 'Ian Raposo',
    category: 'Artes visuais',
    description: 'Ian Raposo - artista visual',
    image: '/portfolio/ian-raposo.png',
    href: '/ian-raposo',
  }
]
