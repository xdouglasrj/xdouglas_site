import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { IconSidebar } from '@/components/layout/icon-sidebar'
import { getCurrentUserBasics } from '@/lib/auth/current-user'
import { prisma } from '@/lib/prisma'
import { POINT_RULES, LOGIN_STREAK_BONUS_EVERY_DAYS } from '@/lib/points/constants'
import { getIsoWeekId } from '@/lib/gamification'

export const metadata: Metadata = {
  title: 'Ganhe pontos',
  robots: { index: false, follow: false },
}

export const dynamic = 'force-dynamic'

type TaskState = 'done' | 'available' | 'progress'

interface TaskCard {
  title: string
  description: string
  points: number
  state: TaskState
  progressLabel?: string
}

// V3 Plano 7 — página "Ganhe pontos" (estilo Audius "Rewards & Perks"),
// só para usuário logado. Não mexe no layout da loja em si — link a
// partir de lá e do menu (icon-sidebar) leva pra cá.
export default async function GanhePontosPage() {
  const user = await getCurrentUserBasics()
  if (!user) redirect('/inicio')

  const [
    dbUser,
    hasFirstLogin,
    hasProfileCompleted,
    hasFirstPlaylist,
    hasFirstLike,
    weeklyCommentAward,
  ] = await Promise.all([
    prisma.user.findUnique({
      where: { id: user.id },
      select: { loginStreak: true, lastDailyLoginAt: true },
    }),
    prisma.pointsHistory.findFirst({ where: { userId: user.id, action: 'FIRST_LOGIN' } }),
    prisma.pointsHistory.findFirst({ where: { userId: user.id, action: 'PROFILE_COMPLETED' } }),
    prisma.milestoneAward.findUnique({
      where: { userId_kind_refId: { userId: user.id, kind: 'first_playlist', refId: '' } },
    }),
    prisma.milestoneAward.findUnique({
      where: { userId_kind_refId: { userId: user.id, kind: 'first_like_given', refId: '' } },
    }),
    prisma.milestoneAward.findUnique({
      where: { userId_kind_refId: { userId: user.id, kind: 'first_comment_week', refId: getIsoWeekId() } },
    }),
  ])

  const streak = dbUser?.loginStreak ?? 0
  // Dias dentro do ciclo atual de 7 — 0 só quando ainda não logou nenhuma vez
  const streakCycleDay = streak === 0 ? 0 : streak % LOGIN_STREAK_BONUS_EVERY_DAYS || LOGIN_STREAK_BONUS_EVERY_DAYS
  const streakBonusJustCompleted = streak > 0 && streak % LOGIN_STREAK_BONUS_EVERY_DAYS === 0

  const tasks: TaskCard[] = [
    {
      title: 'Primeiro login',
      description: 'Entre no xDouglas pela primeira vez.',
      points: POINT_RULES.FIRST_LOGIN.points,
      state: hasFirstLogin ? 'done' : 'available',
    },
    {
      title: 'Complete seu perfil',
      description: 'Preencha nome, foto e demais dados do seu perfil.',
      points: POINT_RULES.PROFILE_COMPLETED.points,
      state: hasProfileCompleted ? 'done' : 'available',
    },
    {
      title: 'Sequência de login — 7 dias',
      description: 'Entre 7 dias seguidos para ganhar o bônus de sequência.',
      points: POINT_RULES.DAILY_LOGIN_STREAK_BONUS.points,
      state: streakBonusJustCompleted ? 'done' : 'progress',
      progressLabel: `${streakCycleDay}/${LOGIN_STREAK_BONUS_EVERY_DAYS} dias`,
    },
    {
      title: 'Crie sua primeira playlist',
      description: 'Monte sua primeira playlist com suas músicas favoritas.',
      points: POINT_RULES.FIRST_PLAYLIST_CREATED.points,
      state: hasFirstPlaylist ? 'done' : 'available',
    },
    {
      title: 'Dê sua primeira curtida',
      description: 'Curta uma música que você gosta.',
      points: POINT_RULES.FIRST_LIKE_GIVEN.points,
      state: hasFirstLike ? 'done' : 'available',
    },
    {
      title: 'Primeiro comentário da semana',
      description: 'Comente em qualquer música — vale uma vez por semana.',
      points: POINT_RULES.FIRST_COMMENT_OF_WEEK.points,
      state: weeklyCommentAward ? 'done' : 'available',
    },
    {
      title: 'Ouça músicas',
      description: 'Ouvir faixas até o fim rende pontos (até o teto diário).',
      points: POINT_RULES.TRACK_PLAYED.points,
      state: 'available',
    },
    {
      title: 'Comente em músicas',
      description: 'Cada comentário rende pontos (até o teto diário).',
      points: POINT_RULES.COMMENT_CREATED.points,
      state: 'available',
    },
    {
      title: 'Curta músicas',
      description: 'Cada curtida rende pontos (até o teto diário).',
      points: POINT_RULES.TRACK_LIKED.points,
      state: 'available',
    },
    {
      title: 'Compartilhe músicas',
      description: 'Compartilhar uma faixa rende pontos (até o teto diário).',
      points: POINT_RULES.TRACK_SHARED.points,
      state: 'available',
    },
    {
      title: 'Convide amigos',
      description: 'Quando seu convite vira cadastro confirmado, você ganha pontos.',
      points: POINT_RULES.FRIEND_INVITE_COMPLETED.points,
      state: 'available',
    },
  ]

  return (
    <div className="min-h-screen bg-gate-bg">
      <IconSidebar isAdmin={user.role === 'ADMIN'} hasUploads={user.hasUploads} photoUrl={user.photoUrl} handle={user.handle} />

      <main className="md:ml-16 md:pt-20 px-4 sm:px-8 py-8 sm:py-12">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-2xl font-bold text-white">Ganhe pontos</h1>
            <Link href="/loja" className="text-xs text-gate-blue hover:text-gate-pink transition">
              Ver loja →
            </Link>
          </div>
          <p className="text-sm text-white/50 mb-6">
            Complete tarefas para ganhar pontos e subir de nível. Alguns valores têm teto diário.
          </p>

          <ul className="space-y-3">
            {tasks.map((task) => (
              <li
                key={task.title}
                className="flex items-center justify-between gap-4 rounded-lg border border-gate-azure bg-white/5 p-4"
              >
                <div>
                  <p className="text-sm font-medium text-white">{task.title}</p>
                  <p className="text-xs text-white/50 mt-0.5">{task.description}</p>
                  {task.progressLabel && task.state !== 'done' && (
                    <p className="text-xs text-gate-blue mt-1">{task.progressLabel}</p>
                  )}
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <span className="text-xs font-semibold text-gate-pink whitespace-nowrap">
                    +{task.points.toLocaleString('pt-BR')} pts
                  </span>
                  <TaskBadge state={task.state} />
                </div>
              </li>
            ))}
          </ul>
        </div>
      </main>
    </div>
  )
}

function TaskBadge({ state }: { state: TaskState }) {
  if (state === 'done') {
    return (
      <span className="rounded-full bg-green-500/15 px-2.5 py-1 text-xs font-medium text-green-400 whitespace-nowrap">
        Feito ✅
      </span>
    )
  }
  if (state === 'progress') {
    return (
      <span className="rounded-full bg-gate-pink/15 px-2.5 py-1 text-xs font-medium text-gate-pink whitespace-nowrap">
        Em progresso
      </span>
    )
  }
  return (
    <span className="rounded-full border border-gate-azure px-2.5 py-1 text-xs font-medium text-white/50 whitespace-nowrap">
      Disponível
    </span>
  )
}
