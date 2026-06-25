import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { withAuth } from '@/lib/auth/guard'

// ============================================================
// GET /api/perfil — dados do usuário logado
// ============================================================

export const GET = withAuth(async (_request, auth) => {
  const user = await prisma.user.findUnique({
    where: { id: auth.userId },
    select: {
      id: true,
      email: true,
      username: true,
      name: true,
      phone: true,
      role: true,
      photoUrl: true,
      showEmail: true,
      showPhone: true,
      createdAt: true,
      artist: { select: { name: true, slug: true, bio: true, photoUrl: true } },
    },
  })

  if (!user) {
    return NextResponse.json({ error: 'Usuário não encontrado', code: 'NOT_FOUND' }, { status: 404 })
  }

  return NextResponse.json({ user })
})

// ============================================================
// PATCH /api/perfil — atualiza nome / senha
// ============================================================

const updateSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  currentPassword: z.string().min(1).optional(),
  newPassword: z.string().min(8).max(72).optional(),
  photoKey: z.string().min(1).max(500).optional(),
  photoUrl: z.string().url().optional(),
  showEmail: z.boolean().optional(),
  showPhone: z.boolean().optional(),
}).refine(
  (data) => !data.newPassword || !!data.currentPassword,
  { message: 'Senha atual obrigatória para trocar a senha', path: ['currentPassword'] }
)

export const PATCH = withAuth(async (request, auth) => {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Body inválido', code: 'INVALID_BODY' }, { status: 400 })
  }

  const parsed = updateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Dados inválidos', code: 'VALIDATION_ERROR', issues: parsed.error.flatten().fieldErrors },
      { status: 400 }
    )
  }

  const { name, currentPassword, newPassword, photoKey, photoUrl, showEmail, showPhone } = parsed.data
  const data: {
    name?: string
    password?: string
    photoKey?: string
    photoUrl?: string
    showEmail?: boolean
    showPhone?: boolean
  } = {}

  if (name !== undefined) {
    data.name = name
  }

  if (photoKey !== undefined && photoUrl !== undefined) {
    data.photoKey = photoKey
    data.photoUrl = photoUrl
  }

  if (showEmail !== undefined) data.showEmail = showEmail
  if (showPhone !== undefined) data.showPhone = showPhone

  if (newPassword) {
    const user = await prisma.user.findUnique({
      where: { id: auth.userId },
      select: { password: true },
    })
    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado', code: 'NOT_FOUND' }, { status: 404 })
    }

    const isValid = await bcrypt.compare(currentPassword!, user.password)
    if (!isValid) {
      return NextResponse.json(
        { error: 'Senha atual incorreta', code: 'INVALID_PASSWORD' },
        { status: 401 }
      )
    }

    data.password = await bcrypt.hash(newPassword, 12)
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: 'Nada para atualizar', code: 'EMPTY_UPDATE' }, { status: 400 })
  }

  const updated = await prisma.user.update({
    where: { id: auth.userId },
    data,
    select: { id: true, email: true, username: true, name: true, role: true, photoUrl: true },
  })

  return NextResponse.json({ ok: true, user: updated })
})
