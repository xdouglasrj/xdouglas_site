import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'

// ============================================================
// Rotas protegidas pelo middleware
// ============================================================

// Área administrativa — exige sessão e redireciona para o login único
// na home ("/"), que abre o modal de entrada (não existe mais uma
// página /admin/login separada — uma única tela de login para todos)
const ADMIN_PREFIXES = ['/admin', '/api/admin']
const PUBLIC_ADMIN_PATHS = ['/api/admin/auth/login']

// Área logada da comunidade — exige sessão (qualquer role) e redireciona
// para o portão de login ("/"). Sem isso, qualquer pessoa podia abrir
// /inicio ou /forum direto pela URL (ou chamar a API por trás dessas
// páginas) sem nunca ter feito login.
//
// Conteúdo de música fica de fora desta lista de propósito: /musicas/[slug],
// /generos*, /artista/[slug], /musicas-recentes e suas APIs (/api/musicas,
// /api/stream) precisam ser acessíveis sem login para visitante e Googlebot
// indexarem — é a porta de entrada pública da plataforma (ver §3.1/§3.12 do
// MAPA-E-PLANO-XDOUGLAS.md). Baixar música continua exigindo conta
// (/api/download permanece protegido abaixo).
//
// V3 Plano 8 — /embed/* (player embedável em iframe de terceiros) também
// fica fora de propósito: precisa tocar sem login em qualquer site que o
// incorpore. Já não está no matcher abaixo nem em nenhum prefixo protegido,
// então passa direto sem checar sessão — não precisou de carve-out extra.
const MEMBER_PREFIXES = [
  '/upload', '/minhas-musicas', '/perfil', '/forum', '/busca', '/comentarios', '/biblioteca',
  '/loja', '/suporte', '/notificacoes',
  '/api/download', '/api/vinheta', '/api/perfil',
  '/api/social', '/api/forum', '/api/reports', '/api/usuarios', '/api/playlists',
  '/api/store', '/api/support',
]

// ============================================================
// Middleware Edge — validação JWT sem I/O de banco
// ============================================================

// V3 Plano 2 — anônimo pode LER os comentários da página pública da faixa
// (interagir continua exigindo login). Só o GET da listagem é liberado.
const PUBLIC_TRACK_COMMENTS_RE = /^\/api\/social\/tracks\/[^/]+\/comments$/

// V3 Plano 10 — anônimo/Googlebot pode LER a tracklist da faixa (a barra do
// player mostra "tocando agora" e a página renderiza a lista). Só o GET.
const PUBLIC_TRACK_TRACKLIST_RE = /^\/api\/social\/tracks\/[^/]+\/tracklist$/

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  const isAdminRoute = ADMIN_PREFIXES.some((prefix) => pathname.startsWith(prefix))
  const isMemberRoute = MEMBER_PREFIXES.some((prefix) => pathname.startsWith(prefix))
  const isPublicAdminPath = PUBLIC_ADMIN_PATHS.some((path) => pathname.startsWith(path))

  if (request.method === 'GET' && PUBLIC_TRACK_COMMENTS_RE.test(pathname)) {
    return NextResponse.next()
  }

  if (request.method === 'GET' && PUBLIC_TRACK_TRACKLIST_RE.test(pathname)) {
    return NextResponse.next()
  }

  if ((!isAdminRoute && !isMemberRoute) || isPublicAdminPath) {
    return NextResponse.next()
  }

  // Extrai token do cookie
  const token = request.cookies.get('xd_access')?.value

  if (!token) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        { error: 'Não autorizado', code: 'NO_TOKEN' },
        { status: 401 }
      )
    }
    return redirectToGate(request, isAdminRoute)
  }

  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET)

    await jwtVerify(token, secret, {
      issuer: 'xdouglas',
      audience: 'xdouglas-admin',
    })

    // Token válido — adiciona headers úteis para as API routes
    const response = NextResponse.next()
    response.headers.set('x-middleware-validated', '1')
    return response
  } catch {
    // Token inválido ou expirado
    // Para API routes, retorna 401 JSON
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        { error: 'Não autorizado', code: 'TOKEN_INVALID' },
        { status: 401 }
      )
    }

    // Para páginas, redireciona para o login
    return redirectToGate(request, isAdminRoute)
  }
}

// Manda para /inicio — abre popup de login automaticamente e preserva a rota
// original em ?next= para retornar após autenticação.
function redirectToGate(request: NextRequest, _openLoginModal: boolean): NextResponse {
  const gateUrl = new URL('/inicio', request.url)
  gateUrl.searchParams.set('login', '1')
  const next = request.nextUrl.pathname + request.nextUrl.search
  if (next !== '/inicio') gateUrl.searchParams.set('next', next)
  return NextResponse.redirect(gateUrl)
}

// ============================================================
// Configuração do matcher — rotas que passam pelo middleware
// ============================================================

export const config = {
  matcher: [
    '/admin/:path*',
    '/api/admin/:path*',
    '/upload/:path*',
    '/minhas-musicas/:path*',
    '/perfil/:path*',
    '/forum/:path*',
    '/busca/:path*',
    '/comentarios/:path*',
    '/biblioteca/:path*',
    '/api/download/:path*',
    '/api/vinheta/:path*',
    '/api/perfil/:path*',
    '/api/social/:path*',
    '/api/forum/:path*',
    '/api/reports/:path*',
    '/api/usuarios/:path*',
    '/api/playlists/:path*',
    '/loja/:path*',
    '/suporte/:path*',
    '/notificacoes/:path*',
    '/api/store/:path*',
    '/api/support/:path*',
  ],
}
