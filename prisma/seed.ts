import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import { seedFictionalLaunchContent } from '../lib/dev/seed-fictional-launch-content'

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
    // Conteúdo fictício de lançamento (músicas, artistas, usuários,
    // posts e comentários) — ver lib/dev/seed-fictional-launch-content.ts
    // para os detalhes e como identificar/apagar depois.
    // ============================================================

    const fictionalResult = await seedFictionalLaunchContent(prisma)
    console.log(
      `✅ Conteúdo fictício: ${fictionalResult.tracks} músicas, ${fictionalResult.users} usuários, ` +
        `${fictionalResult.posts} posts, ${fictionalResult.comments} comentários`
    )

    // Usuários fictícios também usados no fórum/denúncias abaixo (dev only)
    const fakeUsers = await prisma.user.findMany({
      where: { email: { endsWith: '@exemplo.com' } },
      orderBy: { createdAt: 'asc' },
    })
    const lua = fakeUsers.find((u) => u.email === 'lua.beats@exemplo.com')!
    const rafa = fakeUsers.find((u) => u.email === 'rafa.mc@exemplo.com')!
    const carol = fakeUsers.find((u) => u.email === 'carol.ouvinte@exemplo.com')!
    const pedro = fakeUsers.find((u) => u.email === 'pedro.dj@exemplo.com')!

    // ============================================================
    // Conteúdo fictício — seguir, fórum e denúncias
    // Só roda em desenvolvimento, para visualização das telas novas.
    // Apague este bloco quando quiser substituir por conteúdo real.
    // ============================================================

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
