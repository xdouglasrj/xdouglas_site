import { NextRequest } from 'next/server'
import { withAuth, apiSuccess, apiError } from '@/lib/auth/guard'
import {
  getDashboardSummary,
  getDownloadsByDay,
  getVisitorsByDay,
  getTopTracks,
  getDeviceBreakdown,
  getTopCountries,
} from '@/lib/analytics/queries'
import { prisma } from '@/lib/prisma'

// ============================================================
// GET /api/admin/dashboard
// Agrega todos os dados do dashboard em uma requisição.
// Período configurável via ?days=7|14|30 (padrão: 30)
// ============================================================

export const GET = withAuth(async (request: NextRequest) => {
  const { searchParams } = request.nextUrl
  const days = Math.min(90, Math.max(7, Number(searchParams.get('days') ?? '30')))

  try {
    // Todas as queries em paralelo — nenhuma espera a outra
    const [
      summary,
      downloadsByDay,
      visitorsByDay,
      topTracks,
      deviceBreakdown,
      topCountries,
      recentDownloads,
      totalTracks,
      suspiciousCount,
    ] = await Promise.all([
      getDashboardSummary(),
      getDownloadsByDay(days),
      getVisitorsByDay(days),
      getTopTracks(10),
      getDeviceBreakdown(days),
      getTopCountries(days, 8),

      // Últimos 8 downloads para feed em tempo real (sem IP)
      prisma.download.findMany({
        where: { downloadSuspeito: false },
        orderBy: { createdAt: 'desc' },
        take: 8,
        select: {
          id: true,
          country: true,
          city: true,
          device: true,
          createdAt: true,
          track: { select: { title: true, slug: true } },
        },
      }),

      // Total de músicas publicadas
      prisma.track.count({ where: { published: true } }),

      // Downloads suspeitos últimos 30 dias (info de segurança)
      prisma.download.count({
        where: {
          downloadSuspeito: true,
          createdAt: { gte: new Date(Date.now() - 30 * 86400_000) },
        },
      }),
    ])

    return apiSuccess({
      period: { days },
      summary: { ...summary, totalTracks, suspiciousCount },
      charts: { downloadsByDay, visitorsByDay },
      topTracks,
      deviceBreakdown,
      topCountries,
      recentDownloads: recentDownloads.map((d) => ({
        ...d,
        createdAt: d.createdAt.toISOString(),
      })),
    })
  } catch (err) {
    console.error('[Dashboard API] Erro:', err)
    return apiError('Erro ao carregar dados do dashboard', 500, 'DASHBOARD_ERROR')
  }
})
