import { PrismaClient } from '@prisma/client'
const p = new PrismaClient()
try {
  const r = await p.$queryRaw`SELECT current_database() AS db, current_user AS u, version() AS v`
  console.log(JSON.stringify(r, null, 2))
} catch (e) {
  console.error('ERR', e.message)
  process.exitCode = 1
} finally {
  await p.$disconnect()
}
