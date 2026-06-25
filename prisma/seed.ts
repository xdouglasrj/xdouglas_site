import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Iniciando seed do banco...')

  // ============================================================
  // Admin inicial
  // ============================================================

  const adminEmail = process.env.SEED_ADMIN_EMAIL ?? 'admin@xdouglas.com'
  const adminUsername = process.env.SEED_ADMIN_USERNAME ?? 'admin'
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? 'xdouglas_admin_2024!'

  const hashedPassword = await bcrypt.hash(adminPassword, 12)

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: { username: adminUsername },
    create: {
      email: adminEmail,
      username: adminUsername,
      password: hashedPassword,
      name: 'Admin xDouglas',
      role: 'ADMIN',
      active: true,
    },
  })

  console.log(`✅ Admin criado: ${admin.email}`)

  // ============================================================
  // Chave de hash inicial para analytics
  // ============================================================

  const now = new Date()
  const periodStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)

  const existingKey = await prisma.analyticsHashKey.findFirst({
    where: { active: true },
  })

  if (!existingKey) {
    // Cria chave inicial com salt aleatório
    // Em produção, ANALYTICS_ENCRYPTION_KEY deve estar definida
    const rawSalt = crypto.randomBytes(32).toString('hex')
    // Salt armazenado em texto puro apenas no seed (dev)
    // Em produção, a função createHashKey() em lib/analytics/hash.ts criptografa
    await prisma.analyticsHashKey.create({
      data: {
        saltEncrypted: rawSalt, // será substituído pela versão criptografada em prod
        periodStart,
        periodEnd,
        active: true,
      },
    })
    console.log('✅ Chave de hash analytics criada')
  }

  // ============================================================
  // Artista de exemplo (para desenvolvimento)
  // ============================================================

  if (process.env.NODE_ENV === 'development') {
    const artist = await prisma.artist.upsert({
      where: { slug: 'douglas-original' },
      update: {},
      create: {
        slug: 'douglas-original',
        name: 'Douglas Original',
        bio: 'Produtor e DJ da cena underground. Mais de 15 anos na pista.',
        active: true,
      },
    })

    console.log(`✅ Artista de exemplo: ${artist.name}`)

    // Track de exemplo
    await prisma.track.upsert({
      where: { slug: 'track-exemplo-01' },
      update: {},
      create: {
        slug: 'track-exemplo-01',
        title: 'Noite Funda (Original Mix)',
        description: 'Techno progressivo para as madrugadas.',
        genre: 'Techno',
        bpm: 138,
        artistId: artist.id,
        producerName: 'Douglas Original',
        audioKey: 'audio/track-exemplo-01.mp3',
        audioFormat: 'mp3',
        coverKey: 'covers/track-exemplo-01.jpg',
        published: true,
        publishedAt: new Date(),
      },
    })

    console.log('✅ Track de exemplo criada')

    // ============================================================
    // 20 músicas fictícias — gêneros inventados, sem áudio real,
    // só para popular a tela de "Músicas recentes" e testar
    // paginação/expiração antes de existir conteúdo real.
    // Apague este bloco quando substituir por uploads reais.
    // ============================================================

    const fictionalArtistsData = [
      { slug: 'neon-cabocla', name: 'Neon Cabocla', bio: 'Mistura forró com synth, ninguém sabe explicar.' },
      { slug: 'dj-tucupi', name: 'DJ Tucupi', bio: 'Bate-estaca amazônico com baixo de Miami.' },
      { slug: 'sereia-do-cerrado', name: 'Sereia do Cerrado', bio: 'Voz de sertão, produção de nave espacial.' },
    ]

    const fictionalArtists = await Promise.all(
      fictionalArtistsData.map((a) =>
        prisma.artist.upsert({ where: { slug: a.slug }, update: {}, create: { ...a, active: true } })
      )
    )

    const fictionalGenres = [
      'Forró Cyberpunk', 'Trap Caipira', 'Synthwave Tropical', 'Brega Espacial',
      'Pagode Industrial', 'Funk Gregoriano', 'Sertanejo Gótico', 'Axé Lo-fi',
    ]

    const fictionalTitles = [
      'Saudade.exe', 'Cupido Bugado', 'Madrugada 404', 'Beat de Liquidificador',
      'Coração em Loop', 'Roça Neon', 'Pix na Veia', 'Forrobodó Quântico',
      'Sina Digital', 'Arrocha Interestelar', 'Modão Holográfico', 'Vaquejada Turbo',
      'Carimbó Robô', 'Brega Binário', 'Cangaço Synth', 'Vapor Sertanejo',
      'Tecnobrega 2.0', 'Caatinga Bass', 'Xote do Futuro', 'Forró 8-bit',
    ]

    for (let i = 0; i < fictionalTitles.length; i++) {
      const slug = `seed-ficticia-${String(i + 1).padStart(2, '0')}`
      const artist = fictionalArtists[i % fictionalArtists.length]
      const genre = fictionalGenres[i % fictionalGenres.length]
      // Espalhadas na última hora a hora, todas dentro da janela padrão de exibição (24h)
      const publishedAt = new Date(Date.now() - i * 60 * 60 * 1000)

      await prisma.track.upsert({
        where: { slug },
        update: { publishedAt },
        create: {
          slug,
          title: fictionalTitles[i],
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

    console.log(`✅ ${fictionalTitles.length} músicas fictícias criadas`)

    // ============================================================
    // Conteúdo fictício — seguir, feed, fórum e denúncias
    // Só roda em desenvolvimento, para visualização das telas novas.
    // Apague este bloco quando quiser substituir por conteúdo real.
    // ============================================================

    const fakeUserPassword = await bcrypt.hash('xdouglas_demo_2024!', 12)

    const fakeUsersData = [
      { email: 'lua.beats@exemplo.com', username: 'luabeats', name: 'Lua Beats', artisticName: 'Lua Beats', role: 'ARTIST' as const },
      { email: 'rafa.mc@exemplo.com', username: 'rafamc', name: 'Rafa MC', artisticName: 'Rafa MC', role: 'ARTIST' as const },
      { email: 'carol.ouvinte@exemplo.com', username: 'carolm', name: 'Carol Martins', artisticName: null, role: 'MEMBER' as const },
      { email: 'pedro.dj@exemplo.com', username: 'pedrodj', name: 'Pedro Andrade', artisticName: 'DJ Pedrin', role: 'ARTIST' as const },
    ]

    const fakeUsers = await Promise.all(
      fakeUsersData.map((u) =>
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

    const [lua, rafa, carol, pedro] = fakeUsers
    console.log(`✅ ${fakeUsers.length} usuários fictícios criados`)

    // Follows — uma pequena rede entre os fictícios e o admin
    const followPairs: [string, string][] = [
      [carol.id, lua.id],
      [carol.id, rafa.id],
      [rafa.id, lua.id],
      [lua.id, pedro.id],
      [pedro.id, lua.id],
      [admin.id, lua.id],
    ]
    for (const [followerId, followingId] of followPairs) {
      await prisma.follow.upsert({
        where: { followerId_followingId: { followerId, followingId } },
        update: {},
        create: { followerId, followingId },
      })
    }
    console.log(`✅ ${followPairs.length} relações de "seguir" criadas`)

    // Posts de feed com curtidas e comentários
    const postsData = [
      { author: lua, content: 'Acabei de subir uma faixa nova pro catálogo 🎶 bora ouvir e dar feedback!' },
      { author: rafa, content: 'Alguém topa um remix colab essa semana? Tô com uma ideia de flow novo.' },
      { author: carol, content: 'Tô amando a vibe dessa comunidade, muito bom ver gente trocando sobre produção aqui.' },
    ]

    for (const p of postsData) {
      const existing = await prisma.post.findFirst({ where: { authorId: p.author.id, content: p.content } })
      const post = existing ?? (await prisma.post.create({ data: { authorId: p.author.id, content: p.content } }))

      // Curtidas cruzadas
      const likers = fakeUsers.filter((u) => u.id !== p.author.id).slice(0, 2)
      for (const liker of likers) {
        await prisma.like.upsert({
          where: { postId_userId: { postId: post.id, userId: liker.id } },
          update: {},
          create: { postId: post.id, userId: liker.id },
        })
      }

      // Um comentário de exemplo
      const commenter = fakeUsers.find((u) => u.id !== p.author.id)
      if (commenter && !(await prisma.comment.findFirst({ where: { postId: post.id, authorId: commenter.id } }))) {
        await prisma.comment.create({
          data: { postId: post.id, authorId: commenter.id, content: 'Show de bola, parabéns! 🔥' },
        })
      }
    }
    console.log('✅ Posts fictícios do feed criados (com curtidas e comentários)')

    // Tópicos de fórum com respostas
    const existingThread = await prisma.forumThread.findFirst({ where: { title: 'Qual DAW vocês usam pra mixar?' } })
    const thread = existingThread ?? (await prisma.forumThread.create({
      data: {
        authorId: pedro.id,
        title: 'Qual DAW vocês usam pra mixar?',
        body: 'Tô pensando em migrar do FL pro Ableton. Quem usa os dois, vale a pena? Quero ouvir experiências de quem já produz aqui na comunidade.',
      },
    }))

    if (!(await prisma.forumReply.findFirst({ where: { threadId: thread.id, authorId: lua.id } }))) {
      await prisma.forumReply.create({
        data: { threadId: thread.id, authorId: lua.id, body: 'Uso os dois! Ableton é ótimo pra performance ao vivo, FL ainda ganha em produção rápida de beat.' },
      })
    }
    if (!(await prisma.forumReply.findFirst({ where: { threadId: thread.id, authorId: rafa.id } }))) {
      await prisma.forumReply.create({
        data: { threadId: thread.id, authorId: rafa.id, body: 'Migrei ano passado e não volto mais, a organização por sessão view ajuda muito.' },
      })
    }
    console.log('✅ Tópico de fórum fictício criado (com respostas)')

    // Denúncia pendente de exemplo, pra moderação ter algo pra mostrar
    const examplePost = await prisma.post.findFirst({ where: { authorId: rafa.id } })
    if (examplePost && !(await prisma.report.findFirst({ where: { targetId: examplePost.id, targetType: 'POST' } }))) {
      await prisma.report.create({
        data: {
          reporterId: carol.id,
          targetType: 'POST',
          targetId: examplePost.id,
          reason: 'Conteúdo de exemplo só para testar a tela de denúncias do admin.',
        },
      })
      console.log('✅ Denúncia fictícia criada (pendente)')
    }
  }

  console.log('\n🎵 Seed concluído!')
  console.log(`   Admin: ${adminEmail}`)
  console.log(`   Senha: ${adminPassword}`)
  console.log('\n⚠️  Troque a senha após o primeiro login em produção.')
}

main()
  .catch((err) => {
    console.error('❌ Erro no seed:', err)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
