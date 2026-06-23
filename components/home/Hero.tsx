'use client'

import Link from 'next/link'

export function Hero() {
  return (
    <section className="relative flex min-h-screen items-center overflow-hidden bg-[#080808]">
      {/* Glow radial de fundo */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
        style={{
          width: '900px',
          height: '600px',
          background: 'radial-gradient(ellipse at center, rgba(79,140,255,0.07) 0%, transparent 70%)',
        }}
      />

      {/* Glow ciano topo direito */}
      <div
        aria-hidden
        className="pointer-events-none absolute -right-40 -top-40"
        style={{
          width: '600px',
          height: '600px',
          background: 'radial-gradient(ellipse at center, rgba(103,232,249,0.05) 0%, transparent 65%)',
        }}
      />

      {/* ── Linha de osciloscópio — assinatura visual ── */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-0 right-0"
        style={{ top: '62%' }}
      >
        <svg
          viewBox="0 0 1440 60"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full"
          preserveAspectRatio="none"
          style={{ height: '60px' }}
        >
          <defs>
            <linearGradient id="lineGrad" x1="0" y1="0" x2="1440" y2="0" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#4F8CFF" stopOpacity="0" />
              <stop offset="15%" stopColor="#4F8CFF" stopOpacity="0.4" />
              <stop offset="40%" stopColor="#67E8F9" stopOpacity="0.8" />
              <stop offset="60%" stopColor="#4F8CFF" stopOpacity="0.9" />
              <stop offset="85%" stopColor="#4F8CFF" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#4F8CFF" stopOpacity="0" />
            </linearGradient>
            <filter id="glow">
              <feGaussianBlur stdDeviation="2" result="blur" />
              <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
            </filter>
          </defs>
          {/* Linha base */}
          <path
            d="M0 30 L200 30 L240 30 L280 8 L320 52 L360 15 L400 42 L440 22 L480 38 L520 28 L560 30 L720 30 L760 30 L800 18 L840 44 L880 20 L920 40 L960 30 L1200 30 L1440 30"
            stroke="url(#lineGrad)"
            strokeWidth="1.5"
            filter="url(#glow)"
          />
          {/* Glow adicional */}
          <path
            d="M0 30 L200 30 L240 30 L280 8 L320 52 L360 15 L400 42 L440 22 L480 38 L520 28 L560 30 L720 30 L760 30 L800 18 L840 44 L880 20 L920 40 L960 30 L1200 30 L1440 30"
            stroke="#67E8F9"
            strokeWidth="0.5"
            strokeOpacity="0.4"
          />
        </svg>
      </div>

      {/* Grid de pontos decorativo */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: 'radial-gradient(circle, #ffffff 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />

      {/* Conteúdo */}
      <div className="relative z-10 mx-auto w-full max-w-7xl px-4 pb-32 pt-40 md:px-8">
        {/* Eyebrow */}
        <div className="mb-8 inline-flex items-center gap-2.5 rounded-full border border-[#67E8F9]/20 bg-[#67E8F9]/5 px-4 py-2">
          <span
            className="h-1.5 w-1.5 rounded-full bg-[#67E8F9]"
            style={{ boxShadow: '0 0 6px #67E8F9' }}
          />
          <span className="text-xs font-medium tracking-wider text-[#67E8F9]">
            COMUNIDADE MUSICAL INDEPENDENTE
          </span>
        </div>

        {/* Título */}
        <h1 className="mb-6 font-['Manrope'] text-5xl font-extrabold leading-none tracking-tight text-white md:text-7xl lg:text-8xl">
          A nova geração<br />
          <span
            className="bg-gradient-to-r from-[#4F8CFF] to-[#67E8F9] bg-clip-text text-transparent"
          >
            da música independente.
          </span>
        </h1>

        {/* Subtítulo */}
        <p className="mb-10 max-w-xl font-['Manrope'] text-lg leading-relaxed text-[#94A3B8] md:text-xl">
          Descubra artistas antes de todo mundo.<br />
          Compartilhe seus sons com quem entende.<br />
          Construa conexões que duram.
        </p>

        {/* CTAs */}
        <div className="flex flex-wrap items-center gap-4">
          <Link
            href="/musicas"
            className="inline-flex items-center gap-2 rounded-xl bg-[#4F8CFF] px-7 py-4 text-sm font-semibold text-white shadow-lg shadow-[#4F8CFF]/20 transition hover:bg-[#4F8CFF]/90 hover:shadow-[#4F8CFF]/30"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <polygon points="5 3 19 12 5 21 5 3" fill="currentColor" stroke="none"/>
            </svg>
            Explorar músicas
          </Link>

          <Link
            href="/convite"
            className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-7 py-4 text-sm font-semibold text-white transition hover:border-white/25 hover:bg-white/10"
          >
            Entrar na comunidade
            <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>
        </div>

        {/* Stats discretos */}
        <div className="mt-16 flex flex-wrap items-center gap-8">
          {[
            { value: '200+', label: 'Músicas exclusivas' },
            { value: '80+', label: 'Artistas independentes' },
            { value: '12k+', label: 'Downloads na comunidade' },
          ].map((stat) => (
            <div key={stat.label} className="flex items-baseline gap-2.5">
              <span className="font-['Manrope'] text-2xl font-bold text-white">{stat.value}</span>
              <span className="text-sm text-[#94A3B8]">{stat.label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
