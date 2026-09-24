'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'

type Props = {
  image: string
  category: string
  name: string
  description: string
  href?: string
  external?: boolean
}

export default function DevelopmentCard({ image, category, name, description, href, external }: Props) {
  const [imgError, setImgError] = useState(false)

  const content = (
    <div className="relative aspect-[4/5] w-full overflow-hidden rounded-[1.75rem] border border-[#2b2b31] bg-[#151519] shadow-[0_24px_70px_-32px_rgb(0_0_0/0.72)] motion-safe:transition-[transform,opacity] motion-safe:duration-[520ms] motion-safe:ease-[cubic-bezier(0.16,1,0.3,1)] motion-safe:group-hover:scale-[1.015] motion-safe:group-focus-visible:scale-[1.015] group-active:scale-[0.99]">
      {!imgError ? (
        <Image
          src={image}
          alt={`${name} - captura da página`}
          width={800}
          height={1000}
          sizes="(max-width: 640px) 85vw, (max-width: 1024px) 52vw, 480px"
          className="absolute inset-0 h-full w-full object-cover object-top"
          onError={() => setImgError(true)}
        />
      ) : (
        <div className="absolute inset-0 bg-[#151519]" aria-hidden />
      )}
      <div
        className="absolute inset-0 rounded-[1.75rem] pointer-events-none"
        style={{
          background:
            'linear-gradient(to top, rgb(0 0 0 / 0.88) 0%, rgb(0 0 0 / 0.45) 42%, rgb(0 0 0 / 0.08) 72%, transparent 100%)',
        }}
        aria-hidden
      />
      <div className="absolute inset-x-0 bottom-0 p-6 sm:p-7">
        <p className="text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-white/70">{category}</p>
        <h3 className="mt-1.5 text-[clamp(1.4rem,2.2vw,1.9rem)] font-semibold leading-none tracking-[-0.02em] text-white">
          {name}
        </h3>
        <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-white/75">{description}</p>
        <div className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold">
          <span className="text-brand-accent">Em desenvolvimento</span>
          {href && <span className="ml-2 text-brand-accent">Ver prévia</span>}
        </div>
      </div>
    </div>
  )

  if (href) {
    if (external) {
      return (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="group block rounded-[1.75rem] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#0b0b0d]"
        >
          {content}
        </a>
      )
    }

    return (
      <Link
        href={href}
        className="group block rounded-[1.75rem] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#0b0b0d]"
      >
        {content}
      </Link>
    )
  }

  return <div className="block rounded-[1.75rem]">{content}</div>
}
