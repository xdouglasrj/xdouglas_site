import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import { seedFictionalLaunchContent } from '../lib/dev/seed-fictional-launch-content'
import { STORE_CATALOG } from '../lib/store/catalog'

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
  // Catálogo da loja de pontos — roda sempre (não só dev), preço inicial
  // só é aplicado na criação; se o item já existir, não sobrescreve o
  // preço (pode já ter sido reajustado pelo mercado de oferta/demanda)
  // ============================================================

  for (const item of STORE_CATALOG) {
    await prisma.storeItem.upsert({
      where: { key: item.key },
      update: {},
      create: {
        key: item.key,
        label: item.label,
        audience: item.audience,
        price: item.price,
        maxConcurrent: item.maxConcurrent,
        saleWindowHours: item.saleWindowHours,
        saleWindowLimit: item.saleWindowLimit,
        durationHours: item.durationHours,
        maxPurchasesPerUser: item.maxPurchasesPerUser,
      },
    })
  }
  console.log(`✅ Catálogo da loja: ${STORE_CATALOG.length} itens`)

  // ============================================================
  // Threads oficiais do fórum — regras de pontos e regras/punições de
  // convite. Fixadas no topo, postadas como admin. Editáveis depois
  // direto no fórum (são posts normais, só marcados pinned).
  // ============================================================

  // Conteúdo oficial sincronizado pelo código a cada seed (update se já
  // existir) — garante que números mudados em lib/points/levels.ts ou no
  // catálogo da loja não fiquem desatualizados na thread. Se o admin
  // editar manualmente pelo fórum, o próximo seed sobrescreve.
  const pointsRulesTitle = 'Como funciona o sistema de pontos'
  const pointsRulesBody = [
    'Toda interação na comunidade gera XP, que vira nível e dá acesso a itens exclusivos na loja.',
    '',
    'Como ganhar pontos:',
    '- Criar conta: +50 | Completar perfil: +100 | Adicionar foto: +20 | Primeiro login: +10',
    '- Login diário: +5 (a cada 7 dias seguidos, +100 de bônus)',
    '- Curtir música: +2 (até 20/dia) | Comentar: +5 (até 10/dia) | Compartilhar: +10 (até 10/dia)',
    '- Ouvir música até o fim (app): +3 (até 30/dia) | Criar playlist: +20 (até 3/dia)',
    '- Publicar música (artista): +100 (até 2/dia)',
    '- Indicar alguém que confirma o cadastro: +300',
    '- Faixa atingir 1.000 plays: +500',
    '',
    'Níveis: Descobridor (0+) → Explorador (15.001+) → Influenciador (50.001+) → Lenda Musical (500.001+).',
    '',
    'Loja: pontos trocam por convite prioritário, destaque de faixa, fixar comentário, armazenamento extra, mapeamento de estatísticas e conta premium no futuro app — cada item tem limite de uso e o preço sobe conforme mais gente alcança o item mais caro.',
  ].join('\n')

  const existingPointsThread = await prisma.forumThread.findFirst({ where: { title: pointsRulesTitle } })
  if (existingPointsThread) {
    await prisma.forumThread.update({ where: { id: existingPointsThread.id }, data: { body: pointsRulesBody, pinned: true } })
    console.log('✅ Thread oficial atualizada: regras de pontos')
  } else {
    await prisma.forumThread.create({
      data: { authorId: admin.id, title: pointsRulesTitle, pinned: true, body: pointsRulesBody },
    })
    console.log('✅ Thread oficial criada: regras de pontos')
  }

  const inviteRulesTitle = 'Regras de convite e punições'
  const existingInviteThread = await prisma.forumThread.findFirst({ where: { title: inviteRulesTitle } })
  if (!existingInviteThread) {
    await prisma.forumThread.create({
      data: {
        authorId: admin.id,
        title: inviteRulesTitle,
        pinned: true,
        body: [
          'A entrada na comunidade é por convite. Os primeiros 1.000 convites são gratuitos; depois disso, convites continuam saindo só por aceite manual do time — pontos compram apenas prioridade na fila, nunca pulam essa aprovação.',
          '',
          'Indicar alguém: troque pontos por "Convite prioritário" na loja e informe o email da pessoa. Quando o cadastro dela for confirmado, você ganha +300 pontos.',
          '',
          'Punições por abuso (ex.: indicar contas falsas ou em massa):',
          '1ª ocorrência: os 300 pontos daquela indicação são cancelados.',
          '2ª ocorrência: a função de convidar fica bloqueada por um período.',
          '3ª ocorrência / abuso grave: a conta é suspensa.',
          '',
          'Esses critérios podem ser ajustados pelo time conforme a comunidade cresce.',
        ].join('\n'),
      },
    })
    console.log('✅ Thread oficial criada: regras de convite')
  }

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
      update: { genre: 'Eletrônico' },
      create: {
        slug: 'track-exemplo-01',
        title: 'Noite Funda (Original Mix)',
        description: 'Eletrônica progressiva para as madrugadas.',
        genre: 'Eletrônico',
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
        `${fictionalResult.posts} posts, ${fictionalResult.comments} comentários, ` +
        `${fictionalResult.forumThreads} tópicos de fórum, ${fictionalResult.forumReplies} respostas`
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
