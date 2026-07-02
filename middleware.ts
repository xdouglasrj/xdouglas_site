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
const MEMBER_PREFIXES = [
  '/inicio', '/upload', '/minhas-musicas', '/perfil', '/forum', '/busca', '/comentarios', '/biblioteca',
  '/api/download', '/api/vinheta', '/api/perfil',
  '/api/social', '/api/forum', '/api/reports', '/api/usuarios', '/api/playlists',
]

// ============================================================
// Middleware Edge — validação JWT sem I/O de banco
// ============================================================

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  const isAdminRoute = ADMIN_PREFIXES.some((prefix) => pathname.startsWith(prefix))
  const isMemberRoute = MEMBER_PREFIXES.some((prefix) => pathname.startsWith(prefix))
  const isPublicAdminPath = PUBLIC_ADMIN_PATHS.some((path) => pathname.startsWith(path))

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

// Manda para a home — para rotas admin, abre o modal de login automaticamente
function redirectToGate(request: NextRequest, openLoginModal: boolean): NextResponse {
  const gateUrl = new URL('/', request.url)
  if (openLoginModal) gateUrl.searchParams.set('login', '1')
  return NextResponse.redirect(gateUrl)
}

// ============================================================
// Configuração do matcher — rotas que passam pelo middleware
// ============================================================

export const config = {
  matcher: [
    '/admin/:path*',
    '/api/admin/:path*',
    '/inicio/:path*',
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
  ],
}
