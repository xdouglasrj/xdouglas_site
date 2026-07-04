import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { getAccessToken } from '@/lib/auth/cookies'
import { verifyAccessToken } from '@/lib/auth/jwt'
import { listEventsByArtistForManagement } from '@/lib/events/events'
import { MeusEventosPanel } from './meus-eventos-panel'

export const metadata: Metadata = {
  title: 'Meus eventos',
  robots: { index: false, follow: false },
}
export const dynamic = 'force-dynamic'

export default async function MeusEventosPage() {
  const token = await getAccessToken()
  if (!token) redirect('/inicio')
  const payload = await verifyAccessToken(token)
  if (!payload) redirect('/inicio')

  const artist = await prisma.artist.findUnique({ where: { userId: payload.userId }, select: { id: true } })

  const events = artist ? await listEventsByArtistForManagement(artist.id) : []
  const initialEvents = events.map((e) => ({ ...e, startsAt: e.startsAt.toISOString(), createdAt: e.createdAt.toISOString() }))

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-8 py-8 sm:py-12">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Meus eventos</h1>
        <p className="mt-1 text-sm text-gate-blue">
          Divulgue onde você vai tocar. Publicar um evento notifica quem te segue — sem venda de
          ingresso nem confirmação de presença nesta versão, é uma vitrine com link externo.
        </p>
      </div>

      {!artist && (
        <p className="text-sm text-gate-blue">
          Você precisa ter um perfil de artista (enviar ao menos uma música) para gerenciar eventos.
        </p>
      )}

      {artist && <MeusEventosPanel initialEvents={initialEvents} />}
    </div>
  )
}
