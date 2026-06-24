import http from 'node:http'

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

const login = await req('POST', '/api/admin/auth/login', { username: 'admin', password: 'xdouglas_admin_2024!' })
console.log('login', login.status, login.body.slice(0, 200))
const setCookie = login.headers['set-cookie'] || []
const cookie = setCookie.map((s) => s.split(';')[0]).join('; ')

const calls = [
  ['POST', '/api/admin/musicas/upload-url', { filename: 'track.mp3', contentType: 'audio/mpeg', kind: 'audio', sizeBytes: 1000 }],
  ['POST', '/api/perfil/upload-url', { filename: 'me.jpg', contentType: 'image/jpeg', sizeBytes: 1000 }],
]
for (const [m, p, body] of calls) {
  const r = await req(m, p, body, { Cookie: cookie })
  console.log(`${m} ${p}`, r.status, r.body)
}
