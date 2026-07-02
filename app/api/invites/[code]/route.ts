import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { normalizeInviteCode } from '@/lib/invites/code'

// ============================================================
// GET /api/invites/[code]
// Consulta pública de um convite aceito — usada pela página de
// cadastro para exibir o email do convite.
// ============================================================

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
): Promise<NextResponse> {
  const { code } = await params
  const normalized = normalizeInviteCode(code)

  const invite = await prisma.waitlist.findUnique({
    where: { inviteCode: normalized },
    select: {
      email: true,
      invitedAt: true,
      usedAt: true,
    },
  })

  if (!invite || !invite.invitedAt) {
    return NextResponse.json(
      { error: 'Convite inválido ou não autorizado.', code: 'INVALID_INVITE' },
      { status: 404 }
    )
  }
  if (invite.usedAt) {
    return NextResponse.json(
      { error: 'Este convite já foi utilizado.', code: 'INVITE_USED' },
      { status: 409 }
    )
  }

  return NextResponse.json({
    email: invite.email,
  })
}
