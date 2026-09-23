export type PortfolioVisibility = 'public' | 'hidden'

export type PortfolioItem = {
  slug: string
  name: string
  category: string
  description: string
  image: string
  href: string
  visibility: PortfolioVisibility
  external: boolean
}

export const portfolioItems: PortfolioItem[] = [
  {
    slug: 'agenda-ella',
    name: 'Agenda Ella',
    category: 'Agendamento',
    description: 'Agendamento online para profissional que atende sozinha — gestão de horários e clientes.',
    image: '/portfolio/agenda-ella.png',
    href: 'https://www.agendaella.com.br/',
    visibility: 'public',
    external: true,
  },
  {
    slug: 'wl-tour',
    name: 'WL Tour',
    category: 'Turismo e Viagens',
    description: 'Agência de turismo especializada em roteiros personalizados e experiências locais.',
    image: '/portfolio/wl-tour.png',
    href: 'https://www.wlfavelatour.com.br/',
    visibility: 'public',
    external: true,
  },
  {
    slug: 'martins-tuor',
    name: 'Martins Tuor',
    category: 'Turismo',
    description: 'Guia local e passeios no Rio de Janeiro.',
    image: '/portfolio/martins-tour.png',
    href: 'https://www.martinstour.com.br/',
    visibility: 'public',
    external: true,
  },
  {
    slug: 'musica',
    name: 'xDouglas Música',
    category: 'Plataforma Musical',
    description: 'Plataforma de streaming e descoberta de música independente brasileira.',
    image: '/portfolio/xdouglas-musica.png',
    href: '/musica',
    visibility: 'public',
    external: false,
  },
]

export const publicPortfolioItems = portfolioItems.filter((i) => i.visibility === 'public')