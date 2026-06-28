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
// /inicio ou /musicas direto pela URL (ou chamar a API por trás dessas
// páginas) sem nunca ter feito login.
const MEMBER_PREFIXES = [
  '/inicio', '/musicas', '/upload', '/minhas-musicas', '/perfil', '/forum', '/busca', '/comentarios',
  '/api/musicas', '/api/download', '/api/stream', '/api/vinheta', '/api/perfil',
  '/api/social', '/api/forum', '/api/reports', '/api/usuarios',
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
    '/musicas/:path*',
    '/upload/:path*',
    '/minhas-musicas/:path*',
    '/perfil/:path*',
    '/forum/:path*',
    '/busca/:path*',
    '/comentarios/:path*',
    '/api/musicas/:path*',
    '/api/download/:path*',
    '/api/stream/:path*',
    '/api/vinheta/:path*',
    '/api/perfil/:path*',
    '/api/social/:path*',
    '/api/forum/:path*',
    '/api/reports/:path*',
    '/api/usuarios/:path*',
  ],
}
