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
