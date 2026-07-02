import { redirect } from 'next/navigation'
import { getAccessToken } from '@/lib/auth/cookies'
import { verifyAccessToken } from '@/lib/auth/jwt'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export default async function PerfilRedirectPage() {
  const token = await getAccessToken()
  if (!token) redirect('/inicio')
  const payload = await verifyAccessToken(token).catch(() => null)
  if (!payload) redirect('/inicio')

  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: { handle: true },
  })

  if (user?.handle) {
    redirect(`/perfil/${user.handle}`)
  }

  // Sem handle definido — redirecionar para edição de perfil
  redirect('/perfil/editar')
}
