import http from 'node:http'

const BASE = 'http://localhost:3010'

function req(method, path, body, headers = {}) {
  const data = body == null ? '' : JSON.stringify(body)
  const opts = {
    method,
    hostname: 'localhost',
    port: 3010,
    path,
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(data),
      ...headers,
    },
  }
  return new Promise((resolve) => {
    const r = http.request(opts, (res) => {
      let chunks = []
      res.on('data', (c) => chunks.push(c))
      res.on('end', () => resolve({ status: res.statusCode, body: Buffer.concat(chunks).toString('utf8'), headers: res.headers }))
    })
    r.on('error', (e) => resolve({ status: 0, body: 'ERR ' + e.message }))
    if (data) r.write(data)
    r.end()
  })
}

function parseSetCookie(headers) {
  const sc = headers['set-cookie'] || []
  const jar = new Map()
  for (const line of sc) {
    const [pair] = line.split(';')
    const [name, ...rest] = pair.split('=')
    jar.set(name.trim(), rest.join('=').trim())
  }
  return jar
}

function cookieHeader(jar) {
  return [...jar.entries()].map(([k, v]) => `${k}=${v}`).join('; ')
}

const jar = new Map()

async function main() {
  let r = await req('POST', '/api/admin/auth/login', { username: 'admin', password: 'xdouglas_admin_2024!' })
  console.log('login', r.status, r.body.slice(0, 120))
  for (const [k, v] of parseSetCookie(r.headers)) jar.set(k, v)

  const calls = [
    ['GET', '/api/admin/musicas'],
    ['GET', '/api/admin/artistas'],
    ['GET', '/api/admin/dashboard'],
    ['GET', '/api/admin/settings/auto-accept'],
    ['GET', '/api/musicas'],
    ['GET', '/api/perfil'],
    ['GET', '/api/musicas/track-exemplo-01'],
    ['GET', '/api/admin/auth/me'],
    ['PATCH', '/api/admin/cadastros/65f1ef5e-818f-4bbc-ba92-01cd22ef7caf', { action: 'approve' }],
    ['GET', '/api/invites/INVALID'],
    ['GET', '/api/invites/XD-AAAA-BBBB'],
    ['POST', '/api/auth/register', { type: 'visitor', username: 'tmp_user', password: 'password123', inviteCode: 'XD-AAAA-BBBB', newsletterOptIn: false }],
    ['POST', '/api/analytics/consent', { sessionId: '00000000-0000-0000-0000-000000000000', action: 'CONSENT_GIVEN', consentType: 'analytics' }],
    ['POST', '/api/stream', { trackId: '931f905a-2d12-4f67-a758-7c11eae89f27' }],
    ['POST', '/api/download', { trackId: '931f905a-2d12-4f67-a758-7c11eae89f27' }],
    ['POST', '/api/waitlist', { email: 'test+1@xdouglas.com', phone: '11999999999', tipoUsuario: 'OUVINTE', consent: true }],
    ['POST', '/api/waitlist', { email: 'test+2@xdouglas.com', phone: '11999999998', tipoUsuario: 'ARTISTA', consent: true }],
    ['POST', '/api/invites/cleanup'],
    ['POST', '/api/analytics/cleanup'],
    ['POST', '/api/admin/settings/auto-accept', { enabled: false, limit: 0 }],
    ['PATCH', '/api/admin/waitlist/00000000-0000-0000-0000-000000000000'],
    ['DELETE', '/api/admin/waitlist/00000000-0000-0000-0000-000000000000'],
    ['PATCH', '/api/admin/musicas/931f905a-2d12-4f67-a758-7c11eae89f27', { action: 'publish', published: true }],
  ]
  for (const [m, p, body] of calls) {
    const headers = {}
    if (jar.size > 0) headers['Cookie'] = cookieHeader(jar)
    const resp = await req(m, p, body, headers)
    console.log(`${m.padEnd(7)} ${p.padEnd(70)} ${resp.status} ${resp.body.slice(0, 220).replace(/\s+/g, ' ')}`)
  }
}
main().catch((e) => { console.error(e); process.exit(1) })
