import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

// ============================================================
// CONTEÚDO FICTÍCIO DE LANÇAMENTO — NÃO É CONTEÚDO REAL
//
// Popula o catálogo e o feed com músicas, artistas, usuários,
// posts e comentários inventados, só para a plataforma não
// parecer vazia enquanto não há uploads/posts reais.
//
// Como identificar para apagar depois (quando houver conteúdo real):
//   - Tracks:  slug começa com "seed-ficticia-"
//   - Artists: slug em ('neon-cabocla', 'dj-tucupi', 'sereia-do-cerrado')
//   - Users:   email termina em "@exemplo.com"
//   - Posts/Comments: authorId pertence a um desses usuários fictícios
//
// Exemplo de limpeza futura (rodar manualmente quando quiser remover):
//   await prisma.track.deleteMany({ where: { slug: { startsWith: 'seed-ficticia-' } } })
//   await prisma.artist.deleteMany({ where: { slug: { in: ['neon-cabocla', 'dj-tucupi', 'sereia-do-cerrado'] } } })
//   const fakeUserIds = (await prisma.user.findMany({ where: { email: { endsWith: '@exemplo.com' } }, select: { id: true } })).map(u => u.id)
//   await prisma.comment.deleteMany({ where: { authorId: { in: fakeUserIds } } })
//   await prisma.like.deleteMany({ where: { userId: { in: fakeUserIds } } })
//   await prisma.post.deleteMany({ where: { authorId: { in: fakeUserIds } } })
//   await prisma.user.deleteMany({ where: { id: { in: fakeUserIds } } })
// ============================================================

const FICTIONAL_ARTISTS_DATA = [
  { slug: 'neon-cabocla', name: 'Neon Cabocla', bio: 'Mistura forró com synth, ninguém sabe explicar.' },
  { slug: 'dj-tucupi', name: 'DJ Tucupi', bio: 'Bate-estaca amazônico com baixo de Miami.' },
  { slug: 'sereia-do-cerrado', name: 'Sereia do Cerrado', bio: 'Voz de sertão, produção de nave espacial.' },
] as const

const FICTIONAL_GENRES = [
  'Forró Cyberpunk', 'Trap Caipira', 'Synthwave Tropical', 'Brega Espacial',
  'Pagode Industrial', 'Funk Gregoriano', 'Sertanejo Gótico', 'Axé Lo-fi',
] as const

const FICTIONAL_TRACK_TITLES = [
  'Saudade.exe', 'Cupido Bugado', 'Madrugada 404', 'Beat de Liquidificador',
  'Coração em Loop', 'Roça Neon', 'Pix na Veia', 'Forrobodó Quântico',
  'Sina Digital', 'Arrocha Interestelar', 'Modão Holográfico', 'Vaquejada Turbo',
  'Carimbó Robô', 'Brega Binário', 'Cangaço Synth', 'Vapor Sertanejo',
  'Tecnobrega 2.0', 'Caatinga Bass', 'Xote do Futuro', 'Forró 8-bit',
] as const

const FICTIONAL_USERS_DATA = [
  { email: 'lua.beats@exemplo.com', username: 'luabeats', name: 'Lua Beats', artisticName: 'Lua Beats', role: 'ARTIST' as const },
  { email: 'rafa.mc@exemplo.com', username: 'rafamc', name: 'Rafa MC', artisticName: 'Rafa MC', role: 'ARTIST' as const },
  { email: 'carol.ouvinte@exemplo.com', username: 'carolm', name: 'Carol Martins', artisticName: null, role: 'MEMBER' as const },
  { email: 'pedro.dj@exemplo.com', username: 'pedrodj', name: 'Pedro Andrade', artisticName: 'DJ Pedrin', role: 'ARTIST' as const },
] as const

const FICTIONAL_POSTS_DATA = [
  { authorIndex: 0, content: 'Acabei de subir uma faixa nova pro catálogo 🎶 bora ouvir e dar feedback!' },
  { authorIndex: 1, content: 'Alguém topa um remix colab essa semana? Tô com uma ideia de flow novo.' },
  { authorIndex: 2, content: 'Tô amando a vibe dessa comunidade, muito bom ver gente trocando sobre produção aqui.' },
] as const

export interface SeedFictionalLaunchContentResult {
  artists: number
  tracks: number
  users: number
  posts: number
  comments: number
}

/** Idempotente — pode ser chamado várias vezes sem duplicar nada. */
export async function seedFictionalLaunchContent(
  prisma: PrismaClient
): Promise<SeedFictionalLaunchContentResult> {
  // Artistas fictícios
  const artists = await Promise.all(
    FICTIONAL_ARTISTS_DATA.map((a) =>
      prisma.artist.upsert({ where: { slug: a.slug }, update: {}, create: { ...a, active: true } })
    )
  )

  // 20 músicas fictícias — sem áudio real, espalhadas na última hora a hora
  // (todas dentro da janela padrão de exibição de 24h)
  for (let i = 0; i < FICTIONAL_TRACK_TITLES.length; i++) {
    const slug = `seed-ficticia-${String(i + 1).padStart(2, '0')}`
    const artist = artists[i % artists.length]
    const genre = FICTIONAL_GENRES[i % FICTIONAL_GENRES.length]
    const publishedAt = new Date(Date.now() - i * 60 * 60 * 1000)

    await prisma.track.upsert({
      where: { slug },
      update: { publishedAt },
      create: {
        slug,
        title: FICTIONAL_TRACK_TITLES[i],
        description: 'Música de demonstração — gênero fictício, sem áudio real ainda.',
        genre,
        bpm: 90 + ((i * 7) % 60),
        artistId: artist.id,
        producerName: artist.name,
        audioKey: `seed/placeholder-${slug}.mp3`,
        audioFormat: 'mp3',
        published: true,
        publishedAt,
      },
    })
  }

  // Usuários fictícios — autores dos posts/comentários de demonstração
  const fakeUserPassword = await bcrypt.hash('xdouglas_demo_2024!', 12)
  const users = await Promise.all(
    FICTIONAL_USERS_DATA.map((u) =>
      prisma.user.upsert({
        where: { email: u.email },
        update: {},
        create: {
          email: u.email,
          username: u.username,
          password: fakeUserPassword,
          name: u.name,
          artisticName: u.artisticName,
          role: u.role,
          active: true,
          showEmail: u.role === 'ARTIST',
        },
      })
    )
  )

  // Posts de feed com curtidas e comentários
  let commentCount = 0
  for (const p of FICTIONAL_POSTS_DATA) {
    const author = users[p.authorIndex]
    const existing = await prisma.post.findFirst({ where: { authorId: author.id, content: p.content } })
    const post = existing ?? (await prisma.post.create({ data: { authorId: author.id, content: p.content } }))

    const likers = users.filter((u) => u.id !== author.id).slice(0, 2)
    for (const liker of likers) {
      await prisma.like.upsert({
        where: { postId_userId: { postId: post.id, userId: liker.id } },
        update: {},
        create: { postId: post.id, userId: liker.id },
      })
    }

    const commenter = users.find((u) => u.id !== author.id)
    if (commenter) {
      const existingComment = await prisma.comment.findFirst({ where: { postId: post.id, authorId: commenter.id } })
      if (!existingComment) {
        await prisma.comment.create({
          data: { postId: post.id, authorId: commenter.id, content: 'Show de bola, parabéns! 🔥' },
        })
        commentCount++
      }
    }
  }

  return {
    artists: artists.length,
    tracks: FICTIONAL_TRACK_TITLES.length,
    users: users.length,
    posts: FICTIONAL_POSTS_DATA.length,
    comments: commentCount,
  }
}
