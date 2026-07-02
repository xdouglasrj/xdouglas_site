'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { PERMISSION_GROUPS, type PermissionId } from '@/lib/permissions/catalog'
import { PermissionCheckbox } from './permission-checkbox'

export interface PermissionsPanelUser {
  id: string
  displayName: string
  username: string | null
  artisticName: string | null
  email: string
  role: string
  permissions: string[]
}

const ROLE_LABEL: Record<string, string> = {
  GUEST: 'Visitante',
  MEMBER: 'Membro',
  ARTIST: 'Músico/Produtor',
  ARTIST_SUPPORTER: 'Apoiador',
  MODERATOR: 'Moderador',
  ADMIN: 'Admin',
}

export function PermissionsPanel({ users }: { users: PermissionsPanelUser[] }) {
  const router = useRouter()
  const [selected, setSelected] = useState<Record<string, Set<PermissionId>>>(() =>
    Object.fromEntries(users.map((u) => [u.id, new Set(u.permissions as PermissionId[])]))
  )
  const [saving, setSaving] = useState<string | null>(null)
  const [savedAt, setSavedAt] = useState<Record<string, number>>({})
  const [error, setError] = useState<Record<string, string>>({})

  function toggle(userId: string, permissionId: PermissionId, checked: boolean) {
    setSelected((prev) => {
      const current = new Set(prev[userId] ?? [])
      if (checked) current.add(permissionId)
      else current.delete(permissionId)
      return { ...prev, [userId]: current }
    })
  }

  async function save(userId: string) {
    setSaving(userId)
    setError((prev) => ({ ...prev, [userId]: '' }))
    try {
      const res = await fetch(`/api/admin/usuarios/${userId}/permissions`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ permissions: Array.from(selected[userId] ?? []) }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Erro ao salvar permissões')
      }
      setSavedAt((prev) => ({ ...prev, [userId]: Date.now() }))
      router.refresh()
    } catch (err) {
      setError((prev) => ({ ...prev, [userId]: err instanceof Error ? err.message : 'Erro ao salvar' }))
    } finally {
      setSaving(null)
    }
  }

  return (
    <div className="space-y-4">
      {users.map((user) => {
        const userSelected = selected[user.id] ?? new Set<PermissionId>()
        const dirty =
          userSelected.size !== user.permissions.length ||
          !user.permissions.every((p) => userSelected.has(p as PermissionId))
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

            <div className="mt-4 flex items-center gap-3">
              <button
                onClick={() => save(user.id)}
                disabled={saving === user.id || !dirty}
                className="rounded-lg bg-gate-pink px-4 py-1.5 text-xs font-semibold text-white transition disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gate-pink/90"
              >
                {saving === user.id ? 'Salvando...' : 'Salvar permissões'}
              </button>
              {!dirty && savedAt[user.id] && (
                <span className="text-[11px] text-emerald-400">Salvo</span>
              )}
              {error[user.id] && <span className="text-[11px] text-red-400">{error[user.id]}</span>}
              {userSelected.size > 0 && (
                <span className="text-[11px] text-neutral-500">
                  {userSelected.size} permissão{userSelected.size !== 1 ? 'ões' : ''} marcada{userSelected.size !== 1 ? 's' : ''}
                </span>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
