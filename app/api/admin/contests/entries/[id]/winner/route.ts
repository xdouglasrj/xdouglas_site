import { NextRequest } from 'next/server'
import { withRole, apiSuccess, apiError } from '@/lib/auth/guard'
import { markContestWinner, ContestWinnerError } from '@/lib/contests/winners'

// ============================================================
// POST /api/admin/contests/entries/[id]/winner — admin marca uma
// submissão (ContestEntry) como vencedora.
//
// IDEMPOTENTE: chamar de novo com o mesmo entryId não credita pontos nem
// estende o destaque de novo — ver ContestEntry.winner como trava em
// lib/contests/winners.ts (markContestWinner).
// ============================================================

export const POST = withRole('ADMIN', async (_req: NextRequest, _auth, params) => {
  const id = params?.id
  if (!id) return apiError('ID obrigatório', 400, 'MISSING_ID')

  try {
    const result = await markContestWinner(id)
    return apiSuccess({ result })
  } catch (err) {
    if (err instanceof ContestWinnerError) {
      return apiError(err.message, 400, err.code)
    }
    console.error('[admin/contests/entries/winner]', err)
    return apiError('Erro ao marcar vencedor', 500, 'WINNER_ERROR')
  }
})
