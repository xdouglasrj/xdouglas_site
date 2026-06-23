import { cookies } from 'next/headers'

export const COOKIE_ACCESS_TOKEN = 'xd_access'
export const COOKIE_REFRESH_TOKEN = 'xd_refresh'

const IS_PROD = process.env.NODE_ENV === 'production'

export async function setAuthCookies(
  accessToken: string,
  refreshToken: string
) {
  const cookieStore = await cookies()

  cookieStore.set(COOKIE_ACCESS_TOKEN, accessToken, {
    httpOnly: true,
    secure: IS_PROD,
    sameSite: 'lax',
    // path '/' — sessão precisa ser lida em todo o site (ex: /inicio
    // detectar que o usuário logado é admin), não só em /admin/*
    path: '/',
    maxAge: 15 * 60, // 15 minutos
  })

  cookieStore.set(COOKIE_REFRESH_TOKEN, refreshToken, {
    httpOnly: true,
    secure: IS_PROD,
    sameSite: 'lax',
    path: '/api/admin/auth/refresh',
    maxAge: 7 * 24 * 60 * 60, // 7 dias
  })
}

export async function clearAuthCookies() {
  const cookieStore = await cookies()
  cookieStore.delete(COOKIE_ACCESS_TOKEN)
  cookieStore.delete(COOKIE_REFRESH_TOKEN)
}

export async function getAccessToken(): Promise<string | undefined> {
  const cookieStore = await cookies()
  return cookieStore.get(COOKIE_ACCESS_TOKEN)?.value
}

export async function getRefreshToken(): Promise<string | undefined> {
  const cookieStore = await cookies()
  return cookieStore.get(COOKIE_REFRESH_TOKEN)?.value
}
