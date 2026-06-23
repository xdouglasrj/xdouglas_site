import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'

// ============================================================
// Rotas protegidas pelo middleware
// ============================================================

// Área administrativa — exige sessão e redireciona para /admin/login
const ADMIN_PREFIXES = ['/admin', '/api/admin']
const PUBLIC_ADMIN_PATHS = ['/admin/login', '/api/admin/auth/login']

// Área logada da comunidade — exige sessão (qualquer role) e redireciona
// para o portão de login ("/"). Sem isso, qualquer pessoa podia abrir
// /inicio ou /musicas direto pela URL (ou chamar a API por trás dessas
// páginas) sem nunca ter feito login.
const MEMBER_PREFIXES = ['/inicio', '/musicas', '/upload', '/perfil', '/api/musicas', '/api/download', '/api/stream', '/api/perfil']

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
    return isAdminRoute ? redirectToAdminLogin(request) : redirectToGate(request)
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

    // Para páginas, redireciona para o login correspondente
    return isAdminRoute ? redirectToAdminLogin(request) : redirectToGate(request)
  }
}

function redirectToAdminLogin(request: NextRequest): NextResponse {
  const loginUrl = new URL('/admin/login', request.url)
  loginUrl.searchParams.set('redirect', request.nextUrl.pathname)
  return NextResponse.redirect(loginUrl)
}

function redirectToGate(request: NextRequest): NextResponse {
  const gateUrl = new URL('/', request.url)
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
    '/perfil/:path*',
    '/api/musicas/:path*',
    '/api/download/:path*',
    '/api/stream/:path*',
    '/api/perfil/:path*',
  ],
}
