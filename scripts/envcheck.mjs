import fs from 'node:fs'
import { spawnSync } from 'node:child_process'
const envText = fs.readFileSync('.env.local', 'utf8')
const env = { ...process.env }
for (const line of envText.split(/\r?\n/)) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/)
  if (!m) continue
  let v = m[2]
  if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1)
  if (env[m[1]] === undefined) env[m[1]] = v
}
console.log('R2_ACCOUNT_ID =', JSON.stringify(env.R2_ACCOUNT_ID))
console.log('len =', (env.R2_ACCOUNT_ID || '').length)
console.log('truthy =', !!env.R2_ACCOUNT_ID)
console.log('NODE_ENV =', JSON.stringify(env.NODE_ENV))
