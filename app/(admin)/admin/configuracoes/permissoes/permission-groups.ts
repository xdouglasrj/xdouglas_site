/**
 * Catálogo de permissões candidatas para moderadores — fase de revisão.
 * Nada aqui é persistido ainda; é só a lista que o admin está validando
 * antes de virar campo real no banco (User.role ganhar MODERATOR e uma
 * tabela de permissões, ou equivalente).
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
