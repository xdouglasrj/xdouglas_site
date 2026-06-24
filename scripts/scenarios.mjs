import http from 'node:http'

function req(method, path, body, headers = {}) {
  const data = body == null ? '' : JSON.stringify(body)
  const opts = { method, hostname: 'localhost', port: 3010, path,
    headers: { 'Accept': 'application/json', 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data), ...headers } }
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

const jar = new Map()
const login = await req('POST', '/api/admin/auth/login', { username: 'admin', password: 'xdouglas_admin_2024!' })
const sc = login.headers['set-cookie'] || []
for (const line of sc) {
  const [pair] = line.split(';')
  const [name, ...rest] = pair.split('=')
  jar.set(name.trim(), rest.join('=').trim())
}
const cookie = [...jar.entries()].map(([k, v]) => `${k}=${v}`).join('; ')
console.log('login', login.status)

const calls = [
  ['GET', '/inicio', null],
  ['GET', '/musicas/track-exemplo-01', null],
  ['GET', '/api/musicas/track-exemplo-01', null],
  ['POST', '/api/admin/musicas/upload-url', { filename: 'a.mp3', contentType: 'audio/mpeg', kind: 'audio', sizeBytes: 1000 }],
  ['POST', '/api/perfil/upload-url', { filename: 'a.jpg', contentType: 'image/jpeg', sizeBytes: 1000 }],
  ['POST', '/api/stream', { trackId: '931f905a-2d12-4f67-a758-7c11eae89f27' }],
  ['POST', '/api/download', { trackId: '931f905a-2d12-4f67-a758-7c11eae89f27' }],
]
for (const [m, p, body] of calls) {
  const r = await req(m, p, body, { Cookie: cookie })
  console.log(`${m.padEnd(5)} ${p.padEnd(60)} ${r.status} ${r.body.slice(0, 250).replace(/\s+/g, ' ')}`)
}
