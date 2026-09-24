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
  },
  {
    slug: 'aura-leblon',
    name: 'Aura Leblon',
    category: 'Restaurante',
    description: 'Gastronomia contemporânea e comida nutritiva no Leblon',
    image: '/portfolio/aura-leblon.png',
    href: '/aura-leblon',
  },
  {
    slug: 'cheirinho-bom',
    name: 'Cheirinho Bom',
    category: 'Doces e confeitaria',
    description: 'Doces, sobremesas e pedidos pelo WhatsApp',
    image: '/portfolio/cheirinho-bom.png',
    href: '/cheirinho-bom',
  },
]
