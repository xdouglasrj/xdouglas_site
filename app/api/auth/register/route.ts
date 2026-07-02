import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { waitlistRateLimit } from '@/lib/security/rate-limit'
import { extractIp } from '@/lib/analytics/geo'
import { inviteTargetForCategory, normalizeInviteCode } from '@/lib/invites/code'
import { generateUniqueHandle } from '@/lib/auth/handle'
import { addPoints } from '@/lib/points/points-service'

// ============================================================
// Validação
// ============================================================

// Login: identificador de acesso
const username = z
  .string()
  .min(3, 'Mínimo 3 caracteres')
  .max(30)
  .regex(/^[a-z0-9_.]+$/i, 'Use apenas letras, números, "_" e "."')

// Nome do usuário (base do @ público)
const name = z.string().min(2, 'Mínimo 2 caracteres').max(100)

// Nome artístico: mais permissivo, aceita espaços e acentos
const artisticName = z.string().min(2, 'Mínimo 2 caracteres').max(50)

const password = z
  .string()
  .min(8, 'Mínimo 8 caracteres')
  .refine((pw) => (pw.match(/[A-Z]/g) ?? []).length >= 2, 'Use pelo menos 2 letras maiúsculas')
  .refine((pw) => (pw.match(/[^A-Za-z0-9]/g) ?? []).length >= 2, 'Use pelo menos 2 caracteres especiais')
const inviteCode = z.string().min(4, 'Código de convite inválido')

// Categoria escolhida no próprio formulário de cadastro (não vem mais do convite)
const categoria = z.enum(['DJ', 'PRODUTOR', 'ARTISTA', 'MUSICO', 'OUVINTE'])

const registerSchema = z
  .object({
    categoria,
    name,
    artisticName: artisticName.optional(),
    username,
    password,
    inviteCode,
    newsletterOptIn: z.boolean(),
  })
  .superRefine((data, ctx) => {
    // Nome artístico é obrigatório apenas para categorias artísticas — validado
    // no servidor para não confiar no front.
    if (inviteTargetForCategory(data.categoria).type === 'artist') {
      if (!data.artisticName || data.artisticName.trim().length < 2) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['artisticName'],
          message: 'Informe seu nome artístico.',
        })
      }
    }
  })

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

  // Valida o convite: precisa ser uma chave gerada pelo admin (aceita) e
  // ainda não utilizada. O email vem do pedido de convite original (garante
  // que a conta nasce com o email verificado pelo link). A categoria, o nome
  // e o nome artístico vêm agora deste formulário.
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

  // O papel da conta deriva da categoria escolhida no formulário.
  const accountType = inviteTargetForCategory(data.categoria).type

  // Bloqueio manual pelo admin — impede novo cadastro com o mesmo
  // email ou usuário de uma conta já bloqueada
  const blockedMatch = await prisma.user.findFirst({
    where: {
      blocked: true,
      OR: [{ email: invite.email }, { username }],
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
  // nasce ativa. O papel vem da categoria escolhida no formulário.
  const role = accountType === 'artist' ? 'ARTIST' : 'GUEST'
  const name = data.name.trim()

  // @ público gerado a partir do nome — não do username de login (ver
  // lib/auth/handle.ts). O usuário pode trocar depois em "Editar perfil".
  const handle = await generateUniqueHandle(name || 'membro')

  try {
    const user = await prisma.user.create({
      data: {
        username,
        handle,
        email: invite.email,
        password: hashedPassword,
        name,
        artisticName: accountType === 'artist' ? data.artisticName!.trim() : null,
        role,
        active: true,
        inviteCode: code,
        phone: null,
        newsletterOptIn: data.newsletterOptIn,
      },
      select: { id: true },
    })

    // Marca o convite como consumido (single-use) e registra a categoria
    // escolhida no formulário — é o que alimenta o breakdown por categoria
    // (só cadastros concluídos). Sobrescreve categoria antiga do convite.
    await prisma.waitlist.update({
      where: { id: invite.id },
      data: { usedAt: new Date(), tipoUsuario: data.categoria },
    })

    // Gamificação — não bloqueia o cadastro se falhar
    try {
      await addPoints(user.id, 'USER_REGISTERED')

      // Indicação confirmada: quem indicou esse convite ganha os pontos
      // só agora, quando o cadastro de fato é concluído (não no aceite do
      // admin, que só libera o convite)
      if (invite.referredByUserId) {
        await addPoints(invite.referredByUserId, 'FRIEND_INVITE_COMPLETED', {
          description: `Indicação confirmada: ${invite.email}`,
        })
      }
    } catch (err) {
      console.error('[Register] Falha ao registrar pontos', err)
    }

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
