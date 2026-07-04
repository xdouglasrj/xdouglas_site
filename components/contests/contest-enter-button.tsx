'use client'

import Link from 'next/link'
import { useAuthPopup } from '@/components/auth/AuthPopupProvider'

// ============================================================
// V3 Plano 6 — botão "Participar". Anônimo -> popup de login (ação exige
// conta). Logado -> vai para o upload já vinculado ao contest via
// ?contestId=. Depois do deadline, desabilita ("Encerrado").
// ============================================================

interface ContestEnterButtonProps {
  contestId: string
  isLoggedIn: boolean
  isOpen: boolean
  alreadyEntered: boolean
}

export function ContestEnterButton({ contestId, isLoggedIn, isOpen, alreadyEntered }: ContestEnterButtonProps) {
  const { openLogin } = useAuthPopup()

  if (!isOpen) {
    return (
      <button
        type="button"
        disabled
        className="rounded-lg bg-neutral-800 px-5 py-2.5 text-sm font-semibold text-neutral-500 cursor-not-allowed"
      >
        Encerrado
      </button>
    )
  }

  if (alreadyEntered) {
    return (
      <span className="inline-flex items-center rounded-lg border border-emerald-800/60 bg-emerald-950/30 px-5 py-2.5 text-sm font-semibold text-emerald-400">
        Você já participou ✓
      </span>
    )
  }

  if (!isLoggedIn) {
    return (
      <button
        type="button"
        onClick={() => openLogin()}
        className="rounded-lg bg-gate-pink px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
      >
        Participar
      </button>
    )
  }

  return (
    <Link
      href={`/upload?contestId=${contestId}`}
      className="inline-block rounded-lg bg-gate-pink px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
    >
      Participar
    </Link>
  )
}
