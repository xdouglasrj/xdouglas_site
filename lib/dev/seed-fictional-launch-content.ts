import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { TRACK_GENRES } from '@/lib/tracks/genres'

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
//   await prisma.forumReply.deleteMany({ where: { authorId: { in: fakeUserIds } } })
//   await prisma.forumThread.deleteMany({ where: { authorId: { in: fakeUserIds } } })
//   await prisma.user.deleteMany({ where: { id: { in: fakeUserIds } } })
// ============================================================

const FICTIONAL_ARTISTS_DATA = [
  { slug: 'neon-cabocla', name: 'Neon Cabocla', bio: 'Mistura forró com synth, ninguém sabe explicar.' },
  { slug: 'dj-tucupi', name: 'DJ Tucupi', bio: 'Bate-estaca amazônico com baixo de Miami.' },
  { slug: 'sereia-do-cerrado', name: 'Sereia do Cerrado', bio: 'Voz de sertão, produção de nave espacial.' },
] as const

const FICTIONAL_GENRES = TRACK_GENRES

const FICTIONAL_TRACK_TITLES = [
  'Bonde do Parquinho', 'Bagulho de Rua', 'Pulso Noturno', 'Resenha de Quintal',
  'Asas do Sertão', 'Remix da Saudade', 'Treme Treme 22', 'Trap da Quebrada',
  'Voo Sideral', 'Samba na Veia', 'Coração Caipira', 'Edit Tropical',
  'Cadência Plástica', 'Voz da Laje', 'Synapse', 'Roda de Domingo',
  'Modão de Verão', 'Mashup 99', 'Beat da Favela', 'Flow Underground',
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

const FICTIONAL_FORUM_THREADS_DATA = [
  {
    authorIndex: 3,
    title: 'Qual BPM vocês usam pra Funk hoje em dia?',
    body: 'Tô na dúvida entre 130 e 140 pra um set de Funk. Quem mais posta aqui costuma fazer o quê?',
    replyAuthorIndex: 0,
    reply: 'Aqui na quebrada tá rolando mais pra 130, mas depende muito do clima da pista.',
  },
  {
    authorIndex: 1,
    title: 'Dica de mixagem pra Rap/Trap com sample pesado',
    body: 'Sempre que coloco um sample mais grave o vocal fica enterrado no Trap. Alguém tem dica de EQ?',
    replyAuthorIndex: 2,
    reply: 'Corta um pouco dos médios do sample e dá um boost leve no vocal, costuma resolver.',
  },
  {
    authorIndex: 0,
    title: 'Remix de Sertanejo pra pista Eletrônica, vale a pena?',
    body: 'Penso em fazer um Remix de uma faixa de Sertanejo pro lado Eletrônico/Pagode. Já tentaram algo assim?',
    replyAuthorIndex: 3,
    reply: 'Já vi rolar muito bem em festa, contanto que o drop não fique forçado.',
  },
] as const

export interface SeedFictionalLaunchContentResult {
  artists: number
  tracks: number
  users: number
  posts: number
  comments: number
  forumThreads: number
  forumReplies: number
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
      update: {
        title: FICTIONAL_TRACK_TITLES[i],
        genre,
        artistId: artist.id,
        producerName: artist.name,
        publishedAt,
      },
      create: {
        slug,
        title: FICTIONAL_TRACK_TITLES[i],
        description: 'Música de demonstração — sem áudio real ainda.',
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

  // Tópicos de fórum com uma resposta cada — fórum fica vazio sem isso
  let forumReplyCount = 0
  for (const t of FICTIONAL_FORUM_THREADS_DATA) {
    const author = users[t.authorIndex]
    const existingThread = await prisma.forumThread.findFirst({
      where: { authorId: author.id, title: t.title },
    })
    const thread =
      existingThread ?? (await prisma.forumThread.create({ data: { authorId: author.id, title: t.title, body: t.body } }))

    const replyAuthor = users[t.replyAuthorIndex]
    const existingReply = await prisma.forumReply.findFirst({
      where: { threadId: thread.id, authorId: replyAuthor.id },
    })
    if (!existingReply) {
      await prisma.forumReply.create({
        data: { threadId: thread.id, authorId: replyAuthor.id, body: t.reply },
      })
      forumReplyCount++
    }
  }

  return {
    artists: artists.length,
    tracks: FICTIONAL_TRACK_TITLES.length,
    users: users.length,
    posts: FICTIONAL_POSTS_DATA.length,
    comments: commentCount,
    forumThreads: FICTIONAL_FORUM_THREADS_DATA.length,
    forumReplies: forumReplyCount,
  }
}
