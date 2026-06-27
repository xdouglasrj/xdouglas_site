import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { withAuth } from '@/lib/auth/guard'
import { HANDLE_REGEX } from '@/lib/auth/handle'

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
      handle: true,
      name: true,
      phone: true,
      role: true,
      photoUrl: true,
      showEmail: true,
      showPhone: true,
      showName: true,
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
  artisticName: z.string().min(2).max(50).optional(),
  handle: z.string().min(3).max(24).regex(HANDLE_REGEX, 'Use apenas letras minúsculas, números e "_"').optional(),
  currentPassword: z.string().min(1).optional(),
  newPassword: z.string().min(8).max(72).optional(),
  photoKey: z.string().min(1).max(500).optional(),
  photoUrl: z.string().url().optional(),
  showEmail: z.boolean().optional(),
  showPhone: z.boolean().optional(),
  showName: z.boolean().optional(),
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

  const { name, artisticName, handle, currentPassword, newPassword, photoKey, photoUrl, showEmail, showPhone, showName } = parsed.data
  const data: {
    name?: string
    artisticName?: string
    handle?: string
    password?: string
    photoKey?: string
    photoUrl?: string
    showEmail?: boolean
    showPhone?: boolean
    showName?: boolean
  } = {}

  if (name !== undefined) {
    data.name = name
  }

  if (artisticName !== undefined) {
    data.artisticName = artisticName
  }

  if (handle !== undefined) {
    const normalized = handle.toLowerCase()
    const taken = await prisma.user.findUnique({ where: { handle: normalized }, select: { id: true } })
    if (taken && taken.id !== auth.userId) {
      return NextResponse.json({ error: 'Esse @ já está em uso', code: 'HANDLE_TAKEN' }, { status: 409 })
    }
    data.handle = normalized
  }

  if (photoKey !== undefined && photoUrl !== undefined) {
    data.photoKey = photoKey
    data.photoUrl = photoUrl
  }

  if (showEmail !== undefined) data.showEmail = showEmail
  if (showPhone !== undefined) data.showPhone = showPhone
  if (showName !== undefined) data.showName = showName

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

  try {
    const updated = await prisma.user.update({
      where: { id: auth.userId },
      data,
      select: { id: true, email: true, username: true, handle: true, name: true, role: true, photoUrl: true },
    })

    // Perfil de Artist (se existir) reflete o nome artístico exibido nas faixas
    if (artisticName !== undefined) {
      await prisma.artist.updateMany({
        where: { userId: auth.userId },
        data: { name: artisticName },
      })
    }

    return NextResponse.json({ ok: true, user: updated })
  } catch (err: unknown) {
    if (
      typeof err === 'object' && err !== null &&
      'code' in err && (err as { code: string }).code === 'P2002'
    ) {
      return NextResponse.json({ error: 'Esse @ já está em uso', code: 'HANDLE_TAKEN' }, { status: 409 })
    }
    throw err
  }
})
