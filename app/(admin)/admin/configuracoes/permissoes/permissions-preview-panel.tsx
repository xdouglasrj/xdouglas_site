'use client'

import { useState } from 'react'
import { PERMISSION_GROUPS, type PermissionId } from './permission-groups'
import { PermissionCheckbox } from './permission-checkbox'

export interface PermissionsPreviewUser {
  id: string
  displayName: string
  username: string | null
  artisticName: string | null
  email: string
  role: string
}

const ROLE_LABEL: Record<string, string> = {
  GUEST: 'Visitante',
  MEMBER: 'Membro',
  ARTIST: 'Músico/Produtor',
  ARTIST_SUPPORTER: 'Apoiador',
  ADMIN: 'Admin',
}

export function PermissionsPreviewPanel({ users }: { users: PermissionsPreviewUser[] }) {
  // Estado só local — nada é salvo no banco, é uma simulação para revisar a lista.
  const [selected, setSelected] = useState<Record<string, Set<PermissionId>>>({})

  function toggle(userId: string, permissionId: PermissionId, checked: boolean) {
    setSelected((prev) => {
      const current = new Set(prev[userId] ?? [])
      if (checked) current.add(permissionId)
      else current.delete(permissionId)
      return { ...prev, [userId]: current }
    })
  }

  return (
    <div className="space-y-4">
      {users.map((user) => {
        const userSelected = selected[user.id] ?? new Set<PermissionId>()
        return (
          <div key={user.id} className="rounded-xl border border-neutral-800 bg-neutral-900 p-4">
            <div className="flex items-center justify-between gap-3 flex-wrap mb-3">
              <div>
                <p className="font-medium text-neutral-200">
                  {user.displayName}
                  {user.username && (
                    <span className="ml-2 text-xs font-mono text-rose-400/80">@{user.username}</span>
                  )}
                </p>
                {user.artisticName && user.artisticName !== user.displayName && (
                  <p className="text-xs text-purple-400/80">🎤 {user.artisticName}</p>
                )}
                <p className="text-xs text-neutral-600">{user.email}</p>
              </div>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium border border-neutral-700 bg-neutral-800 text-neutral-400">
                {ROLE_LABEL[user.role] ?? user.role}
              </span>
            </div>

            <div className="space-y-3">
              {PERMISSION_GROUPS.map((group) => {
                const locked = 'locked' in group && group.locked
                return (
                  <div key={group.title}>
                    <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-neutral-500 mb-1.5">
                      {group.title}
                      {locked && (
                        <span className="inline-flex items-center gap-1 text-[9px] font-medium normal-case tracking-normal text-neutral-600">
                          (trancado — só ADMIN)
                        </span>
                      )}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {group.items.map((item) => (
                        <PermissionCheckbox
                          key={item.id}
                          label={item.label}
                          checked={userSelected.has(item.id)}
                          onChange={(checked) => toggle(user.id, item.id, checked)}
                          locked={locked}
                        />
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>

            {userSelected.size > 0 && (
              <p className="mt-3 text-[11px] text-neutral-500">
                {userSelected.size} permissão{userSelected.size !== 1 ? 'ões' : ''} marcada{userSelected.size !== 1 ? 's' : ''} (apenas neste teste, nada foi salvo).
              </p>
            )}
          </div>
        )
      })}
    </div>
  )
}
