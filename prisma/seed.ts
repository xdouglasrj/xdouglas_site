import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import { seedFictionalLaunchContent } from '../lib/dev/seed-fictional-launch-content'
import { STORE_CATALOG } from '../lib/store/catalog'

const prisma = new PrismaClient()

// ============================================================
// Helpers
// ============================================================

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // remove acentos
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

// ============================================================
// Árvore de gêneros musicais (seção 3.16 do MAPA-E-PLANO)
// Estrutura: { name, children? }
// ============================================================

type GenreNode = { name: string; children?: string[] }

const GENRE_TREE: GenreNode[] = [
  // ——— Brasileiros ———
  {
    name: 'Música Popular Brasileira (MPB)',
    children: ['MPB', 'Nova MPB', 'MPB contemporânea', 'Samba-canção', 'Canção brasileira'],
  },
  {
    name: 'Samba e derivados',
    children: [
      'Samba',
      'Samba-enredo',
      'Samba de roda',
      'Samba de gafieira',
      'Pagode',
      'Pagode romântico',
      'Pagode anos 90',
      'Partido-alto',
      'Choro',
      'Samba-rock',
      'Samba-reggae',
    ],
  },
  {
    name: 'Rock brasileiro',
    children: [
      'Rock nacional',
      'Rock alternativo brasileiro',
      'Pop rock brasileiro',
      'Rock gaúcho',
      'Rock psicodélico brasileiro',
      'Punk rock brasileiro',
      'Hardcore brasileiro',
      'Metal brasileiro',
      'Heavy metal brasileiro',
    ],
  },
  {
    name: 'Sertanejo e música caipira',
    children: [
      'Sertanejo',
      'Sertanejo raiz',
      'Sertanejo universitário',
      'Sertanejo romântico',
      'Moda de viola',
      'Música caipira',
      'Arrocha sertanejo',
    ],
  },
  {
    name: 'Forró e música nordestina',
    children: [
      'Forró',
      'Forró tradicional',
      'Forró pé-de-serra',
      'Forró eletrônico',
      'Forró universitário',
      'Baião',
      'Xote',
      'Xaxado',
      'Arrasta-pé',
      'Quadrilha',
      'Côco',
      'Ciranda',
      'Embolada',
      'Repente',
    ],
  },
  {
    name: 'Funk e música urbana',
    children: [
      'Funk brasileiro',
      'Funk carioca',
      'Funk ostentação',
      'Funk melody',
      'Funk consciente',
      'Trap brasileiro',
      'Rap brasileiro',
      'Hip-hop brasileiro',
      'Drill brasileiro',
      'R&B brasileiro',
      'Pop urbano brasileiro',
    ],
  },
  {
    name: 'Axé e ritmos baianos',
    children: ['Axé', 'Pagodão baiano', 'Ijexá', 'Frevo', 'Maracatu', 'Afoxé', 'Olodum'],
  },
  {
    name: 'Música regional brasileira',
    children: [
      'Música nordestina',
      'Música gaúcha',
      'Música amazônica',
      'Música pantaneira',
      'Música mineira',
      'Música carioca',
    ],
  },
  {
    name: 'Música amazônica e paraense',
    children: [
      'Carimbó',
      'Lambada',
      'Brega paraense',
      'Tecnobrega',
      'Calypso brasileiro',
      'Siriá',
      'Lundu',
      'Brega romântico',
      'Melody paraense',
      'Eletromelody',
    ],
  },
  {
    name: 'Música eletrônica brasileira',
    children: [
      'Brazilian bass',
      'Electro brega',
      'Funk eletrônico',
      'House brasileiro',
      'Techno brasileiro',
      'Tropical house',
    ],
  },
  {
    name: 'Jazz e instrumental brasileiro',
    children: [
      'Bossa nova',
      'Jazz brasileiro',
      'Samba jazz',
      'Choro instrumental',
      'Música instrumental brasileira',
      'Fusion brasileiro',
      'Música experimental brasileira',
    ],
  },
  {
    name: 'Ritmos tradicionais e folclóricos',
    children: [
      'Congada',
      'Fandango brasileiro',
      'Jongo',
      'Catira',
      'Tambor de crioula',
      'Reisado',
      'Bumba-meu-boi',
      'Folia de reis',
      'Cavalhada',
    ],
  },
  {
    name: 'Pop brasileiro',
    children: [
      'Pop romântico',
      'Indie brasileiro',
      'Alternativo brasileiro',
      'Teen pop brasileiro',
    ],
  },
  {
    name: 'Rap e periferia',
    children: [
      'Rap nacional',
      'Rap consciente',
      'Rap underground',
      'Trap nacional',
      'Funk rap',
      'Hip-hop paulista',
      'Hip-hop carioca',
    ],
  },
  {
    name: 'Gospel brasileiro',
    children: [
      'Gospel contemporâneo',
      'Louvor',
      'Adoração',
      'Gospel pentecostal',
      'Gospel pop',
    ],
  },
  // ——— Internacionais ———
  {
    name: 'Pop internacional',
    children: ['Pop', 'Synth-pop', 'Dance-pop', 'K-pop', 'Latin pop'],
  },
  {
    name: 'Rock internacional',
    children: ['Classic rock', 'Alternative rock', 'Indie rock', 'Punk', 'Metal', 'Grunge'],
  },
  {
    name: 'Hip-hop e Rap internacional',
    children: ['Trap', 'Drill', 'Boom bap', 'Conscious rap'],
  },
  {
    name: 'R&B e Soul internacional',
    children: ['R&B', 'Soul', 'Neo soul'],
  },
  {
    name: 'Eletrônica internacional',
    children: ['House', 'Techno', 'EDM', 'Trance', 'Dubstep', 'Drum & Bass', 'Ambient'],
  },
  {
    name: 'Jazz internacional',
    children: ['Jazz', 'Smooth jazz', 'Bebop', 'Fusion'],
  },
  {
    name: 'Música latina',
    children: ['Reggaeton', 'Salsa', 'Bachata', 'Cumbia', 'Merengue'],
  },
  {
    name: 'Música clássica',
    children: ['Clássica', 'Erudita contemporânea'],
  },
  {
    name: 'Country',
    children: ['Country', 'Country pop'],
  },
  {
    name: 'Reggae e Ska',
    children: ['Reggae', 'Ska', 'Dub'],
  },
  {
    name: 'Folk e Acústico',
    children: ['Folk', 'Singer-songwriter', 'Acústico'],
  },
  {
    name: 'Gospel e Cristão internacional',
    children: ['Christian contemporary', 'Worship internacional'],
  },
]

// ============================================================
// Setores do fórum (seção 3.6 do MAPA-E-PLANO)
// ============================================================

const FORUM_SECTORS = [
  {
    slug: 'regras',
    name: 'Regras do site',
    description: 'Regras e políticas da comunidade. Só admin posta tópico novo.',
    order: 0,
    onlyAdminPost: true,
  },
  {
    slug: 'pedidos-de-musica',
    name: 'Pedido de música',
    description: 'Peça uma música, remix ou produção.',
    order: 1,
    onlyAdminPost: false,
  },
  {
    slug: 'comunidade',
    name: 'Comunidade',
    description: 'Assunto geral e bate-papo.',
    order: 2,
    onlyAdminPost: false,
  },
  {
    slug: 'ajuda',
    name: 'Ajuda',
    description: 'Dúvidas sobre a plataforma.',
    order: 3,
    onlyAdminPost: false,
  },
  {
    slug: 'informacao',
    name: 'Informação',
    description: 'Avisos, novidades e changelog.',
    order: 4,
    onlyAdminPost: false,
  },
  {
    slug: 'sugestoes',
    name: 'Feedback & sugestões',
    description: 'Sugestões de melhoria para a plataforma.',
    order: 5,
    onlyAdminPost: false,
  },
  {
    slug: 'divulgacao',
    name: 'Divulgação de música',
    description: 'Artistas divulgam seus lançamentos.',
    order: 6,
    onlyAdminPost: false,
  },
  {
    slug: 'colaboracoes',
    name: 'Achados & colaborações',
    description: 'Artistas procuram parceria: feat, produção, vocal.',
    order: 7,
    onlyAdminPost: false,
  },
]

// ============================================================
// Main
// ============================================================

async function main() {
  console.log('🌱 Iniciando seed do banco...')

  // ——————————————————————————————————————————————————————————
  // Admin inicial
  // ——————————————————————————————————————————————————————————

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

  // ——————————————————————————————————————————————————————————
  // Catálogo da loja de pontos
  // ——————————————————————————————————————————————————————————

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

  // ——————————————————————————————————————————————————————————
  // Gêneros musicais — árvore hierárquica completa
  // ——————————————————————————————————————————————————————————

  let genreParentCount = 0
  let genreChildCount = 0

  for (let i = 0; i < GENRE_TREE.length; i++) {
    const node = GENRE_TREE[i]
    const parentSlug = slugify(node.name)

    const parent = await prisma.genre.upsert({
      where: { slug: parentSlug },
      update: { name: node.name, order: i, active: true },
      create: { slug: parentSlug, name: node.name, order: i, active: true },
    })
    genreParentCount++

    if (node.children) {
      for (let j = 0; j < node.children.length; j++) {
        const childName = node.children[j]
        const childSlug = slugify(`${node.name} ${childName}`)

        await prisma.genre.upsert({
          where: { slug: childSlug },
          update: { name: childName, order: j, parentId: parent.id, active: true },
          create: {
            slug: childSlug,
            name: childName,
            parentId: parent.id,
            order: j,
            active: true,
          },
        })
        genreChildCount++
      }
    }
  }

  console.log(`✅ Gêneros: ${genreParentCount} categorias, ${genreChildCount} subgêneros`)

  // ——————————————————————————————————————————————————————————
  // Setores do fórum
  // ——————————————————————————————————————————————————————————

  for (const sector of FORUM_SECTORS) {
    await prisma.forumSector.upsert({
      where: { slug: sector.slug },
      update: { name: sector.name, description: sector.description, order: sector.order },
      create: {
        slug: sector.slug,
        name: sector.name,
        description: sector.description,
        order: sector.order,
        onlyAdminPost: sector.onlyAdminPost,
        active: true,
      },
    })
  }
  console.log(`✅ Setores do fórum: ${FORUM_SECTORS.length} setores`)

  // ——————————————————————————————————————————————————————————
  // AppSettings — singleton com featureFlags e defaults
  // ——————————————————————————————————————————————————————————

  const defaultFeatureFlags = {
    postar_feed: true,
    curtir: true,
    seguir: true,
    postar_forum: true,
    ouvir: true,
    download: true,
    upload: true,
    comentar_musica: true,
    playlist: true,
    compartilhar: true,
  }

  await prisma.appSettings.upsert({
    where: { id: 'singleton' },
    update: {},
    create: {
      id: 'singleton',
      featureFlags: defaultFeatureFlags,
    },
  })
  console.log('✅ AppSettings criado/verificado com featureFlags')

  // ——————————————————————————————————————————————————————————
  // Threads oficiais do fórum — pinadas no setor "regras"
  // ——————————————————————————————————————————————————————————

  const regrasSector = await prisma.forumSector.findUnique({ where: { slug: 'regras' } })

  const pointsRulesTitle = 'Como funciona o sistema de pontos'
  const pointsRulesBody = [
    'Toda interação na comunidade gera XP, que vira nível e dá acesso a itens exclusivos na loja.',
    '',
    'Como ganhar pontos:',
    '- Criar conta: +50 | Completar perfil: +100 | Adicionar foto: +20 | Primeiro login: +10',
    '- Login diário: +5 (a cada 7 dias seguidos, +100 de bônus)',
    '- Curtir música: +2 (até 20/dia) | Comentar: +5 (até 10/dia) | Compartilhar: +10 (até 10/dia)',
    '- Ouvir música até o fim (app): +3 (até 30/dia) | Criar playlist: +20 (até 3/dia)',
    '- Publicar música: +100 (até 2/dia)',
    '- Indicar alguém que confirma o cadastro: +300',
    '- Faixa atingir 1.000 plays: +500',
    '',
    'Níveis: Descobridor (0+) → Explorador (15.001+) → Influenciador (50.001+) → Lenda Musical (500.001+).',
    '',
    'Loja: pontos trocam por convite prioritário, destaque de faixa, fixar comentário, armazenamento extra, mapeamento de estatísticas e conta premium no futuro app.',
    '',
    'Não existe mais distinção entre artista e ouvinte — todo usuário cadastrado tem as mesmas regras de pontuação, upload e loja.',
  ].join('\n')

  const existingPointsThread = await prisma.forumThread.findFirst({ where: { title: pointsRulesTitle } })
  if (existingPointsThread) {
    await prisma.forumThread.update({
      where: { id: existingPointsThread.id },
      data: {
        body: pointsRulesBody,
        pinned: true,
        sectorId: regrasSector?.id ?? null,
      },
    })
    console.log('✅ Thread oficial atualizada: regras de pontos')
  } else {
    await prisma.forumThread.create({
      data: {
        authorId: admin.id,
        title: pointsRulesTitle,
        pinned: true,
        body: pointsRulesBody,
        sectorId: regrasSector?.id ?? null,
      },
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
        sectorId: regrasSector?.id ?? null,
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
  } else {
    await prisma.forumThread.update({
      where: { id: existingInviteThread.id },
      data: { sectorId: regrasSector?.id ?? null },
    })
  }

  // ——————————————————————————————————————————————————————————
  // Chave de hash inicial para analytics
  // ——————————————————————————————————————————————————————————

  const now = new Date()
  const periodStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)

  const existingKey = await prisma.analyticsHashKey.findFirst({ where: { active: true } })
  if (!existingKey) {
    const rawSalt = crypto.randomBytes(32).toString('hex')
    await prisma.analyticsHashKey.create({
      data: { saltEncrypted: rawSalt, periodStart, periodEnd, active: true },
    })
    console.log('✅ Chave de hash analytics criada')
  }

  // ——————————————————————————————————————————————————————————
  // Conteúdo de desenvolvimento (só NODE_ENV === 'development')
  // ——————————————————————————————————————————————————————————

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

    // Busca genreId para "Eletrônico" — usa o subgênero de eletrônica BR se existir
    const eletronicaGenre = await prisma.genre.findFirst({
      where: { slug: { contains: 'musica-eletronica-brasileira' }, parentId: null },
    })

    await prisma.track.upsert({
      where: { slug: 'track-exemplo-01' },
      update: { genre: 'Eletrônico', genreId: eletronicaGenre?.id ?? null },
      create: {
        slug: 'track-exemplo-01',
        title: 'Noite Funda (Original Mix)',
        description: 'Eletrônica progressiva para as madrugadas.',
        genre: 'Eletrônico',
        genreId: eletronicaGenre?.id ?? null,
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

    const fictionalResult = await seedFictionalLaunchContent(prisma)
    console.log(
      `✅ Conteúdo fictício: ${fictionalResult.tracks} músicas, ${fictionalResult.users} usuários, ` +
        `${fictionalResult.posts} posts, ${fictionalResult.comments} comentários, ` +
        `${fictionalResult.forumThreads} tópicos de fórum, ${fictionalResult.forumReplies} respostas`
    )

    const fakeUsers = await prisma.user.findMany({
      where: { email: { endsWith: '@exemplo.com' } },
      orderBy: { createdAt: 'asc' },
    })
    const lua = fakeUsers.find((u) => u.email === 'lua.beats@exemplo.com')!
    const rafa = fakeUsers.find((u) => u.email === 'rafa.mc@exemplo.com')!
    const carol = fakeUsers.find((u) => u.email === 'carol.ouvinte@exemplo.com')!
    const pedro = fakeUsers.find((u) => u.email === 'pedro.dj@exemplo.com')!

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

    // Tópico de exemplo no setor "comunidade"
    const comunidadeSector = await prisma.forumSector.findUnique({ where: { slug: 'comunidade' } })
    const existingThread = await prisma.forumThread.findFirst({ where: { title: 'Qual DAW vocês usam pra mixar?' } })
    const thread = existingThread ?? (await prisma.forumThread.create({
      data: {
        authorId: pedro.id,
        title: 'Qual DAW vocês usam pra mixar?',
        body: 'Tô pensando em migrar do FL pro Ableton. Quem usa os dois, vale a pena? Quero ouvir experiências de quem já produz aqui na comunidade.',
        sectorId: comunidadeSector?.id ?? null,
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
