'use client'

import { useState } from 'react'

// ============================================================
// V3 Plano 6 — tabs "Detalhes" / "Submissões (n)" na página do contest.
// Client simples (useState) — o conteúdo de cada aba já vem pronto do
// servidor via children, sem novo fetch ao trocar de aba.
// ============================================================

interface ContestTabsProps {
  submissionCount: number
  detailsContent: React.ReactNode
  submissionsContent: React.ReactNode
}

export function ContestTabs({ submissionCount, detailsContent, submissionsContent }: ContestTabsProps) {
  const [tab, setTab] = useState<'details' | 'submissions'>('details')

  return (
    <div>
      <div className="flex gap-1 border-b border-gate-azure">
        <TabButton active={tab === 'details'} onClick={() => setTab('details')}>
          Detalhes
        </TabButton>
        <TabButton active={tab === 'submissions'} onClick={() => setTab('submissions')}>
          Submissões ({submissionCount})
        </TabButton>
      </div>

      <div className="pt-6">
        {tab === 'details' ? detailsContent : submissionsContent}
      </div>
    </div>
  )
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-4 py-2.5 text-sm font-medium border-b-2 transition ${
        active
          ? 'border-gate-pink text-gate-pink'
          : 'border-transparent text-gate-blue hover:text-white'
      }`}
    >
      {children}
    </button>
  )
}
