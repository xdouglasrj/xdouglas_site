import { PrismaClient } from '@prisma/client'
const p = new PrismaClient()
try {
  const tables = await p.$queryRaw`SELECT table_name FROM information_schema.tables WHERE table_schema='public' ORDER BY table_name`
  console.log('TABLES:')
  for (const t of tables) console.log(' -', t.table_name)
  const cols = await p.$queryRaw`SELECT table_name, column_name FROM information_schema.columns WHERE table_schema='public' ORDER BY table_name, ordinal_position`
  const byTable = new Map()
  for (const c of cols) {
    if (!byTable.has(c.table_name)) byTable.set(c.table_name, [])
    byTable.get(c.table_name).push(c.column_name)
  }
  console.log('COLUMNS:')
  for (const [t, cs] of byTable) console.log(' -', t, '=>', cs.join(', '))
  const enums = await p.$queryRaw`SELECT t.typname AS name, array_agg(e.enumlabel ORDER BY e.enumsortorder) AS values FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid JOIN pg_namespace n ON n.oid = t.typnamespace WHERE n.nspname='public' GROUP BY t.typname`
  console.log('ENUMS:')
  for (const e of enums) console.log(' -', e.name, '=>', e.values)
} catch (e) {
  console.error('ERR', e.message)
  process.exitCode = 1
} finally {
  await p.$disconnect()
}
