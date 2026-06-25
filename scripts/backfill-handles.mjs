// Gera o @ público (handle) para usuários que ainda não têm um —
// a partir do nome, nunca do username de login. Rodar uma vez após
// aplicar a migration 20260626100000_add_user_handle.
//
// Uso: DATABASE_URL=... DIRECT_URL=... node scripts/backfill-handles.mjs

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const REMOVE_DIACRITICS = new RegExp(
  `[${String.fromCharCode(0x0300)}-${String.fromCharCode(0x036f)}]`,
  'g'
)

function slugify(seed) {
  return (
    seed
      .toLowerCase()
      .normalize('NFD')
      .replace(REMOVE_DIACRITICS, '')
      .replace(/[^a-z0-9\s_]/g, '')
      .trim()
      .replace(/\s+/g, '_')
      .replace(/_+/g, '_')
      .slice(0, 24) || 'membro'
  )
}

try {
  const users = await prisma.user.findMany({
    where: { handle: null },
    select: { id: true, name: true, artisticName: true, username: true, email: true },
  })
  console.log('Usuarios sem handle:', users.length)

  for (const u of users) {
    const seed = u.name || u.artisticName || u.username || u.email.split('@')[0]
    const base = slugify(seed)
    let handle = base
    let attempt = 0
    while (await prisma.user.findUnique({ where: { handle } })) {
      attempt++
      handle = `${base}${attempt}`
    }
    await prisma.user.update({ where: { id: u.id }, data: { handle } })
    console.log('  ', u.email, '->', handle)
  }

  console.log('Backfill concluido.')
} catch (e) {
  console.error('ERR', e.message)
  process.exitCode = 1
} finally {
  await prisma.$disconnect()
}
