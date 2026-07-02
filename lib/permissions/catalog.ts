/**
 * Catálogo de permissões de moderador — fonte única de verdade dos ids
 * válidos, usada tanto no front (grade de checkboxes) quanto no backend
 * (validação ao salvar e checagem de acesso em cada rota admin).
 */
export const PERMISSION_GROUPS = [
  {
    title: 'Conteúdo musical',
    items: [
      { id: 'musicas.moderar', label: 'Aprovar / remover músicas' },
      { id: 'musicas.editar', label: 'Editar metadados de músicas' },
    ],
  },
  {
    title: 'Comunidade',
    items: [
      { id: 'denuncias.gerenciar', label: 'Gerenciar denúncias' },
      { id: 'forum.moderar', label: 'Moderar fórum (apagar/trancar)' },
      { id: 'feed.moderar', label: 'Moderar feed (posts e comentários)' },
      { id: 'comunidade.fixar', label: 'Fixar/destacar publicações' },
    ],
  },
  {
    title: 'Usuários',
    items: [
      { id: 'usuarios.visualizar', label: 'Visualizar usuários' },
      { id: 'usuarios.bloquear', label: 'Bloquear / desbloquear usuários' },
      { id: 'usuarios.editar', label: 'Editar perfil de usuários' },
      { id: 'convites.gerenciar', label: 'Gerenciar convites' },
    ],
  },
  {
    title: 'Suporte',
    items: [
      { id: 'suporte.responder', label: 'Responder tickets de suporte' },
      { id: 'suporte.resolver', label: 'Marcar ticket como resolvido' },
    ],
  },
  {
    title: 'Administração',
    // Trancado — exclusivo do ADMIN, nunca atribuível a um moderador.
    locked: true,
    items: [
      { id: 'config.acessar', label: 'Acessar configurações do site' },
      { id: 'permissoes.gerenciar', label: 'Gerenciar permissões de moderadores' },
      { id: 'vinheta.enviar', label: 'Enviar vinheta/aviso geral' },
    ],
  },
] as const

export type PermissionId = (typeof PERMISSION_GROUPS)[number]['items'][number]['id']

export const ALL_PERMISSION_IDS: PermissionId[] = PERMISSION_GROUPS.flatMap((g) => g.items.map((i) => i.id))

export const LOCKED_PERMISSION_IDS: PermissionId[] = PERMISSION_GROUPS
  .filter((g) => 'locked' in g && g.locked)
  .flatMap((g) => g.items.map((i) => i.id))

export function isValidPermissionId(id: string): id is PermissionId {
  return (ALL_PERMISSION_IDS as string[]).includes(id)
}

// Pura (sem dependência de servidor/Prisma) — pode ser importada por
// componentes client, além do backend. ADMIN sempre true; MODERATOR
// checa o array; outros roles sempre false.
export function hasPermission(
  user: { role: string; permissions: string[] },
  permissionId: PermissionId
): boolean {
  if (user.role === 'ADMIN') return true
  if (user.role === 'MODERATOR') return user.permissions.includes(permissionId)
  return false
}
