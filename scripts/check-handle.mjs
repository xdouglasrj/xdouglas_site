// Diagnostico: mostra quantos usuarios existem e o handle de cada um.
// Uso (com as mesmas variaveis de produção já carregadas no terminal):
//   node scripts/check-handle.mjs

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

try {
  const total = await prisma.user.count()
  console.log('Total de usuarios no banco conectado:', total)

  const users = await prisma.user.findMany({
    select: { email: true, username: true, handle: true, name: true },
    orderBy: { createdAt: 'asc' },
  })
  for (const u of users) {
    console.log(`  email=${u.email}  username=${u.username}  handle=${u.handle ?? '(NULO)'}  nome=${u.name}`)
  }
} catch (e) {
  console.error('ERR', e.message)
  process.exitCode = 1
} finally {
  await prisma.$disconnect()
}
