import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { getAccessToken } from '@/lib/auth/cookies'
import { verifyAccessToken } from '@/lib/auth/jwt'

// /perfil não tem conteúdo próprio — manda para a página de visualização
// do próprio usuário (/perfil/<seu @>). Editar dados só existe via o
// popup "Editar perfil", aberto a partir de lá.
export default async function PerfilPage() {
  const token = await getAccessToken()
  if (!token) redirect('/')
  const payload = await verifyAccessToken(token).catch(() => null)
  if (!payload) redirect('/')

  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: { handle: true },
  })

  if (!user?.handle) redirect('/inicio')
  redirect(`/perfil/${user.handle}`)
}
