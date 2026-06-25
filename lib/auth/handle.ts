import { prisma } from '@/lib/prisma'

// Faixa Unicode dos sinais diacríticos combinantes (acentos), construída via
// código para evitar caracteres de combinação literais no arquivo-fonte
const REMOVE_DIACRITICS = new RegExp(
  `[${String.fromCharCode(0x0300)}-${String.fromCharCode(0x036f)}]`,
  'g'
)

export const HANDLE_REGEX = /^[a-z0-9_]+$/

export function slugifyHandle(seed: string): string {
  return (
    seed
      .toLowerCase()
      .normalize('NFD')
      .replace(REMOVE_DIACRITICS, '')
      .replace(/[^a-z0-9\s_]/g, '')
      .trim()
      .replace(/\s+/g, '_')
      .replace(/_+/g, '_')
      .slice(0, 24) || 'membro'
  )
}

// @ público da comunidade — gerado a partir do nome no cadastro. Separado do
// username de login (ver comentário no schema.prisma) para que o login não
// fique descobrível a partir do perfil público.
export async function generateUniqueHandle(seed: string, excludeUserId?: string): Promise<string> {
  const base = slugifyHandle(seed)

  let handle = base
  let attempt = 0
  while (true) {
    const existing = await prisma.user.findUnique({
      where: { handle },
      select: { id: true },
    })
    if (!existing || existing.id === excludeUserId) return handle
    attempt++
    handle = `${base}${attempt}`
  }
}
