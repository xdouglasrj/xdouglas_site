import Link from 'next/link'
import type { ProfileCompletenessItem } from '@/lib/profile-completeness'

interface ProfileCompletenessWidgetProps {
  percent: number
  items: ProfileCompletenessItem[]
}

// Card "Seu perfil está X% completo" — só o dono vê (renderizado apenas em
// /perfil/editar, que já exige login) e some sozinho quando o pai (a
// página) não o renderiza mais ao bater 100% (ver app/perfil/editar/page.tsx).
export function ProfileCompletenessWidget({ percent, items }: ProfileCompletenessWidgetProps) {
  const pending = items.filter((item) => !item.done)

  return (
    <section className="mb-6 rounded-lg border border-gate-azure bg-white/5 p-4">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-sm font-bold text-white">Seu perfil está {percent}% completo</h2>
        <span className="text-xs text-gate-blue">{items.length - pending.length}/{items.length}</span>
      </div>

      <div className="mt-2 h-1.5 w-full rounded-full bg-white/10">
        <div
          className="h-1.5 rounded-full bg-gate-pink transition-all"
          style={{ width: `${percent}%` }}
        />
      </div>

      <p className="mt-2 text-[11px] text-white/40">
        Complete todos os itens e ganhe pontos de bônus.
      </p>

      <ul className="mt-3 flex flex-col gap-1.5">
        {items.map((item) => (
          <li key={item.key}>
            {item.done ? (
              <span className="flex items-center gap-2 text-xs text-white/50">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0 text-emerald-400" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                <span className="line-through">{item.label}</span>
              </span>
            ) : (
              <Link
                href={item.actionHref}
                className="flex items-center gap-2 text-xs text-white/80 transition hover:text-gate-pink"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0 text-white/30" aria-hidden="true">
                  <circle cx="12" cy="12" r="9" />
                </svg>
                {item.label}
              </Link>
            )}
          </li>
        ))}
      </ul>
    </section>
  )
}
