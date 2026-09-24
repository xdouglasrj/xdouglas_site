'use client'

import DevelopmentCard from './DevelopmentCard'
import { developmentItems } from '@/app/data/development'

export default function DevelopmentProjects() {
  const items = developmentItems

  if (items.length === 0) {
    return null
  }

  return (
    <section className="mt-10 sm:mt-14">
      <p className="text-[0.75rem] font-semibold uppercase tracking-[0.14em] text-gate-blue">
        Em desenvolvimento
      </p>
      <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <DevelopmentCard key={item.slug} {...item} />
        ))}
      </div>
    </section>
  )
}
