'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { UserPlan } from '@prisma/client'

export function PlanToggle({ userId, plan }: { userId: string; plan: UserPlan }) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)

  async function toggle() {
    const next: UserPlan = plan === 'PAID' ? 'FREE' : 'PAID'
    if (next === 'PAID' && !confirm('Confirmar Pix recebido e liberar o plano pago para este usuário?')) return
    if (next === 'FREE' && !confirm('Voltar este usuário para o plano grátis?')) return

    setBusy(true)
    try {
      const res = await fetch(`/api/admin/usuarios/${userId}/plan`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: next }),
      })
      if (res.ok) router.refresh()
    } finally {
      setBusy(false)
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={busy}
      className={[
        'inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium border transition-colors disabled:opacity-50',
        plan === 'PAID'
          ? 'bg-amber-950/60 text-amber-400 border-amber-800/60 hover:bg-amber-900/60'
          : 'bg-neutral-800 text-neutral-400 border-neutral-700 hover:bg-neutral-700',
      ].join(' ')}
      title={plan === 'PAID' ? 'Clique para voltar ao plano grátis' : 'Clique para liberar o plano pago'}
    >
      {plan === 'PAID' ? 'Pago' : 'Grátis'}
    </button>
  )
}
