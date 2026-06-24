import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { inviteTargetForCategory, normalizeInviteCode } from '@/lib/invites/code'

// ============================================================
// GET /api/invites/[code]
// Consulta pública de um convite aceito — usada pela página de
// cadastro para carregar automaticamente nome/email/whatsapp.
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
      name: true,
      phone: true,
      tipoUsuario: true,
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

  const target = inviteTargetForCategory(invite.tipoUsuario)

  return NextResponse.json({
    name: invite.name,
    email: invite.email,
    phone: invite.phone,
    tipoUsuario: invite.tipoUsuario,
    accountType: target.type,
  })
}
