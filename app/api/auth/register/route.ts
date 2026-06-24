import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { waitlistRateLimit } from '@/lib/security/rate-limit'
import { extractIp } from '@/lib/analytics/geo'
import { inviteTargetForCategory, normalizeInviteCode } from '@/lib/invites/code'

// ============================================================
// Validação
// ============================================================

// Login: identificador de acesso, igual para os dois tipos de cadastro
const username = z
  .string()
  .min(3, 'Mínimo 3 caracteres')
  .max(30)
  .regex(/^[a-z0-9_.]+$/i, 'Use apenas letras, números, "_" e "."')

// Nome artístico: mais permissivo, aceita espaços e acentos
const artisticName = z.string().min(2, 'Mínimo 2 caracteres').max(50)

const password = z
  .string()
  .min(8, 'Mínimo 8 caracteres')
  .refine((pw) => (pw.match(/[A-Z]/g) ?? []).length >= 2, 'Use pelo menos 2 letras maiúsculas')
  .refine((pw) => (pw.match(/[^A-Za-z0-9]/g) ?? []).length >= 2, 'Use pelo menos 2 caracteres especiais')
const inviteCode = z.string().min(4, 'Código de convite inválido')

const registerSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('artist'),
    username,
    password,
    artisticName,
    inviteCode,
    newsletterOptIn: z.boolean(),
  }),
  z.object({
    type: z.literal('visitor'),
    username,
    password,
    inviteCode,
    newsletterOptIn: z.boolean(),
  }),
])

// ============================================================
// POST /api/auth/register
// ============================================================

export async function POST(request: NextRequest): Promise<NextResponse> {
  const ip = extractIp(request)
  const ipKey = Buffer.from(ip ?? 'unknown').toString('base64').slice(0, 32)
  const rateLimit = waitlistRateLimit(ipKey)

  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: 'Muitas tentativas. Aguarde antes de tentar novamente.', code: 'RATE_LIMITED' },
      { status: 429 }
    )
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Body inválido' }, { status: 400 })
  }

  const parsed = registerSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Dados inválidos', issues: parsed.error.flatten().fieldErrors },
      { status: 400 }
    )
  }

  const data = parsed.data
  const username = data.username.toLowerCase().trim()
  const hashedPassword = await bcrypt.hash(data.password, 12)

  // Valida o convite: precisa ser uma chave gerada pelo admin (aceita),
  // ainda não utilizada e da categoria correspondente a este cadastro.
  // Nome, email e WhatsApp vêm do pedido de convite original — não são
  // mais informados novamente neste formulário.
  const code = normalizeInviteCode(data.inviteCode)
  const invite = await prisma.waitlist.findUnique({ where: { inviteCode: code } })

  if (!invite || !invite.invitedAt) {
    return NextResponse.json(
      { error: 'Convite inválido ou não autorizado.', code: 'INVALID_INVITE' },
      { status: 403 }
    )
  }
  if (invite.usedAt) {
    return NextResponse.json(
      { error: 'Este convite já foi utilizado.', code: 'INVITE_USED' },
      { status: 409 }
    )
  }
  if (inviteTargetForCategory(invite.tipoUsuario).type !== data.type) {
    return NextResponse.json(
      { error: 'Este convite não corresponde a este tipo de cadastro.', code: 'INVITE_CATEGORY_MISMATCH' },
      { status: 403 }
    )
  }

  // Bloqueio manual pelo admin — impede novo cadastro com o mesmo
  // email, usuário ou WhatsApp de uma conta já bloqueada
  const blockedMatch = await prisma.user.findFirst({
    where: {
      blocked: true,
      OR: [{ email: invite.email }, { username }, { phone: invite.phone ?? undefined }],
    },
    select: { id: true },
  })
  if (blockedMatch) {
    return NextResponse.json(
      { error: 'Cadastro não permitido.', code: 'BLOCKED' },
      { status: 403 }
    )
  }

  // Convite válido — a aprovação do admin já é a liberação, então a conta
  // nasce ativa. O papel vem da categoria escolhida no convite.
  const role = data.type === 'artist' ? 'ARTIST' : 'GUEST'

  try {
    const user = await prisma.user.create({
      data: {
        username,
        email: invite.email,
        password: hashedPassword,
        name: invite.name,
        artisticName: data.type === 'artist' ? data.artisticName.trim() : null,
        role,
        active: true,
        inviteCode: code,
        phone: invite.phone,
        newsletterOptIn: data.newsletterOptIn,
      },
      select: { id: true },
    })

    // Marca o convite como consumido (single-use)
    await prisma.waitlist.update({
      where: { id: invite.id },
      data: { usedAt: new Date() },
    })

    return NextResponse.json(
      {
        ok: true,
        status: 'ACCOUNT_ACTIVE',
        message: 'Conta criada com sucesso! Você já pode entrar com seu usuário e senha.',
        userId: user.id,
      },
      { status: 201 }
    )
  } catch (err: unknown) {
    if (
      typeof err === 'object' && err !== null &&
      'code' in err && (err as { code: string }).code === 'P2002'
    ) {
      return NextResponse.json(
        { error: 'Usuário ou email já cadastrado.', code: 'DUPLICATE' },
        { status: 409 }
      )
    }
    console.error('[Register]', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
