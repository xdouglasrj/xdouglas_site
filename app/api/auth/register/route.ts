import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { waitlistRateLimit } from '@/lib/security/rate-limit'
import { extractIp } from '@/lib/analytics/geo'

// ============================================================
// Validação
// ============================================================

const visitorUsername = z
  .string()
  .min(3, 'Mínimo 3 caracteres')
  .max(30)
  .regex(/^[a-z0-9_.]+$/i, 'Use apenas letras, números, "_" e "."')

// Nome artístico: mais permissivo, aceita espaços e acentos
const artistUsername = z.string().min(2, 'Mínimo 2 caracteres').max(50)

const email = z.string().email('Email inválido')
const password = z.string().min(8, 'Mínimo 8 caracteres')
const name = z.string().min(2, 'Nome muito curto').max(100).optional()
const phone = z.string().min(8, 'WhatsApp inválido').max(20)
const inviteCode = z.string().min(4, 'Código de convite inválido')

const registerSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('artist'),
    username: artistUsername,
    email,
    password,
    name,
    inviteCode,
    phone,
    newsletterOptIn: z.boolean(),
  }),
  z.object({
    type: z.literal('visitor'),
    username: visitorUsername,
    email,
    password,
    name,
    inviteCode,
    phone,
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
  const email = data.email.toLowerCase().trim()
  const phoneTrimmed = data.phone.trim()
  const hashedPassword = await bcrypt.hash(data.password, 12)

  // Bloqueio manual pelo admin — impede novo cadastro com o mesmo
  // email, usuário ou WhatsApp de uma conta já bloqueada
  const blockedMatch = await prisma.user.findFirst({
    where: {
      blocked: true,
      OR: [{ email }, { username }, { phone: phoneTrimmed }],
    },
    select: { id: true },
  })
  if (blockedMatch) {
    return NextResponse.json(
      { error: 'Cadastro não permitido.', code: 'BLOCKED' },
      { status: 403 }
    )
  }

  try {
    if (data.type === 'artist') {
      const user = await prisma.user.create({
        data: {
          username,
          email,
          password: hashedPassword,
          name: data.name?.trim(),
          role: 'ARTIST',
          // Inativo até a validação manual do convite
          active: false,
          inviteCode: data.inviteCode.trim(),
          phone: data.phone.trim(),
          newsletterOptIn: data.newsletterOptIn,
        },
        select: { id: true },
      })
      return NextResponse.json(
        {
          ok: true,
          status: 'PENDING_INVITE_REVIEW',
          message: 'Cadastro recebido. Seu convite será validado e você receberá um email quando seu acesso for liberado.',
          userId: user.id,
        },
        { status: 201 }
      )
    }

    const user = await prisma.user.create({
      data: {
        username,
        email,
        password: hashedPassword,
        name: data.name?.trim(),
        role: 'GUEST',
        // Inativo até a validação manual do convite
        active: false,
        inviteCode: data.inviteCode.trim(),
        phone: data.phone.trim(),
        newsletterOptIn: data.newsletterOptIn,
      },
      select: { id: true },
    })
    return NextResponse.json(
      {
        ok: true,
        status: 'PENDING_INVITE_REVIEW',
        message: 'Cadastro recebido. Seu convite será validado e você receberá um aviso por WhatsApp ou email quando seu acesso for liberado.',
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
