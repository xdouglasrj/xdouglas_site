import { prisma } from '@/lib/prisma'
import {
  generateInviteCode,
  inviteTargetForCategory,
  buildRegistrationUrl,
  type RegisterType,
} from './code'
import { sendInviteEmail } from '@/lib/email/send-invite'

export interface AcceptableEntry {
  id: string
  email: string
  tipoUsuario: string
  invitedAt: Date | null
  inviteCode: string | null
}

export interface AcceptResult {
  inviteCode: string
  registrationUrl: string
  accountType: RegisterType
  category: string
  email: string
  emailSent: boolean
}

/**
 * Aceita um pedido da waitlist: gera (ou reaproveita) a chave, marca como
 * convidado e envia o email com o link de cadastro. Usado tanto pelo aceite
 * manual (admin) quanto pelo aceite automático (piloto automático).
 * Idempotente: se já foi aceito, reusa a mesma chave/link.
 */
export async function acceptWaitlistEntry(
  entry: AcceptableEntry,
  baseUrl: string
): Promise<AcceptResult> {
  const target = inviteTargetForCategory(entry.tipoUsuario)

  let inviteCode = entry.inviteCode
  if (!entry.invitedAt || !inviteCode) {
    inviteCode = generateInviteCode()
    await prisma.waitlist.update({
      where: { id: entry.id },
      data: { invitedAt: new Date(), inviteCode },
    })
  }

  const registrationUrl = buildRegistrationUrl(baseUrl, target, inviteCode)

  const emailSent = await sendInviteEmail({
    to: entry.email,
    inviteCode,
    registrationUrl,
    accountType: target.type,
  })

  return {
    inviteCode,
    registrationUrl,
    accountType: target.type,
    category: entry.tipoUsuario,
    email: entry.email,
    emailSent,
  }
}
